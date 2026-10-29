package com.bimlab.ticket.attachment;

import com.bimlab.ticket.auth.CurrentActor;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketAttachmentController {
    private final TicketAttachmentService service;
    public TicketAttachmentController(TicketAttachmentService service) { this.service = service; }

    @GetMapping("/attachments")
    public List<TicketAttachmentService.Attachment> listAll() { return service.listAll(); }

    @GetMapping("/{ticketId}/attachments")
    public List<TicketAttachmentService.Attachment> list(@PathVariable UUID ticketId) { return service.list(ticketId); }

    @PostMapping(path = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TicketAttachmentService.Attachment upload(@PathVariable UUID ticketId,
            @CurrentActor String actorId, @RequestParam("file") MultipartFile file) {
        return service.upload(ticketId, actorId, file);
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> download(@PathVariable UUID ticketId, @PathVariable UUID attachmentId) {
        TicketAttachmentService.Download download = service.download(ticketId, attachmentId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.attachment().name(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(download.attachment().contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentLength(download.content().length).body(download.content());
    }

    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID ticketId, @PathVariable UUID attachmentId,
            @CurrentActor String actorId) {
        service.delete(ticketId, attachmentId, actorId);
        return ResponseEntity.noContent().build();
    }
}
