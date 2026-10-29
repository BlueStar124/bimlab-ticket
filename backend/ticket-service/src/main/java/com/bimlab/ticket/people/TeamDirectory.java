package com.bimlab.ticket.people;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * The IT team, read from {@code app.team.members}: entries separated by {@code ;}, each
 * {@code username|Full name|Title}. Only listed usernames can sign in or be assigned work.
 */
@Component
public class TeamDirectory {
    private static final Pattern USERNAME = Pattern.compile("[a-z0-9._-]{2,120}");

    private final List<TeamMember> members;
    private final Map<String, TeamMember> byId;

    public TeamDirectory(@Value("${app.team.members}") String configured) {
        this.members = parse(configured);
        Map<String, TeamMember> index = new LinkedHashMap<>();
        members.forEach(member -> index.put(member.id(), member));
        this.byId = Map.copyOf(index);
    }

    static List<TeamMember> parse(String configured) {
        List<TeamMember> parsed = new ArrayList<>();
        java.util.Set<String> seen = new java.util.HashSet<>();
        for (String entry : configured.split(";")) {
            if (entry.isBlank()) continue;
            String[] parts = entry.split("\\|", -1);
            if (parts.length != 3) throw new IllegalStateException("APP_TEAM_MEMBERS: mỗi mục phải có dạng username|Họ tên|Chức danh");
            String username = parts[0].trim().toLowerCase(java.util.Locale.ROOT);
            String name = parts[1].trim();
            if (!USERNAME.matcher(username).matches()) throw new IllegalStateException("APP_TEAM_MEMBERS: username không hợp lệ: " + username);
            if (name.isEmpty()) throw new IllegalStateException("APP_TEAM_MEMBERS: thiếu họ tên của " + username);
            if (!seen.add(username)) throw new IllegalStateException("APP_TEAM_MEMBERS: trùng username " + username);
            parsed.add(new TeamMember(username, name, parts[2].trim()));
        }
        if (parsed.isEmpty()) throw new IllegalStateException("APP_TEAM_MEMBERS phải có ít nhất một thành viên");
        return List.copyOf(parsed);
    }

    public List<TeamMember> all() { return members; }

    public Optional<TeamMember> find(String id) { return Optional.ofNullable(id == null ? null : byId.get(id)); }

    public String requireMemberId(String id) {
        if (id == null || !byId.containsKey(id)) throw new IllegalArgumentException("Chỉ thành viên team IT mới được thao tác");
        return id;
    }
}
