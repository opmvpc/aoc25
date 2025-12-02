-- 🏆 AoC 2025 Battle Royale - Database Schema

-- Days table: stores puzzle info and expected answers
CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY,  -- 0-12 (0 = test day, 1-12 = competition days)
    puzzle1_md TEXT,
    puzzle2_md TEXT,
    sample_input TEXT,
    sample_expected_p1 TEXT,
    sample_expected_p2 TEXT,
    final_input TEXT,
    answer_p1 TEXT,
    answer_p2 TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Runs table: individual solution executions
CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL CHECK (agent IN ('claude', 'codex', 'gemini')),
    day INTEGER NOT NULL,
    part INTEGER NOT NULL CHECK (part IN (1, 2)),
    language TEXT NOT NULL CHECK (language IN ('ts', 'c')),
    answer TEXT,
    time_ms REAL NOT NULL,
    is_correct INTEGER,  -- 1 = true, 0 = false, NULL = not checked
    is_sample INTEGER NOT NULL DEFAULT 0,  -- 1 = sample, 0 = final
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (day) REFERENCES days(id)
);

-- Benchmark sessions: groups of 100 runs for statistical analysis
CREATE TABLE IF NOT EXISTS benchmark_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL CHECK (agent IN ('claude', 'codex', 'gemini')),
    day INTEGER NOT NULL,
    part INTEGER NOT NULL CHECK (part IN (1, 2)),
    language TEXT NOT NULL CHECK (language IN ('ts', 'c')),
    num_runs INTEGER NOT NULL DEFAULT 100,
    answer TEXT,
    is_correct INTEGER,
    -- Computed stats
    avg_time_ms REAL,
    min_time_ms REAL,
    max_time_ms REAL,
    std_dev_ms REAL,
    p50_time_ms REAL,  -- median
    p95_time_ms REAL,
    p99_time_ms REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (day) REFERENCES days(id)
);

-- Individual benchmark runs within a session
CREATE TABLE IF NOT EXISTS benchmark_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    run_index INTEGER NOT NULL,  -- 0-99
    time_ms REAL NOT NULL,

    FOREIGN KEY (session_id) REFERENCES benchmark_sessions(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_runs_agent_day ON runs(agent, day);
CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at);
CREATE INDEX IF NOT EXISTS idx_benchmark_sessions_agent_day ON benchmark_sessions(agent, day);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_session ON benchmark_runs(session_id);

-- Trigger to update updated_at on days
CREATE TRIGGER IF NOT EXISTS update_days_timestamp
AFTER UPDATE ON days
BEGIN
    UPDATE days SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
