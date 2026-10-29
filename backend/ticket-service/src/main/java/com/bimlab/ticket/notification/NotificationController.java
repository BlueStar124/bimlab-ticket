package com.bimlab.ticket.notification;

import com.bimlab.ticket.auth.CurrentActor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public List<NotificationService.Notification> list(@CurrentActor String actorId) {
        return service.forUser(actorId);
    }

    @PostMapping("/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@Valid @RequestBody ReadRequest request, @CurrentActor String actorId) {
        service.markRead(actorId, request.notifications());
    }

    public record ReadRequest(@Valid @NotEmpty @Size(max = 100) List<NotificationService.NotificationRef> notifications) {}
}
