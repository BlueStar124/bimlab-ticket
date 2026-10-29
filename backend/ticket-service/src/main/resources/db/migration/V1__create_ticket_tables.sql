CREATE SCHEMA IF NOT EXISTS ticket;

CREATE TABLE ticket.tickets (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    area_id VARCHAR(80) NOT NULL,
    environment VARCHAR(20),
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reporter_id VARCHAR(120) NOT NULL,
    assignee_id VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    done_at TIMESTAMPTZ,
    CONSTRAINT tickets_environment_check CHECK (environment IS NULL OR environment IN ('PRODUCTION', 'TEST', 'LOCAL')),
    CONSTRAINT tickets_priority_check CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
    CONSTRAINT tickets_status_check CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE'))
);

CREATE INDEX tickets_queue_idx ON ticket.tickets (status, priority, created_at);
CREATE INDEX tickets_reporter_idx ON ticket.tickets (reporter_id, created_at DESC);
CREATE INDEX tickets_assignee_idx ON ticket.tickets (assignee_id, created_at DESC);

CREATE TABLE ticket.ticket_events (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
    actor_id VARCHAR(120) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    to_status VARCHAR(20),
    to_assignee_id VARCHAR(120),
    to_priority VARCHAR(20),
    CONSTRAINT ticket_events_kind_check CHECK (kind IN ('created', 'status', 'assign', 'priority', 'comment'))
);

CREATE INDEX ticket_events_history_idx ON ticket.ticket_events (ticket_id, occurred_at);

CREATE TABLE ticket.ticket_attachments (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket.tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    size_bytes BIGINT NOT NULL,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    uploaded_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ticket_attachments_size_check CHECK (size_bytes > 0 AND size_bytes <= 10485760)
);

CREATE INDEX ticket_attachments_ticket_idx ON ticket.ticket_attachments (ticket_id, created_at);

CREATE TABLE ticket.chat_messages (
    id UUID PRIMARY KEY,
    author_id VARCHAR(120) NOT NULL,
    text VARCHAR(2000) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    reply_to_id UUID REFERENCES ticket.chat_messages(id)
);

CREATE INDEX chat_messages_time_idx ON ticket.chat_messages (occurred_at DESC);

CREATE TABLE ticket.chat_read_markers (
    user_id VARCHAR(120) PRIMARY KEY,
    read_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ticket.notification_reads (
    user_id VARCHAR(120) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    source_id UUID NOT NULL,
    read_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, source_type, source_id),
    CONSTRAINT notification_reads_source_check CHECK (source_type IN ('ticket', 'chat'))
);
