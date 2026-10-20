// Empty or not-found state: a line figure, a short message and an optional action.
import type { ReactNode } from 'react';
import { type FigureName, LineFigure } from '@/shared/ui/LineFigure';

interface Props {
  figure: FigureName;
  figureLabel: string;
  title: string;
  text?: string;
  children?: ReactNode;
}

export function EmptyState({ figure, figureLabel, title, text, children }: Props) {
  return (
    <div className="empty empty-figure">
      <LineFigure figure={figure} label={figureLabel} />
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
