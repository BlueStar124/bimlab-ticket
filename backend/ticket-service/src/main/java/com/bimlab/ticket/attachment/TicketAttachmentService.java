package com.bimlab.ticket.attachment;

import com.bimlab.ticket.people.TeamDirectory;
import com.bimlab.ticket.ticket.TicketNotFoundException;
import com.bimlab.ticket.ticket.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TicketAttachmentService {
    private final TicketRepository tickets;
    private final TicketAttachmentRepository attachments;
    private final MinioObjectStore objectStore;
    private final TeamDirectory team;
    private final Clock clock;
    private final long maxFileBytes;

    TicketAttachmentService(TicketRepository tickets, TicketAttachmentRepository attachments, MinioObjectStore objectStore,
                           TeamDirectory team, Clock clock, @Value("${app.attachments.max-file-bytes:10485760}") long maxFileBytes) {
        this.tickets = tickets; this.attachments = attachments; this.objectStore = objectStore;
        this.team = team; this.clock = clock; this.maxFileBytes = maxFileBytes;
    }

    @Transactional(readOnly = true)
    public List<Attachment> list(UUID ticketId) {
        requireTicket(ticketId);
        return attachments.findAllByTicketIdOrderByCreatedAtAsc(ticketId).stream().map(Attachment::from).toList();
    }

    /** Attachments of every ticket, oldest first; clients group them by ticketId. */
    @Transactional(readOnly = true)
    public List<Attachment> listAll() {
        return attachments.findAllByOrderByCreatedAtAsc().stream().map(Attachment::from).toList();
    }

    @Transactional
    public Attachment upload(UUID ticketId, String actorId, MultipartFile file) {
        team.requireMemberId(actorId);
        requireTicket(ticketId);
        validate(file);
        String originalName = file.getOriginalFilename().replaceAll("[\\\\/\\r\\n\\\"\\p{Cntrl}]", "_");
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        String key = objectStore.put(ticketId, file);
        try {
            TicketAttachmentRecord record = attachments.saveAndFlush(new TicketAttachmentRecord(ticketId, originalName,
                    contentType, file.getSize(), key, actorId, clock.instant()));
            return Attachment.from(record);
        } catch (RuntimeException exception) {
            objectStore.delete(key);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public Download download(UUID ticketId, UUID attachmentId) {
        requireTicket(ticketId);
        TicketAttachmentRecord record = attachments.findByIdAndTicketId(attachmentId, ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tệp đính kèm"));
        return new Download(Attachment.from(record), objectStore.get(record.getObjectKey(), maxFileBytes));
    }

    @Transactional
    public void delete(UUID ticketId, UUID attachmentId, String actorId) {
        team.requireMemberId(actorId);
        requireTicket(ticketId);
        TicketAttachmentRecord record = attachments.findByIdAndTicketId(attachmentId, ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tệp đính kèm"));
        objectStore.delete(record.getObjectKey());
        attachments.delete(record);
    }

    private void requireTicket(UUID id) {
        if (!tickets.existsById(id)) throw new TicketNotFoundException();
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        if (file.getSize() > maxFileBytes) throw new IllegalArgumentException("File vượt quá giới hạn 10 MB");
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank() || name.length() > 255) throw new IllegalArgumentException("Tên file không hợp lệ");
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank() || !allowedType(name, contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Định dạng file không được hỗ trợ");
        }
    }

    private boolean allowedType(String filename, String contentType) {
        String name = filename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".pdf")) return contentType.equals("application/pdf");
        if (name.matches(".*\\.(png|jpg|jpeg|gif|webp)$")) return contentType.startsWith("image/") && !contentType.equals("image/svg+xml");
        if (name.matches(".*\\.(txt|log|md|csv|json)$")) return contentType.startsWith("text/") || contentType.equals("application/json") || contentType.equals("application/octet-stream");
        if (name.matches(".*\\.(doc|docx|xls|xlsx|ppt|pptx|zip|7z)$")) return contentType.startsWith("application/") || contentType.equals("application/octet-stream");
        return false;
    }

    public record Attachment(UUID id, UUID ticketId, String name, String contentType, long size, String uploadedBy, java.time.Instant createdAt) {
        static Attachment from(TicketAttachmentRecord record) {
            return new Attachment(record.getId(), record.getTicketId(), record.getFileName(), record.getContentType(),
                    record.getSize(), record.getUploadedBy(), record.getCreatedAt());
        }
    }
    public record Download(Attachment attachment, byte[] content) {}
}
