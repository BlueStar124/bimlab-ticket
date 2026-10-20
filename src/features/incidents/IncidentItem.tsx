// One incident notice row, shared by the staff board and the IT manager.
import type { ReactNode } from 'react';
import type { Incident } from '@/domain/incident';
import { INCIDENT_SEVERITY_LABEL, INCIDENT_STATUS_LABEL } from '@/domain/incident';
import { personById } from '@/domain/people';
import { formatRelativeShort } from '@/domain/ticket';
import { Icon } from '@/shared/ui/Icon';
import './incidents.css';

export function IncidentItem({ incident, now, actions }: { incident: Incident; now: number; actions?: ReactNode }) {
  const resolved = incident.status === 'resolved';
  const author = personById(incident.authorId);
  return (
    <li className="incident" data-severity={incident.severity} data-status={incident.status}>
      <span className="incident-ic" aria-hidden="true">
        <Icon name={resolved ? 'checkCircle' : 'alert'} size={18} />
      </span>
      <div className="incident-body">
        <div className="incident-head">
          <b>{incident.title}</b>
          <span className="incident-tag">{resolved ? INCIDENT_STATUS_LABEL.resolved : INCIDENT_SEVERITY_LABEL[incident.severity].title}</span>
        </div>
        {incident.detail && <p>{incident.detail}</p>}
        <small>
          {!resolved && <span className="incident-state">{INCIDENT_STATUS_LABEL[incident.status]}</span>}
          <span>
            {resolved ? 'Khắc phục' : 'Cập nhật'} {formatRelativeShort(incident.resolvedAt ?? incident.updatedAt, now).toLowerCase()}
          </span>
          {author && <span>{author.name}</span>}
        </small>
        {actions}
      </div>
    </li>
  );
}
