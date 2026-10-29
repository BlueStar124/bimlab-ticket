package com.bimlab.ticket.note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class SharedNoteRequests {
    private SharedNoteRequests() {}

    public record Save(
            @NotBlank @Size(max = 200) String title,
            @NotNull NoteCategory category,
            @Size(max = 60) String customType,
            @NotNull NoteBoard board,
            @NotBlank @Size(max = 20000) String content,
            @Size(max = 2048) String url,
            @Size(max = 500) String description,
            @Size(max = 10) List<@NotBlank @Size(max = 40) String> tags) {}

    public record Pin(boolean pinned) {}

    public record Preview(@NotBlank @Size(max = 2048) String url) {}
}
