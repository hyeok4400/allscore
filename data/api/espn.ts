import { Match, SoccerMatch, BasketballMatch, MatchStatus, Team, Score } from '../mock/types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// ESPN sport endpoints
const ENDPOINTS = {
  soccer: `${ESPN_BASE}/soccer/eng.1/scoreboard`,   // EPL
  basketball: `${ESPN_BASE}/basketball/nba/scoreboard`, // NBA
  baseball: `${ESPN_BASE}/baseball/mlb/scoreboard`,  // MLB
};

// Map ESPN status to our MatchStatus
function mapStatus(state: string, completed: boolean): MatchStatus {
  if (completed) return 'FINISHED';
  if (state === 'in') return 'LIVE';
  return 'UPCOMING';
}

// Build a Team from ESPN competitor
function mapTeam(competitor: any, emoji: string): Team {
  return {
    id: competitor.id,
    name: competitor.team?.displayName ?? competitor.team?.name ?? 'Unknown',
    shortName: competitor.team?.abbreviation ?? competitor.team?.shortDisplayName ?? '??',
    logo: competitor.team?.logo ?? emoji,
  };
}

// Get home/away score
function mapScore(competitors: any[]): Score {
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');
  return {
    home: parseInt(home?.score ?? '0', 10),
    away: parseInt(away?.score ?? '0', 10),
  };
}

// Soccer (EPL)
async function fetchSoccerMatches(dateQuery = ''): Promise<SoccerMatch[]> {
  const res = await fetch(ENDPOINTS.soccer + dateQuery);
  if (!res.ok) throw new Error('ESPN soccer fetch failed');
  const data = await res.json();

  return (data.events ?? []).map((event: any): SoccerMatch => {
    const comp = event.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
    const minute = status === 'LIVE' ? parseInt(comp?.status?.displayClock ?? '0') : undefined;

    return {
      id: `espn-soccer-${event.id}`,
      sport: 'soccer',
      status,
      leagueName: 'EPL',
      venue: comp?.venue?.fullName,
      homeTeam: mapTeam(home, '⚽'),
      awayTeam: mapTeam(away, '⚽'),
      score: mapScore(competitors),
      startTime: event.date,
      minute,
      events: [],
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
      },
    };
  });
}

// Basketball (NBA)
async function fetchBasketballMatches(dateQuery = ''): Promise<BasketballMatch[]> {
  const res = await fetch(ENDPOINTS.basketball + dateQuery);
  if (!res.ok) throw new Error('ESPN basketball fetch failed');
  const data = await res.json();

  return (data.events ?? []).map((event: any): BasketballMatch => {
    const comp = event.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
    const currentQuarter = status === 'LIVE' ? comp?.status?.period : undefined;
    const quarterTimeLeft = status === 'LIVE' ? comp?.status?.displayClock : undefined;

    // Build quarters from linescores if available
    const homeLines: number[] = home?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
    const awayLines: number[] = away?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
    const quarters = homeLines.map((h, i) => ({
      quarter: i + 1,
      homeScore: h,
      awayScore: awayLines[i] ?? 0,
    }));

    return {
      id: `espn-bball-${event.id}`,
      sport: 'basketball',
      status,
      leagueName: 'NBA',
      venue: comp?.venue?.fullName,
      homeTeam: mapTeam(home, '🏀'),
      awayTeam: mapTeam(away, '🏀'),
      score: mapScore(competitors),
      startTime: event.date,
      currentQuarter,
      quarterTimeLeft,
      quarters,
      stats: {
        fieldGoalPct: { home: 0, away: 0 },
        threePointPct: { home: 0, away: 0 },
        rebounds: { home: 0, away: 0 },
        assists: { home: 0, away: 0 },
      },
    };
  });
}

export type SportType = 'soccer' | 'baseball' | 'basketball';

export interface LineupPlayer {
  name: string;
  jersey: string;
  position: string;
  formationPlace: number;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
}

export interface TeamLineup {
  homeAway: 'home' | 'away';
  formation: string;
  teamColor: string;
  teamName: string;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export async function fetchSoccerLineup(espnEventId: string): Promise<TeamLineup[] | null> {
  try {
    // espnEventId는 "espn-soccer-704584" 형태이므로 숫자 ID만 추출
    const numericId = espnEventId.replace('espn-soccer-', '');
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${numericId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rosters = data.rosters ?? [];
    if (!rosters[0]?.roster) return null;  // 라인업 미발표

    return rosters.map(buildLineup);
  } catch {
    return null;
  }
}

// Build TeamLineup from roster entry (shared logic)
function buildLineup(r: any): TeamLineup {
  const all: LineupPlayer[] = (r.roster ?? []).map((p: any) => ({
    name: p.athlete?.shortName ?? p.athlete?.displayName ?? '?',
    jersey: p.jersey ?? '',
    position: p.position?.abbreviation ?? '',
    formationPlace: parseInt(p.formationPlace ?? '0', 10),
    starter: !!p.starter,
    subbedIn: !!p.subbedIn,
    subbedOut: !!p.subbedOut,
  }));
  return {
    homeAway: r.homeAway,
    formation: r.formation ?? '',
    teamColor: '#' + (r.team?.color ?? '1D3557'),
    teamName: r.team?.displayName ?? '',
    starters: all.filter(p => p.starter).sort((a, b) => a.formationPlace - b.formationPlace),
    bench: all.filter(p => !p.starter),
  };
}

// Fetch full match detail + lineup from ESPN summary API (works for any match, any date)
export async function fetchSoccerSummary(
  espnEventId: string
): Promise<{ match: SoccerMatch; lineups: TeamLineup[] | null } | null> {
  try {
    const numericId = espnEventId.replace('espn-soccer-', '');
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${numericId}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const comp = data.header?.competitions?.[0];
    if (!comp) return null;

    const competitors = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    const status = mapStatus(comp.status?.type?.state, comp.status?.type?.completed);
    const minute = status === 'LIVE' ? parseInt(comp.status?.displayClock ?? '0') : undefined;

    const match: SoccerMatch = {
      id: espnEventId,
      sport: 'soccer',
      status,
      leagueName: 'EPL',
      venue: data.gameInfo?.venue?.fullName ?? comp.venue?.fullName,
      homeTeam: mapTeam(home, '⚽'),
      awayTeam: mapTeam(away, '⚽'),
      score: mapScore(competitors),
      startTime: comp.date ?? new Date().toISOString(),
      minute,
      events: [],
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
      },
    };

    const rosters = data.rosters ?? [];
    const lineups = rosters[0]?.roster ? rosters.map(buildLineup) : null;

    return { match, lineups };
  } catch {
    return null;
  }
}

export async function fetchMatchesBySport(sport: SportType, date?: string): Promise<Match[]> {
  // date: 'YYYY-MM-DD' → ESPN expects 'YYYYMMDD'
  // soccer uses ?date= (singular), basketball/baseball use ?dates= (plural)
  const d = date ? date.replace(/-/g, '') : '';
  const soccerQuery = d ? `?date=${d}` : '';
  const otherQuery = d ? `?dates=${d}` : '';
  try {
    if (sport === 'soccer') return await fetchSoccerMatches(soccerQuery);
    if (sport === 'basketball') return await fetchBasketballMatches(otherQuery);
    // baseball: MLB fetch
    const res = await fetch(ENDPOINTS.baseball + otherQuery);
    if (!res.ok) throw new Error('ESPN baseball fetch failed');
    const data = await res.json();
    return (data.events ?? []).map((event: any) => {
      const comp = event.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      const home = competitors.find((c: any) => c.homeAway === 'home');
      const away = competitors.find((c: any) => c.homeAway === 'away');
      const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
      const homeLines: number[] = home?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
      const awayLines: number[] = away?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
      const innings = homeLines.map((h, i) => ({
        inning: i + 1,
        homeRuns: h,
        awayRuns: awayLines[i] ?? 0,
      }));
      return {
        id: `espn-baseball-${event.id}`,
        sport: 'baseball' as const,
        status,
        leagueName: 'MLB',
        venue: comp?.venue?.fullName,
        homeTeam: mapTeam(home, '⚾'),
        awayTeam: mapTeam(away, '⚾'),
        score: mapScore(competitors),
        startTime: event.date,
        currentInning: status === 'LIVE' ? comp?.status?.period : undefined,
        innings,
        stats: {
          hits: { home: 0, away: 0 },
          errors: { home: 0, away: 0 },
          walks: { home: 0, away: 0 },
          strikeouts: { home: 0, away: 0 },
        },
      };
    });
  } catch (e) {
    console.warn(`[ESPN] fetch failed for ${sport}, falling back to mock:`, e);
    return [];
  }
}
