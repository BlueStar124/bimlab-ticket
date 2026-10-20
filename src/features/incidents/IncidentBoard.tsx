import { useStore } from '@/data/store';
import { visibleIncidents } from '@/domain/incident';
import { IncidentItem } from '@/features/incidents/IncidentItem';
import { useNow } from '@/shared/hooks/useNow';
import { Icon } from '@/shared/ui/Icon';

/** Staff view: what IT has reported. Shows a calm empty state when nothing is reported. */
export function IncidentBoard() {
  const incidents = useStore((s) => s.incidents);
  const now = useNow();
  const { active, recent } = visibleIncidents(incidents, now);

  return (
    <section className="card incident-card" aria-labelledby="incident-title">
      <div className="card-head">
        <h2 id="incident-title">Thông báo sự cố</h2>
        <span className="muted">Do Phòng CNTT đăng</span>
      </div>
      {active.length === 0 ? (
        <div className="incident-none">
          <Icon name="checkCircle" size={20} />
          <span>
            <b>Không có sự cố nào được báo</b>
            <small>Nếu bạn gặp lỗi, hãy gửi yêu cầu để Phòng CNTT biết.</small>
          </span>
        </div>
      ) : (
        <ul className="incident-list">
          {active.map((i) => (
            <IncidentItem key={i.id} incident={i} now={now} />
          ))}
        </ul>
      )}
      {recent.length > 0 && (
        <>
          <p className="incident-sub">Đã khắc phục trong 24 giờ qua</p>
          <ul className="incident-list">
            {recent.map((i) => (
              <IncidentItem key={i.id} incident={i} now={now} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
