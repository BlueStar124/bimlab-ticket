-- Team membership comes from configuration (APP_TEAM_MEMBERS); these tables hold only credentials and sessions.
CREATE TABLE ticket.team_accounts (
    username VARCHAR(120) PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    must_change_password BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Only a SHA-256 hash of each session token is stored, so a database leak does not expose live sessions.
CREATE TABLE ticket.auth_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    username VARCHAR(120) NOT NULL REFERENCES ticket.team_accounts(username) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX auth_sessions_username_idx ON ticket.auth_sessions (username);
CREATE INDEX auth_sessions_expires_idx ON ticket.auth_sessions (expires_at);
