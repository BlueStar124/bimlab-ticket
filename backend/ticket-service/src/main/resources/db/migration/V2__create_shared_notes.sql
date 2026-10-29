CREATE TABLE ticket.shared_notes (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(2048),
    author_id VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT shared_notes_category_check CHECK (category IN ('RESOURCE', 'REPOSITORY', 'PROMPT', 'GENERAL'))
);

CREATE TABLE ticket.shared_note_tags (
    note_id UUID NOT NULL REFERENCES ticket.shared_notes(id) ON DELETE CASCADE,
    tag VARCHAR(40) NOT NULL,
    PRIMARY KEY (note_id, tag)
);

CREATE INDEX shared_notes_updated_idx ON ticket.shared_notes (updated_at DESC);
CREATE INDEX shared_note_tags_tag_idx ON ticket.shared_note_tags (tag);
