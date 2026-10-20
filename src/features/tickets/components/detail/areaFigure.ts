// Which line figure illustrates a ticket's area on its detail page.
import { type TicketKind, areaById } from '@/domain/areas';
import type { FigureName } from '@/shared/ui/LineFigure';

const BY_AREA: Partial<Record<string, { figure: FigureName; label: string }>> = {
  server: { figure: 'cabinet', label: 'Tủ rack máy chủ' },
  ci: { figure: 'branches', label: 'Đồ thị commit' },
  docker: { figure: 'rebuild', label: 'Cây package được build lại' },
  database: { figure: 'drawer', label: 'Tủ ba ngăn kéo' },
  network: { figure: 'router', label: 'Router wifi' },
  access: { figure: 'padlock', label: 'Ổ khóa' },
  'infra-other': { figure: 'patch', label: 'Patch panel' },
};

const BY_KIND: Record<TicketKind, { figure: FigureName; label: string }> = {
  bug: { figure: 'terminal', label: 'Cửa sổ terminal' },
  infra: { figure: 'patch', label: 'Patch panel' },
};

export function areaFigure(areaId: string): { figure: FigureName; label: string } {
  return BY_AREA[areaId] ?? BY_KIND[areaById(areaId).kind];
}
