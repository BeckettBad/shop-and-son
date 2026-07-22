CREATE TABLE scheduled_job_runs (
  job_name TEXT NOT NULL,
  run_date TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (job_name, run_date)
);