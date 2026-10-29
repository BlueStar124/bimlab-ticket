package com.bimlab.ticket.attachment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_attachments")
public class TicketAttachmentRecord {
    @Id @UuidGenerator
    private UUID id;
    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;
    @Column(name = "content_type", nullable = false, length = 150)
    private String contentType;
    @Column(name = "size_bytes", nullable = false)
    private long size;
    @Column(name = "object_key", nullable = false, unique = true, length = 500)
    private String objectKey;
    @Column(name = "uploaded_by", nullable = false, length = 120)
    private String uploadedBy;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TicketAttachmentRecord() {}
    TicketAttachmentRecord(UUID ticketId, String fileName, String contentType, long size, String objectKey, String uploadedBy, Instant createdAt) {
        this.ticketId = ticketId; this.fileName = fileName; this.contentType = contentType; this.size = size;
        this.objectKey = objectKey; this.uploadedBy = uploadedBy; this.createdAt = createdAt;
    }
    public UUID getId() { return id; }
    public UUID getTicketId() { return ticketId; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public String getObjectKey() { return objectKey; }
    public String getUploadedBy() { return uploadedBy; }
    public Instant getCreatedAt() { return createdAt; }
}
