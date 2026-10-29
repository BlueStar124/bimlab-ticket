import type { Person } from '@/domain/ticket';

/** Last two words of a Vietnamese full name, e.g. "Minh Đức". */
export function shortName(person: Person): string {
  return person.name.split(' ').slice(-2).join(' ');
}
