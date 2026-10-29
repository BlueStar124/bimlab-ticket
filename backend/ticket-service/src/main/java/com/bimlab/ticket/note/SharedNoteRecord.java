package com.bimlab.ticket.note;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "shared_notes")
public class SharedNoteRecord {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteCategory category;

    @Column(name = "custom_type", length = 60)
    private String customType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteBoard board;

    @Column(nullable = false)
    private boolean pinned;

    /** Page description fetched when the link was added; null for notes without a link or a description. */
    @Column(length = 500)
    private String description;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(length = 2048)
    private String url;

    @Column(name = "author_id", nullable = false, length = 120)
    private String authorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shared_note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag", nullable = false, length = 40)
    private Set<String> tags = new LinkedHashSet<>();

    protected SharedNoteRecord() {}

    SharedNoteRecord(String title, NoteCategory category, String customType, NoteBoard board, String content, String url,
                     String description, String authorId, Set<String> tags, Instant now) {
        this.title = title;
        this.category = category;
        this.customType = customType;
        this.board = board;
        this.content = content;
        this.url = url;
        this.description = description;
        this.authorId = authorId;
        this.tags.clear();
        this.tags.addAll(tags);
        this.createdAt = now;
        this.updatedAt = now;
    }

    void update(String title, NoteCategory category, String customType, NoteBoard board, String content, String url,
                String description, Set<String> tags, Instant now) {
        this.title = title;
        this.category = category;
        this.customType = customType;
        this.board = board;
        this.content = content;
        this.url = url;
        this.description = description;
        this.tags.clear();
        this.tags.addAll(tags);
        this.updatedAt = now;
    }

    void pin(boolean value, Instant now) {
        this.pinned = value;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public NoteCategory getCategory() { return category; }
    public String getCustomType() { return customType; }
    public NoteBoard getBoard() { return board; }
    public boolean isPinned() { return pinned; }
    public String getDescription() { return description; }
    public String getContent() { return content; }
    public String getUrl() { return url; }
    public String getAuthorId() { return authorId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Set<String> getTags() { return Set.copyOf(tags); }
}
