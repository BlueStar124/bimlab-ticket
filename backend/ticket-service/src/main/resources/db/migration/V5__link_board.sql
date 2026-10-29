-- Shared notes become the team's link board: topic boards, pinning, a fetched page description, and likes.
ALTER TABLE ticket.shared_notes DROP CONSTRAINT shared_notes_category_check;
ALTER TABLE ticket.shared_notes ADD CONSTRAINT shared_notes_category_check
    CHECK (category IN ('RESOURCE', 'REPOSITORY', 'PROMPT', 'TOOL', 'DESIGN', 'VIDEO', 'GENERAL'));

ALTER TABLE ticket.shared_notes ADD COLUMN board VARCHAR(20) NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE ticket.shared_notes ADD CONSTRAINT shared_notes_board_check
    CHECK (board IN ('FRONTEND', 'BACKEND', 'DEVOPS', 'AI', 'INTERNAL'));
ALTER TABLE ticket.shared_notes ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ticket.shared_notes ADD COLUMN description VARCHAR(500);

CREATE TABLE ticket.shared_note_likes (
    note_id UUID NOT NULL REFERENCES ticket.shared_notes(id) ON DELETE CASCADE,
    user_id VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (note_id, user_id)
);

CREATE INDEX shared_note_likes_recent_idx ON ticket.shared_note_likes (created_at DESC);
