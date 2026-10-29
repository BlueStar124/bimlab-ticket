package com.bimlab.ticket.note;

import com.bimlab.ticket.auth.CurrentActor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class SharedNoteController {
    private final SharedNoteService service;

    public SharedNoteController(SharedNoteService service) { this.service = service; }

    @GetMapping
    public List<SharedNoteResponses.Note> list(@RequestParam(required = false) String q,
                                               @RequestParam(required = false) String category,
                                               @RequestParam(required = false) String tag) {
        return service.list(q, category == null || category.isBlank() ? null : NoteCategory.fromValue(category), tag);
    }

    @GetMapping("/{id}")
    public SharedNoteResponses.Note get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SharedNoteResponses.Note create(@Valid @RequestBody SharedNoteRequests.Save request,
                                           @CurrentActor String actorId) {
        return service.create(request, actorId);
    }

    @PutMapping("/{id}")
    public SharedNoteResponses.Note update(@PathVariable UUID id, @Valid @RequestBody SharedNoteRequests.Save request,
                                           @CurrentActor String actorId) {
        return service.update(id, request, actorId);
    }

    @PostMapping("/preview")
    public SharedNoteResponses.LinkPreview preview(@Valid @RequestBody SharedNoteRequests.Preview request, @CurrentActor String actorId) {
        return service.preview(request.url(), actorId);
    }

    @PatchMapping("/{id}/pin")
    public SharedNoteResponses.Note pin(@PathVariable UUID id, @RequestBody SharedNoteRequests.Pin request, @CurrentActor String actorId) {
        return service.pin(id, request.pinned(), actorId);
    }

    @PutMapping("/{id}/like")
    public SharedNoteResponses.Note like(@PathVariable UUID id, @CurrentActor String actorId) { return service.like(id, actorId); }

    @DeleteMapping("/{id}/like")
    public SharedNoteResponses.Note unlike(@PathVariable UUID id, @CurrentActor String actorId) { return service.unlike(id, actorId); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @CurrentActor String actorId) { service.delete(id, actorId); }
}
