// Where a problem lives: a BIMLab system (software bug) or a piece of infrastructure (ops incident).
export type TicketKind = 'bug' | 'infra';

export interface Area {
  id: string;
  name: string;
  kind: TicketKind;
}

export const KIND_LABEL: Record<TicketKind, { title: string; hint: string }> = {
  bug: { title: 'Lỗi phần mềm', hint: 'Bug trong các hệ thống BIMLab' },
  infra: { title: 'Hạ tầng / vận hành', hint: 'Server, CI/CD, Docker, DB, mạng, tài khoản' },
};

export const AREAS: Area[] = [
  { id: 'cds', name: 'BIMLab CDS', kind: 'bug' },
  { id: 'hrm', name: 'BIMLab HRM', kind: 'bug' },
  { id: 'qlvt', name: 'BIMLab QLVT', kind: 'bug' },
  { id: 'jobs', name: 'BIMLab Jobs', kind: 'bug' },
  { id: 'platform', name: 'BIMLab Platform', kind: 'bug' },
  { id: 'digitaltwin', name: 'BIMLab DigitalTwin', kind: 'bug' },
  { id: 'ticket', name: 'BIMLab Ticket', kind: 'bug' },
  { id: 'server', name: 'Máy chủ & VM', kind: 'infra' },
  { id: 'ci', name: 'Jenkins / CI-CD', kind: 'infra' },
  { id: 'docker', name: 'Docker & registry', kind: 'infra' },
  { id: 'database', name: 'Cơ sở dữ liệu', kind: 'infra' },
  { id: 'network', name: 'Mạng, VPN, domain', kind: 'infra' },
  { id: 'access', name: 'Tài khoản & phân quyền', kind: 'infra' },
  { id: 'infra-other', name: 'Hạ tầng khác', kind: 'infra' },
];

const FALLBACK = AREAS[AREAS.length - 1];

export function areaById(id: string): Area {
  return AREAS.find((a) => a.id === id) ?? FALLBACK;
}

export function areasOf(kind: TicketKind): Area[] {
  return AREAS.filter((a) => a.kind === kind);
}
