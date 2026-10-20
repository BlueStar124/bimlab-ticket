import { useState } from 'react';
import { postIncident, setIncidentStatus } from '@/data/incidentActions';
import { useStore } from '@/data/store';
import type { Incident, IncidentSeverity } from '@/domain/incident';
import { INCIDENT_NEXT, INCIDENT_SEVERITY_LABEL, INCIDENT_STATUS_LABEL, visibleIncidents } from '@/domain/incident';
import { IncidentItem } from '@/features/incidents/IncidentItem';
import { useNow } from '@/shared/hooks/useNow';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

const NEXT_LABEL: Record<Incident['status'], string> = {
  investigating: 'Đang xử lý',
  monitoring: 'Chuyển sang theo dõi',
  resolved: 'Đã khắc phục',
};

/** IT view: post a notice and move it through Đang xử lý → Đang theo dõi → Đã khắc phục. */
export function IncidentManager({ actorId }: { actorId: string }) {
  const incidents = useStore((s) => s.incidents);
  const now = useNow();
  const { active, recent } = visibleIncidents(incidents, now);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('partial');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 5) return;
    postIncident({ title: title.trim(), detail: detail.trim(), severity }, actorId);
    setTitle('');
    setDetail('');
    setSeverity('partial');
    toast({ kind: 'ok', title: 'Đã đăng thông báo sự cố', detail: 'Nhân viên sẽ thấy ở trang chủ' });
  }

  return (
    <section className="card incident-card" aria-labelledby="incident-manage-title">
      <div className="card-head">
        <h2 id="incident-manage-title">Thông báo sự cố</h2>
        <span className="muted">Hiển thị cho nhân viên ở trang chủ</span>
      </div>
      <form className="incident-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="inc-title">Tiêu đề *</label>
          <input id="inc-title" className="input" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: VPN đang gián đoạn, đang xử lý" />
        </div>
        <div className="field">
          <label htmlFor="inc-detail">Chi tiết cho nhân viên</label>
          <textarea id="inc-detail" className="textarea" style={{ minHeight: 72 }} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ảnh hưởng ai, có cách tạm thời không, dự kiến khi nào xong…" />
        </div>
        <div className="incident-form-foot">
          <div className="seg" role="group" aria-label="Mức độ">
            {(Object.keys(INCIDENT_SEVERITY_LABEL) as IncidentSeverity[]).map((k) => (
              <button key={k} type="button" aria-pressed={severity === k} title={INCIDENT_SEVERITY_LABEL[k].hint} onClick={() => setSeverity(k)}>
                {INCIDENT_SEVERITY_LABEL[k].title}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={title.trim().length < 5}>
            <Icon name="send" size={16} /> Đăng thông báo
          </button>
        </div>
      </form>

      {active.length === 0 && recent.length === 0 && <p className="muted incident-empty-note">Chưa có thông báo nào. Nhân viên đang thấy “Không có sự cố nào được báo”.</p>}
      {active.length > 0 && (
        <ul className="incident-list">
          {active.map((i) => (
            <IncidentItem
              key={i.id}
              incident={i}
              now={now}
              actions={
                <div className="incident-actions">
                  {INCIDENT_NEXT[i.status].map((to) => (
                    <button
                      key={to}
                      type="button"
                      className={`btn btn-sm ${to === 'resolved' ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => {
                        setIncidentStatus(i.id, to, actorId);
                        toast({ kind: 'ok', title: `Đã cập nhật: ${INCIDENT_STATUS_LABEL[to]}`, detail: i.title });
                      }}
                    >
                      {NEXT_LABEL[to]}
                    </button>
                  ))}
                </div>
              }
            />
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
