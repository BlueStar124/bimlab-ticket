import type { TicketKind } from '@/domain/areas';
import { KIND_LABEL } from '@/domain/areas';
import type { Person, Priority, TicketStatus } from '@/domain/ticket';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/domain/ticket';
import { Icon } from '@/shared/ui/Icon';

// Semantic colors only (BIMLab DESIGN.md); values live in styles/base.css with light and dark variants.
export const STATUS_COLOR: Record<TicketStatus, string> = {
  todo: 'var(--st-new)',
  in_progress: 'var(--st-progress)',
  done: 'var(--st-resolved)',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: 'var(--pr-1)',
  high: 'var(--pr-2)',
  medium: 'var(--pr-3)',
  low: 'var(--pr-4)',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="badge" style={{ ['--c' as string]: STATUS_COLOR[status] }}>
      <i aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className="prio" style={{ ['--c' as string]: PRIORITY_COLOR[priority] }}>
      {PRIORITY_LABEL[priority].title}
    </span>
  );
}

export function KindTag({ kind }: { kind: TicketKind }) {
  return (
    <span className="kind-tag">
      <Icon name={kind === 'bug' ? 'bug' : 'server'} size={14} />
      {KIND_LABEL[kind].title}
    </span>
  );
}

export function Avatar({ person, size = 32 }: { person: Person | null; size?: number }) {
  if (!person) {
    return (
      <span className="avatar" style={{ ['--sz' as string]: `${size}px` }} data-empty aria-hidden="true">
        ?
      </span>
    );
  }
  const initials = person.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
  return (
    <span className="avatar" style={{ ['--sz' as string]: `${size}px` }} aria-hidden="true">
      {initials}
    </span>
  );
}
