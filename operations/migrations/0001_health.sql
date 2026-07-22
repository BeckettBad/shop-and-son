CREATE TABLE health_probes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  healthy INTEGER NOT NULL CHECK (healthy IN (0, 1)),
  status_code INTEGER,
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  detail TEXT NOT NULL
);

CREATE INDEX health_probes_target_checked_at
  ON health_probes (target, checked_at DESC);

CREATE TABLE target_states (
  target TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'pending', 'open')),
  consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  opened_at TEXT,
  first_failure_detail TEXT NOT NULL DEFAULT '',
  latest_detail TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  recovered_at TEXT,
  first_detail TEXT NOT NULL,
  latest_detail TEXT NOT NULL
);

CREATE UNIQUE INDEX incidents_one_open_per_target
  ON incidents (target)
  WHERE recovered_at IS NULL;

CREATE INDEX incidents_target_opened_at
  ON incidents (target, opened_at DESC);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('opened', 'reminder', 'recovered')),
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  dedupe_key TEXT NOT NULL UNIQUE
);