package com.bimlab.ticket.note;

import com.bimlab.ticket.people.TeamDirectory;
import com.bimlab.ticket.people.TeamMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/** The team's shared link board: notes with an optional link, pinned and liked by any member. */
@Service
public class SharedNoteService {
    static final Duration HOT_WINDOW = Duration.ofDays(7);

    private final SharedNoteRepository notes;
    private final SharedNoteLikeRepository likes;
    private final LinkPreviewFetcher previews;
    private final TeamDirectory team;
    private final Clock clock;

    SharedNoteService(SharedNoteRepository notes, SharedNoteLikeRepository likes, LinkPreviewFetcher previews,
                      TeamDirectory team, Clock clock) {
        this.notes = notes;
        this.likes = likes;
        this.previews = previews;
        this.team = team;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<SharedNoteResponses.Note> list(String query, NoteCategory category, String tag) {
        String search = normalize(query);
        String normalizedTag = normalize(tag);
        List<SharedNoteRecord> matching = notes.findAllByOrderByUpdatedAtDesc().stream()
                .filter(note -> category == null || note.getCategory() == category)
                .filter(note -> normalizedTag.isBlank() || note.getTags().stream().anyMatch(value -> normalize(value).equals(normalizedTag)))
                .filter(note -> search.isBlank() || searchableText(note).contains(search))
                .toList();
        return responses(matching);
    }

    @Transactional(readOnly = true)
    public SharedNoteResponses.Note get(UUID id) {
        return response(requireNote(id));
    }

    /**
     * What a pasted link would become: the page's title and description (when the page can be fetched safely) and
     * the note that already holds the same link, if any. Runs outside a transaction: the fetch can take seconds.
     */
    public SharedNoteResponses.LinkPreview preview(String url, String actorId) {
        team.requireMemberId(actorId);
        URI uri = validateUrl(url);
        Optional<SharedNoteResponses.Note> duplicate = findDuplicate(url, null).map(this::response);
        LinkPreviewFetcher.PagePreview page = previews.fetch(uri).orElse(new LinkPreviewFetcher.PagePreview(null, null, null));
        return new SharedNoteResponses.LinkPreview(uri.toString(), page.title(), page.description(), page.siteName(), duplicate.orElse(null));
    }

    @Transactional
    public SharedNoteResponses.Note create(SharedNoteRequests.Save request, String actorId) {
        team.requireMemberId(actorId);
        String url = cleanUrl(request.url());
        if (url != null) validateUrl(url);
        rejectDuplicate(url, null);
        var note = new SharedNoteRecord(clean(request.title()), request.category(), customType(request.category(), request.customType()),
                request.board(), request.content().trim(), url, cleanOptional(request.description()), actorId,
                normalizeTags(request.tags()), clock.instant());
        return response(notes.save(note));
    }

    @Transactional
    public SharedNoteResponses.Note update(UUID id, SharedNoteRequests.Save request, String actorId) {
        team.requireMemberId(actorId);
        String url = cleanUrl(request.url());
        if (url != null) validateUrl(url);
        rejectDuplicate(url, id);
        SharedNoteRecord note = requireNote(id);
        note.update(clean(request.title()), request.category(), customType(request.category(), request.customType()), request.board(),
                request.content().trim(), url, cleanOptional(request.description()), normalizeTags(request.tags()), clock.instant());
        return response(note);
    }

    @Transactional
    public SharedNoteResponses.Note pin(UUID id, boolean pinned, String actorId) {
        team.requireMemberId(actorId);
        SharedNoteRecord note = requireNote(id);
        if (note.isPinned() != pinned) note.pin(pinned, clock.instant());
        return response(note);
    }

    @Transactional
    public SharedNoteResponses.Note like(UUID id, String actorId) {
        team.requireMemberId(actorId);
        SharedNoteRecord note = requireNote(id);
        if (!likes.existsById(new SharedNoteLike.Key(id, actorId))) likes.save(new SharedNoteLike(id, actorId, clock.instant()));
        return response(note);
    }

    @Transactional
    public SharedNoteResponses.Note unlike(UUID id, String actorId) {
        team.requireMemberId(actorId);
        SharedNoteRecord note = requireNote(id);
        likes.deleteById(new SharedNoteLike.Key(id, actorId));
        return response(note);
    }

    @Transactional
    public void delete(UUID id, String actorId) {
        team.requireMemberId(actorId);
        notes.delete(requireNote(id));
    }

    private SharedNoteRecord requireNote(UUID id) {
        return notes.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ghi chú"));
    }

    private SharedNoteResponses.Note response(SharedNoteRecord note) {
        return responses(List.of(note)).get(0);
    }

    private List<SharedNoteResponses.Note> responses(List<SharedNoteRecord> records) {
        if (records.isEmpty()) return List.of();
        Map<UUID, List<SharedNoteLike>> likesByNote = likes.findAllByNoteIdIn(records.stream().map(SharedNoteRecord::getId).toList()).stream()
                .sorted(Comparator.comparing(SharedNoteLike::getCreatedAt))
                .collect(Collectors.groupingBy(SharedNoteLike::getNoteId, LinkedHashMap::new, Collectors.toList()));
        Instant weekAgo = clock.instant().minus(HOT_WINDOW);
        return records.stream().map(note -> {
            List<SharedNoteLike> noteLikes = likesByNote.getOrDefault(note.getId(), List.of());
            int recent = (int) noteLikes.stream().filter(like -> like.getCreatedAt().isAfter(weekAgo)).count();
            return SharedNoteResponses.Note.from(note, noteLikes.stream().map(SharedNoteLike::getUserId).toList(), recent);
        }).toList();
    }

    private Optional<SharedNoteRecord> findDuplicate(String url, UUID exceptId) {
        Optional<String> key = LinkKey.of(url);
        if (key.isEmpty()) return Optional.empty();
        return notes.findAll().stream()
                .filter(note -> !note.getId().equals(exceptId))
                .filter(note -> LinkKey.of(note.getUrl()).equals(key))
                .findFirst();
    }

    private void rejectDuplicate(String url, UUID exceptId) {
        findDuplicate(url, exceptId).ifPresent(existing -> {
            String author = team.find(existing.getAuthorId()).map(TeamMember::name).orElse(existing.getAuthorId());
            throw new DuplicateLinkException("Link này đã có trên bảng: “" + existing.getTitle() + "” do " + author + " ghim");
        });
    }

    private String searchableText(SharedNoteRecord note) {
        return normalize(String.join(" ", note.getTitle(), note.getCategory().name(), note.getCustomType() == null ? "" : note.getCustomType(), note.getContent(),
                note.getUrl() == null ? "" : note.getUrl(), note.getDescription() == null ? "" : note.getDescription(), String.join(" ", note.getTags())));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String clean(String value) { return value.trim(); }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String customType(NoteCategory category, String value) {
        if (category != NoteCategory.GENERAL) return null;
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Hãy nhập loại ghi chú cụ thể");
        return value.trim();
    }

    private String cleanUrl(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private URI validateUrl(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Đường dẫn không hợp lệ");
        URI uri;
        try {
            uri = URI.create(value.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Đường dẫn không hợp lệ");
        }
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Liên kết phải bắt đầu bằng http:// hoặc https://");
        }
        if (uri.getHost() == null) throw new IllegalArgumentException("Đường dẫn không hợp lệ");
        return uri;
    }

    private java.util.Set<String> normalizeTags(List<String> tags) {
        if (tags == null) return java.util.Set.of();
        Map<String, String> unique = new LinkedHashMap<>();
        for (String tag : tags) {
            if (tag == null || tag.isBlank()) continue;
            String value = tag.trim().replaceFirst("^#", "");
            unique.putIfAbsent(value.toLowerCase(Locale.ROOT), value);
        }
        if (unique.size() > 10) throw new IllegalArgumentException("Tối đa 10 từ khóa cho mỗi ghi chú");
        return unique.values().stream().collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }
}
