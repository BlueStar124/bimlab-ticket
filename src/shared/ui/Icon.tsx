// Heroicons v2 (outline) through react-icons — the same icon family BIMLab HRM uses.
import type { IconType } from 'react-icons';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineBars3,
  HiOutlineBugAnt,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInboxStack,
  HiOutlineListBullet,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlinePlus,
  HiOutlineServerStack,
  HiOutlineTicket,
  HiOutlineUserPlus,
  HiOutlineViewColumns,
  HiOutlineXMark,
} from 'react-icons/hi2';

const ICONS = {
  // ticket kinds (see domain/areas.ts)
  bug: HiOutlineBugAnt,
  server: HiOutlineServerStack,
  // app icons
  plus: HiOutlinePlus,
  list: HiOutlineListBullet,
  inbox: HiOutlineInboxStack,
  board: HiOutlineViewColumns,
  chart: HiOutlineChartBar,
  search: HiOutlineMagnifyingGlass,
  userPlus: HiOutlineUserPlus,
  paperclip: HiOutlinePaperClip,
  send: HiOutlinePaperAirplane,
  arrowLeft: HiOutlineArrowLeft,
  check: HiOutlineCheck,
  checkCircle: HiOutlineCheckCircle,
  refresh: HiOutlineArrowPath,
  alert: HiOutlineExclamationTriangle,
  ticket: HiOutlineTicket,
  chat: HiOutlineChatBubbleLeftEllipsis,
  menu: HiOutlineBars3,
  close: HiOutlineXMark,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} size={size} aria-hidden="true" focusable="false" />;
}
