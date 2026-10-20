import { Icon, type IconName } from '@/shared/ui/Icon';
import type { Person, Priority, Ticket, TicketStatus } from '@/domain/ticket';
import { PRIORITY_LABEL, STATUS_LABEL, formatDuration, slaState } from '@/domain/ticket';

// Semantic colors only (BIMLab DESIGN.md); values live in styles/app.css with light and dark variants.
export const STATUS_COLOR: Record<TicketStatus, string> = {
  new: 'var(--st-new)',
  in_progress: 'var(--st-progress)',
  waiting: 'var(--st-waiting)',
  resolved: 'var(--st-resolved)',
  closed: 'var(--st-closed)',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  P1: 'var(--pr-1)',
  P2: 'var(--pr-2)',
  P3: 'var(--pr-3)',
  P4: 'var(--pr-4)',
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
      {priority} · {PRIORITY_LABEL[priority]}
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

export function SlaMeter({ ticket, now }: { ticket: Ticket; now: number }) {
  const sla = slaState(ticket, now);
  const tone = sla.breached ? 'danger' : sla.done ? 'ok' : sla.paused ? 'paused' : sla.used > 0.75 ? 'warn' : 'normal';
  const icon: IconName = sla.breached ? 'alert' : sla.done ? 'checkCircle' : sla.paused ? 'pause' : 'clock';
  const label = sla.done
    ? sla.breached
      ? 'Xong · trễ hạn'
      : 'Xong · đúng hạn'
    : sla.paused
      ? 'Tạm dừng SLA'
      : sla.breached
        ? `Quá hạn ${formatDuration(-sla.remainingMs)}`
        : `Còn ${formatDuration(sla.remainingMs)}`;
  return (
    <div className="sla" data-tone={tone} title={sla.paused ? `Đang chờ người dùng · còn ${formatDuration(sla.remainingMs)}` : "Thời hạn xử lý theo SLA"}>
      <small>
        <Icon name={icon} size={14} />
        {label}
      </small>
      {!sla.done && (
        <div className="sla-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${Math.min(1, Math.max(0.03, sla.used))})` }} />
        </div>
      )}
    </div>
  );
}
