// The IT team as configured on the server (GET /api/people). Loaded once after sign-in, before any page renders,
// so render code can read it synchronously.
import type { Person } from '@/domain/ticket';
import { apiRequest } from '@/data/apiClient';

let team: Person[] = [];

export function setTeam(people: Person[]) {
  team = people;
}

export function teamMembers(): Person[] {
  return team;
}

export function personById(id: string | null | undefined): Person | null {
  return team.find((p) => p.id === id) ?? null;
}

export function isMember(id: string): boolean {
  return team.some((p) => p.id === id);
}

export async function loadTeam(): Promise<Person[]> {
  const people = await apiRequest<Person[]>('/api/people');
  setTeam(people);
  return people;
}
