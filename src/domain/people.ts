import type { Person, Role } from '@/domain/ticket';

// Demo directory. Replace with the HRM employee list once the app has a backend.
export const PEOPLE: Person[] = [
  { id: 'u-an', name: 'Nguyễn Hoàng An', title: 'Kiến trúc sư', department: 'Phòng Thiết kế', role: 'employee' },
  { id: 'u-binh', name: 'Trần Thu Bình', title: 'BIM Coordinator', department: 'Phòng BIM', role: 'employee' },
  { id: 'u-chau', name: 'Lê Bảo Châu', title: 'Kế toán viên', department: 'Phòng Tài chính', role: 'employee' },
  { id: 'u-dung', name: 'Phạm Quốc Dũng', title: 'Kỹ sư MEP', department: 'Phòng Cơ điện', role: 'employee' },
  { id: 'it-duc', name: 'Đỗ Minh Đức', title: 'Kỹ thuật viên CNTT', department: 'Phòng CNTT', role: 'agent' },
  { id: 'it-hanh', name: 'Vũ Mỹ Hạnh', title: 'Quản trị hệ thống', department: 'Phòng CNTT', role: 'agent' },
];

/** Demo sign-in: one fixed account per role until the app is wired to Keycloak. */
export const DEMO_ACCOUNT: Record<Person['role'], string> = { employee: 'u-an', agent: 'it-duc' };

export function personById(id: string | null): Person | null {
  return PEOPLE.find((p) => p.id === id) ?? null;
}

export const AGENTS = PEOPLE.filter((p) => p.role === 'agent');

export function roleOf(personId: string): Role {
  return personById(personId)?.role ?? 'employee';
}
