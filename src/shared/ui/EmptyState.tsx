// Empty or not-found state: a line figure or the mascot, a short message and an optional action.
import type { ReactNode } from 'react';
import { Mascot, type MascotMood } from '@/shared/mascot/Mascot';
import { type FigureName, LineFigure } from '@/shared/ui/LineFigure';

type Art = { figure: FigureName; figureLabel: string; mascot?: never } | { mascot: MascotMood; figure?: never; figureLabel?: never };

type Props = Art & {
  title: string;
  text?: string;
  children?: ReactNode;
};

export function EmptyState({ figure, figureLabel, mascot, title, text, children }: Props) {
  return (
    <div className="empty empty-figure">
      {mascot ? <Mascot mood={mascot} size={104} label="" /> : <LineFigure figure={figure!} label={figureLabel!} />}
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
