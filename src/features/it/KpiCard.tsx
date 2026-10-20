// Compact metric card: label with icon, big value, progress meter and one-line context.
import { Icon, type IconName } from '@/shared/ui/Icon';

type KpiTone = 'danger' | 'warn' | 'ok';

export function KpiCard({ label, icon, value, unit, sub, tone, meter }: { label: string; icon: IconName; value: string; unit?: string; sub: string; tone?: KpiTone; meter?: number }) {
  return (
    <div className="kpi" data-tone={tone}>
      <div className="kpi-top">
        <Icon name={icon} size={16} />
        <small>{label}</small>
      </div>
      <b>
        {value}
        {unit && <em>{unit}</em>}
      </b>
      <div className="kpi-foot">
        {meter !== undefined && (
          <span className="kpi-meter" aria-hidden="true">
            <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, meter))})` }} />
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  );
}
