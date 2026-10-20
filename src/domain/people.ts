import type { Person } from '@/domain/ticket';

// Demo IT team. Everyone can report, assign and work on tickets.
// Replace with the IT department list from HRM once the app has a backend.
export const TEAM: Person[] = [
  { id: 'it-nam', name: 'Nguyễn Hải Nam', title: 'Trưởng nhóm IT' },
  { id: 'it-duc', name: 'Đỗ Minh Đức', title: 'Backend developer' },
  { id: 'it-huy', name: 'Trần Quang Huy', title: 'Frontend developer' },
  { id: 'it-trang', name: 'Lê Thu Trang', title: 'Tester' },
  { id: 'it-bao', name: 'Phạm Gia Bảo', title: 'DevOps' },
  { id: 'it-hanh', name: 'Vũ Mỹ Hạnh', title: 'Quản trị hệ thống' },
];

export function personById(id: string | null | undefined): Person | null {
  return TEAM.find((p) => p.id === id) ?? null;
}

export function isMember(id: string): boolean {
  return TEAM.some((p) => p.id === id);
}

/** Last two words of a Vietnamese full name, e.g. "Minh Đức". */
export function shortName(person: Person): string {
  return person.name.split(' ').slice(-2).join(' ');
}
