#!/usr/bin/env python3
"""Deliver pending Shop & Sons alerts through a local macOS Shortcut."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

KEYCHAIN_SERVICE = "shop-and-son-operations"
KEYCHAIN_ACCOUNT = "notification-api-token"
MAX_RESPONSE_BYTES = 65_536
MAX_MESSAGE_LENGTH = 2_000
DEFAULT_JOURNAL_PATH = Path.home() / "Library/Application Support/ShopAndSonOperations/pending-acks.json"


class RelayError(RuntimeError):
    pass


class DeliveryJournal:
    def __init__(self, path: Path = DEFAULT_JOURNAL_PATH) -> None:
        self.path = path

    def load(self) -> set[int]:
        if not self.path.exists():
            return set()
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
            raise RelayError("Notification delivery journal is unreadable") from error
        if (
            not isinstance(payload, list)
            or len(payload) > 1_000
            or any(not isinstance(value, int) or value < 1 for value in payload)
        ):
            raise RelayError("Notification delivery journal is invalid")
        return set(payload)

    def _write(self, values: set[int]) -> None:
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        try:
            temporary.write_text(json.dumps(sorted(values)), encoding="utf-8")
            temporary.chmod(0o600)
            os.replace(temporary, self.path)
        except OSError as error:
            raise RelayError("Notification delivery journal could not be saved") from error

    def mark(self, values: set[int], notification_id: int) -> None:
        values.add(notification_id)
        self._write(values)

    def clear(self, values: set[int], notification_id: int) -> None:
        values.discard(notification_id)
        self._write(values)


def validate_base_url(value: str) -> str:
    parsed = urlparse(value)
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or parsed.path not in ("", "/")
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        raise RelayError("OPERATIONS_BASE_URL must be an HTTPS origin without embedded credentials")
    return f"https://{parsed.netloc}"


def read_keychain_token() -> str:
    result = subprocess.run(
        [
            "/usr/bin/security",
            "find-generic-password",
            "-s",
            KEYCHAIN_SERVICE,
            "-a",
            KEYCHAIN_ACCOUNT,
            "-w",
        ],
        capture_output=True,
        check=False,
        text=True,
    )
    token = result.stdout.strip()
    if result.returncode != 0 or not token:
        raise RelayError(
            "Notification token is missing from macOS Keychain; see operations/README.md"
        )
    return token


def api_request(base_url: str, token: str, path: str, method: str = "GET") -> bytes:
    request = urllib.request.Request(
        f"{base_url}{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "shop-and-son-notification-relay/1",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(body) > MAX_RESPONSE_BYTES:
                raise RelayError("Operations API response exceeded the safety limit")
            return body
    except urllib.error.HTTPError as error:
        raise RelayError(f"Operations API returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise RelayError("Operations API is unreachable") from error


def parse_notifications(body: bytes) -> list[dict[str, Any]]:
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RelayError("Operations API returned malformed JSON") from error
    rows = payload.get("notifications") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or len(rows) > 10:
        raise RelayError("Operations API returned an invalid notification list")

    notifications: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            raise RelayError("Operations API returned an invalid notification")
        notification_id = row.get("id")
        message = row.get("message")
        if (
            not isinstance(notification_id, int)
            or notification_id < 1
            or not isinstance(message, str)
            or not message
            or len(message) > MAX_MESSAGE_LENGTH
        ):
            raise RelayError("Operations API returned an invalid notification")
        notifications.append({"id": notification_id, "message": message})
    return notifications


def run_shortcut(shortcut_name: str, message: str) -> bool:
    result = subprocess.run(
        ["/usr/bin/shortcuts", "run", shortcut_name, "-i", "-"],
        input=message,
        check=False,
        text=True,
        timeout=30,
    )
    return result.returncode == 0


def reconcile_pending_acknowledgements(
    pending_ack: set[int],
    acknowledge: Callable[[int], None],
    clear_pending: Callable[[int], None],
) -> None:
    for notification_id in sorted(pending_ack):
        acknowledge(notification_id)
        clear_pending(notification_id)


def relay_notifications(
    notifications: list[dict[str, Any]],
    deliver: Callable[[str], bool],
    acknowledge: Callable[[int], None],
    pending_ack: set[int],
    mark_pending: Callable[[int], None],
    clear_pending: Callable[[int], None],
) -> int:
    delivered = 0
    for notification in notifications:
        notification_id = notification["id"]
        if notification_id not in pending_ack:
            if not deliver(notification["message"]):
                continue
            mark_pending(notification_id)
        acknowledge(notification_id)
        clear_pending(notification_id)
        delivered += 1
    return delivered


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default=os.environ.get("OPERATIONS_BASE_URL", ""),
        help="Deployed Operations Worker HTTPS origin",
    )
    parser.add_argument(
        "--shortcut",
        default=os.environ.get("OPERATIONS_SHORTCUT_NAME", "Shop and Sons Operations Alert"),
        help="macOS Shortcut that accepts alert text on stdin",
    )
    args = parser.parse_args()

    try:
        base_url = validate_base_url(args.base_url)
        token = read_keychain_token()
        journal = DeliveryJournal()
        pending_ack = journal.load()

        def acknowledge(notification_id: int) -> None:
            api_request(
                base_url,
                token,
                f"/api/notifications/{notification_id}/ack",
                "POST",
            )

        reconcile_pending_acknowledgements(
            pending_ack,
            acknowledge,
            lambda notification_id: journal.clear(pending_ack, notification_id),
        )
        notifications = parse_notifications(api_request(base_url, token, "/api/notifications"))
        relay_notifications(
            notifications,
            lambda message: run_shortcut(args.shortcut, message),
            acknowledge,
            pending_ack,
            lambda notification_id: journal.mark(pending_ack, notification_id),
            lambda notification_id: journal.clear(pending_ack, notification_id),
        )
        return 0
    except (RelayError, subprocess.TimeoutExpired) as error:
        print(f"notification relay failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
