-- PECDF schema for PostgreSQL (Neon-compatible).
--
-- Prefer: start the FastAPI app once with DATABASE_URL set — SQLAlchemy runs
--   Base.metadata.create_all() and applies the same logical schema.
--
-- Use this script if you want to create tables manually (SQL Editor / psql).


CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS agent_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    macro_pkr DOUBLE PRECISION,
    macro_oil DOUBLE PRECISION,
    macro_conf DOUBLE PRECISION,
    message_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_agent_sessions_user_id ON agent_sessions (user_id);

CREATE TABLE IF NOT EXISTS agent_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES agent_sessions (id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    tools_used TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_agent_messages_session_id ON agent_messages (session_id);
CREATE INDEX IF NOT EXISTS ix_agent_messages_created_at ON agent_messages (created_at);

CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    hs_code VARCHAR(10) NOT NULL,
    commodity_name VARCHAR(100) NOT NULL,
    start_month INTEGER NOT NULL,
    n_months INTEGER NOT NULL,
    usd_pkr DOUBLE PRECISION NOT NULL,
    brent_oil DOUBLE PRECISION NOT NULL,
    us_confidence DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_forecasts_user_id ON forecasts (user_id);
CREATE INDEX IF NOT EXISTS ix_forecasts_hs_code ON forecasts (hs_code);
CREATE INDEX IF NOT EXISTS ix_forecasts_start_month ON forecasts (start_month);

CREATE TABLE IF NOT EXISTS forecast_results (
    id SERIAL PRIMARY KEY,
    forecast_id INTEGER NOT NULL REFERENCES forecasts (id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    predicted_usd DOUBLE PRECISION NOT NULL,
    lower_bound DOUBLE PRECISION NOT NULL,
    upper_bound DOUBLE PRECISION NOT NULL,
    step_number INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_forecast_results_forecast_id ON forecast_results (forecast_id);

CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    hs_code VARCHAR(10) NOT NULL,
    commodity_name VARCHAR(100) NOT NULL,
    variable_name VARCHAR(20) NOT NULL,
    target_month INTEGER NOT NULL,
    n_months INTEGER NOT NULL DEFAULT 1,
    range_min DOUBLE PRECISION NOT NULL,
    range_max DOUBLE PRECISION NOT NULL,
    steps INTEGER NOT NULL DEFAULT 10,
    fixed_pkr DOUBLE PRECISION,
    fixed_oil DOUBLE PRECISION,
    fixed_conf DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_scenarios_user_id ON scenarios (user_id);

CREATE TABLE IF NOT EXISTS scenario_results (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
    input_value DOUBLE PRECISION NOT NULL,
    predicted_m DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_scenario_results_scenario_id ON scenario_results (scenario_id);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) REFERENCES agent_sessions (id) ON DELETE SET NULL,
    scope VARCHAR(20) NOT NULL,
    hs_code VARCHAR(10),
    horizon INTEGER NOT NULL,
    usd_pkr DOUBLE PRECISION NOT NULL,
    brent_oil DOUBLE PRECISION NOT NULL,
    us_confidence DOUBLE PRECISION NOT NULL,
    tone VARCHAR(20) NOT NULL DEFAULT 'executive',
    report_text TEXT NOT NULL,
    word_count INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS ix_reports_session_id ON reports (session_id);
CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports (created_at);
