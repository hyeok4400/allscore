import { Match } from './mock/types';

// 홈 화면에서 로드한 경기를 캐싱 — 경기 상세 화면에서 꺼내씀
const cache: Map<string, Match> = new Map();

export function setMatches(matches: Match[]) {
  matches.forEach(m => cache.set(m.id, m));
}

export function getMatchById(id: string): Match | undefined {
  return cache.get(id);
}
