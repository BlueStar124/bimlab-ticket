package com.bimlab.ticket.note;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class SharedNoteResponses {
    private SharedNoteResponses() {}

    public record Note(UUID id, String title, String category, String customType, String board, boolean pinned, String content,
                       String url, String description, List<String> tags, String authorId, List<String> likedBy, int likesThisWeek,
                       Instant createdAt, Instant updatedAt) {
        static Note from(SharedNoteRecord note, List<String> likedBy, int likesThisWeek) {
            return new Note(note.getId(), note.getTitle(), note.getCategory().value(), note.getCustomType(), note.getBoard().value(),
                    note.isPinned(), note.getContent(), note.getUrl(), note.getDescription(), note.getTags().stream().sorted().toList(),
                    note.getAuthorId(), likedBy, likesThisWeek, note.getCreatedAt(), note.getUpdatedAt());
        }
    }

    /** A pasted link before it is saved: fetched page details (null when unavailable) and the note already holding it. */
    public record LinkPreview(String url, String title, String description, String siteName, Note duplicate) {}
}
