package com.bimlab.ticket.chat;

import com.bimlab.ticket.auth.CurrentActor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat/messages")
public class ChatController {
    private final ChatService service;
    public ChatController(ChatService service) { this.service = service; }

    @GetMapping
    public List<Message> list() { return service.list().stream().map(Message::from).toList(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Message send(@Valid @RequestBody ChatRequests.Send request, @CurrentActor String actorId) {
        return Message.from(service.send(request.text(), request.replyToId(), actorId));
    }

    @GetMapping("/unread-count")
    public UnreadCount unread(@CurrentActor String actorId) {
        return new UnreadCount(service.unreadCount(actorId));
    }

    @GetMapping("/read-marker")
    public ReadMarker readMarker(@CurrentActor String actorId) { return new ReadMarker(service.readAt(actorId)); }

    @PostMapping("/read-marker")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@Valid @RequestBody ChatRequests.MarkRead request, @CurrentActor String actorId) {
        try {
            service.markRead(actorId, Instant.parse(request.readAt()));
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Mốc đã đọc không hợp lệ");
        }
    }

    public record Message(UUID id, String authorId, String text, Instant at, UUID replyToId) {
        static Message from(ChatMessageRecord message) {
            return new Message(message.getId(), message.getAuthorId(), message.getText(), message.getAt(), message.getReplyToId());
        }
    }
    public record UnreadCount(long count) {}
    public record ReadMarker(Instant readAt) {}
}
