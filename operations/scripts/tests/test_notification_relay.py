import unittest

from scripts.notification_relay import (
    RelayError,
    parse_notifications,
    reconcile_pending_acknowledgements,
    relay_notifications,
)


class NotificationRelayTests(unittest.TestCase):
    def test_acknowledges_only_successful_shortcut_deliveries(self) -> None:
        acknowledged: list[int] = []
        notifications = [
            {"id": 1, "message": "first"},
            {"id": 2, "message": "second"},
        ]

        delivered = relay_notifications(
            notifications,
            lambda message: message == "second",
            acknowledged.append,
            set(),
            lambda _: None,
            lambda _: None,
        )

        self.assertEqual(delivered, 1)
        self.assertEqual(acknowledged, [2])

    def test_retries_ack_without_redelivering_after_transient_failure(self) -> None:
        pending_ack: set[int] = set()
        delivered: list[str] = []
        attempts = 0

        def acknowledge(_: int) -> None:
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise RelayError("temporary ack failure")

        with self.assertRaises(RelayError):
            relay_notifications(
                [{"id": 7, "message": "once"}],
                lambda message: delivered.append(message) is None,
                acknowledge,
                pending_ack,
                pending_ack.add,
                pending_ack.discard,
            )

        self.assertEqual(delivered, ["once"])
        self.assertEqual(pending_ack, {7})
        self.assertEqual(
            relay_notifications(
                [{"id": 7, "message": "once"}],
                lambda message: delivered.append(message) is None,
                acknowledge,
                pending_ack,
                pending_ack.add,
                pending_ack.discard,
            ),
            1,
        )
        self.assertEqual(delivered, ["once"])
        self.assertEqual(pending_ack, set())

    def test_rejects_oversized_or_malformed_notifications(self) -> None:
        with self.assertRaises(RelayError):
            parse_notifications(b'{"notifications":[{"id":1,"message":""}]}')
        with self.assertRaises(RelayError):
            parse_notifications(b'{"notifications":"not-a-list"}')

    def test_reconciles_journaled_acknowledgements_even_when_listing_omits_them(self) -> None:
        pending = {9, 4}
        acknowledged: list[int] = []

        reconcile_pending_acknowledgements(
            pending,
            acknowledged.append,
            pending.discard,
        )

        self.assertEqual(acknowledged, [4, 9])
        self.assertEqual(pending, set())


if __name__ == "__main__":
    unittest.main()
