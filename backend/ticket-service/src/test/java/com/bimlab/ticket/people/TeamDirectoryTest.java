package com.bimlab.ticket.people;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TeamDirectoryTest {
    @Test
    void parsesMembersInConfiguredOrderAndNormalizesUsernames() {
        List<TeamMember> members = TeamDirectory.parse(" IT-Nam | Nguyễn Hải Nam | Trưởng nhóm ;it-duc|Đỗ Minh Đức|;");

        assertEquals(List.of(new TeamMember("it-nam", "Nguyễn Hải Nam", "Trưởng nhóm"), new TeamMember("it-duc", "Đỗ Minh Đức", "")), members);
    }

    @Test
    void rejectsMalformedDuplicateOrEmptyConfiguration() {
        assertThrows(IllegalStateException.class, () -> TeamDirectory.parse("it-nam|Nam"));
        assertThrows(IllegalStateException.class, () -> TeamDirectory.parse("it-nam|Nam|A;IT-NAM|Nam 2|B"));
        assertThrows(IllegalStateException.class, () -> TeamDirectory.parse("bad name|Nam|A"));
        assertThrows(IllegalStateException.class, () -> TeamDirectory.parse(" ; "));
    }
}
