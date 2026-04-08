import { Match, SoccerMatch, BasketballMatch, MatchStatus, Team, Score, SoccerEvent } from '../mock/types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export const SOCCER_LEAGUES = [
  { slug: 'eng.1',          name: 'Premier League',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dateParam: 'date' },
  { slug: 'esp.1',          name: 'La Liga',            flag: '🇪🇸', dateParam: 'dates' },
  { slug: 'ger.1',          name: 'Bundesliga',         flag: '🇩🇪', dateParam: 'dates' },
  { slug: 'ita.1',          name: 'Serie A',            flag: '🇮🇹', dateParam: 'dates' },
  { slug: 'fra.1',          name: 'Ligue 1',            flag: '🇫🇷', dateParam: 'dates' },
  { slug: 'uefa.champions', name: 'Champions League',   flag: '🏆', dateParam: 'dates' },
  { slug: 'uefa.europa',    name: 'Europa League',      flag: '🥈', dateParam: 'dates' },
];

export const LEAGUE_FLAG: Record<string, string> = Object.fromEntries(
  SOCCER_LEAGUES.map(l => [l.name, l.flag])
);

const ENDPOINTS = {
  basketball: `${ESPN_BASE}/basketball/nba/scoreboard`,
  baseball: `${ESPN_BASE}/baseball/mlb/scoreboard`,
};

function soccerEndpoint(slug: string) {
  return `${ESPN_BASE}/soccer/${slug}/scoreboard`;
}
function soccerSummaryEndpoint(slug: string, eventId: string) {
  return `${ESPN_BASE}/soccer/${slug}/summary?event=${eventId}`;
}

// Map ESPN status to our MatchStatus
function mapStatus(state: string, completed: boolean): MatchStatus {
  if (completed) return 'FINISHED';
  if (state === 'in') return 'LIVE';
  return 'UPCOMING';
}

// Build a Team from ESPN competitor
function mapTeam(competitor: any, emoji: string): Team {
  return {
    id: competitor?.id ?? '',
    name: competitor?.team?.displayName ?? competitor?.team?.name ?? 'Unknown',
    shortName: competitor?.team?.abbreviation ?? competitor?.team?.shortDisplayName ?? '??',
    logo: competitor?.team?.logo ?? emoji,
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

// Parse ESPN keyEvents → SoccerEvent[]
function mapKeyEvents(keyEvents: any[], homeTeamId: string): SoccerEvent[] {
  const events: SoccerEvent[] = [];
  for (const e of keyEvents ?? []) {
    const typeText: string = e.type?.text ?? '';
    const clock: string = e.clock?.displayValue ?? '';
    const minute = parseInt(clock.replace("'", '').replace('+', '').split('+')[0]) || 0;
    if (minute === 0) continue;

    const teamId: string = e.team?.id ?? '';
    const team: 'home' | 'away' = teamId === homeTeamId ? 'home' : 'away';
    const player: string = e.participants?.[0]?.athlete?.shortName ?? e.participants?.[0]?.athlete?.displayName ?? '';

    if (typeText === 'Goal') {
      const isOwn = e.text?.toLowerCase().includes('own goal') ?? false;
      events.push({ type: 'GOAL', minute, player, team: isOwn ? (team === 'home' ? 'away' : 'home') : team, detail: isOwn ? 'Own Goal' : undefined });
    } else if (typeText === 'Yellow Card') {
      events.push({ type: 'CARD', minute, player, team, detail: 'Yellow Card' });
    } else if (typeText === 'Red Card' || typeText === 'Yellow-Red Card') {
      events.push({ type: 'CARD', minute, player, team, detail: 'Red Card' });
    } else if (typeText === 'Substitution') {
      const outPlayer: string = e.participants?.[1]?.athlete?.shortName ?? '';
      events.push({ type: 'SUBSTITUTION', minute, player, team, detail: outPlayer ? `→ ${outPlayer}` : undefined });
    }
  }
  return events.sort((a, b) => a.minute - b.minute);
}

// Parse ESPN boxscore stats
function mapBoxscoreStats(teams: any[], homeTeamId: string) {
  const getStat = (team: any, name: string): number => {
    const s = team?.statistics?.find((s: any) => s.name === name);
    return parseFloat(s?.displayValue ?? '0') || 0;
  };
  const homeTeam = teams?.find((t: any) => t.team?.id === homeTeamId) ?? teams?.[0];
  const awayTeam = teams?.find((t: any) => t.team?.id !== homeTeamId) ?? teams?.[1];
  return {
    possession: { home: getStat(homeTeam, 'possessionPct'), away: getStat(awayTeam, 'possessionPct') },
    shots: { home: getStat(homeTeam, 'totalShots'), away: getStat(awayTeam, 'totalShots') },
    shotsOnTarget: { home: getStat(homeTeam, 'shotsOnTarget'), away: getStat(awayTeam, 'shotsOnTarget') },
    corners: { home: getStat(homeTeam, 'wonCorners'), away: getStat(awayTeam, 'wonCorners') },
    fouls: { home: getStat(homeTeam, 'foulsCommitted'), away: getStat(awayTeam, 'foulsCommitted') },
  };
}

// Shift YYYYMMDD by delta days
function shiftDay(d: string, delta: number): string {
  const date = new Date(Date.UTC(+d.slice(0,4), +d.slice(4,6)-1, +d.slice(6,8)));
  date.setUTCDate(date.getUTCDate() + delta);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth()+1).padStart(2,'0')}${String(date.getUTCDate()).padStart(2,'0')}`;
}

// Convert event UTC date string to local YYYY-MM-DD
function toLocalDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function mapSoccerEvent(event: any, leagueName: string, leagueSlug: string, leagueFlag: string): SoccerMatch {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');
  const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
  return {
    id: `espn-soccer-${event.id}`,
    sport: 'soccer',
    status,
    leagueName,
    leagueSlug,
    leagueFlag,
    venue: comp?.venue?.fullName,
    homeTeam: mapTeam(home, '⚽'),
    awayTeam: mapTeam(away, '⚽'),
    score: mapScore(competitors),
    startTime: event.date,
    minute: status === 'LIVE' ? parseInt(comp?.status?.displayClock ?? '0') : undefined,
    events: [],
    stats: { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 }, corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 } },
  };
}

// Fetch matches for a single soccer league.
// Queries current date AND previous day to handle timezone offsets (e.g. European evening games
// appear on different ESPN calendar days vs local Korean time). Filters each event by local date.
async function fetchLeagueMatches(leagueSlug: string, leagueName: string, d: string, dateParam: string, requestedDate: string, leagueFlag = ''): Promise<SoccerMatch[]> {
  if (!d) {
    // No date specified — fetch default scoreboard
    const res = await fetch(soccerEndpoint(leagueSlug));
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events ?? []).map((e: any) => mapSoccerEvent(e, leagueName, leagueSlug, leagueFlag));
  }

  // Fetch current date AND previous day in parallel to catch cross-midnight games
  const prevD = shiftDay(d, -1);
  const [r1, r2] = await Promise.allSettled([
    fetch(soccerEndpoint(leagueSlug) + `?${dateParam}=${d}`).then(r => r.ok ? r.json() : null),
    fetch(soccerEndpoint(leagueSlug) + `?${dateParam}=${prevD}`).then(r => r.ok ? r.json() : null),
  ]);

  const seen = new Set<string>();
  const matches: SoccerMatch[] = [];

  for (const result of [r1, r2]) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const events: any[] = result.value.events ?? [];
    for (const event of events) {
      if (seen.has(event.id)) continue;
      // Filter: only include events whose local-timezone date matches requested date
      if (toLocalDate(event.date) !== requestedDate) continue;
      seen.add(event.id);
      matches.push(mapSoccerEvent(event, leagueName, leagueSlug, leagueFlag));
    }
  }
  return matches;
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

// Fetch summary (match detail + events + lineup + stats) for any soccer match
export async function fetchSoccerSummary(
  espnEventId: string,
  leagueSlug?: string
): Promise<{ match: SoccerMatch; lineups: TeamLineup[] | null } | null> {
  const numericId = espnEventId.replace('espn-soccer-', '');

  // Try provided slug first, then UEFA competitions, then domestic leagues
  const UEFA_FIRST = ['uefa.champions', 'uefa.europa'];
  const allSlugs = SOCCER_LEAGUES.map(l => l.slug);
  const defaultOrder = [...UEFA_FIRST, ...allSlugs.filter(s => !UEFA_FIRST.includes(s))];
  const slugsToTry = leagueSlug
    ? [leagueSlug, ...defaultOrder.filter(s => s !== leagueSlug)]
    : defaultOrder;

  for (const slug of slugsToTry) {
    try {
      const res = await fetch(soccerSummaryEndpoint(slug, numericId));
      if (!res.ok) continue;
      const data = await res.json();

      const comp = data.header?.competitions?.[0];
      if (!comp) continue;

      const competitors = comp.competitors ?? [];
      const home = competitors.find((c: any) => c.homeAway === 'home');
      const away = competitors.find((c: any) => c.homeAway === 'away');
      const status = mapStatus(comp.status?.type?.state, comp.status?.type?.completed);

      // Prefer ESPN's own league name from the response; fall back to our slug mapping
      const espnLeagueName: string = data.header?.league?.name ?? data.header?.leagues?.[0]?.name ?? '';
      const leagueName = espnLeagueName || SOCCER_LEAGUES.find(l => l.slug === slug)?.name || 'Soccer';
      const leagueFlag = SOCCER_LEAGUES.find(l => l.name === leagueName || l.slug === slug)?.flag ?? '⚽';

      // Parse real events from keyEvents
      const homeTeamId: string = home?.id ?? '';
      const events: SoccerEvent[] = mapKeyEvents(data.keyEvents, homeTeamId);

      // Parse real stats from boxscore
      const boxscoreTeams = data.boxscore?.teams ?? [];
      const stats = boxscoreTeams.length > 0
        ? mapBoxscoreStats(boxscoreTeams, homeTeamId)
        : { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 }, corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 } };

      const match: SoccerMatch = {
        id: espnEventId,
        sport: 'soccer',
        status,
        leagueName,
        leagueSlug: slug,
        leagueFlag,
        venue: data.gameInfo?.venue?.fullName ?? comp.venue?.fullName,
        homeTeam: mapTeam(home, '⚽'),
        awayTeam: mapTeam(away, '⚽'),
        score: mapScore(competitors),
        startTime: comp.date ?? new Date().toISOString(),
        minute: status === 'LIVE' ? parseInt(comp.status?.displayClock ?? '0') : undefined,
        events,
        stats,
      };

      const rosters = data.rosters ?? [];
      const lineups = rosters[0]?.roster ? rosters.map(buildLineup) : null;

      return { match, lineups };
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchSoccerLineup(espnEventId: string, leagueSlug?: string): Promise<TeamLineup[] | null> {
  const result = await fetchSoccerSummary(espnEventId, leagueSlug);
  return result?.lineups ?? null;
}

export async function fetchMatchesBySport(sport: SportType, date?: string): Promise<Match[]> {
  const d = date ? date.replace(/-/g, '') : '';
  const requestedDate = date ?? '';              // YYYY-MM-DD for day.date comparison
  const datesQuery = d ? `?dates=${d}` : '';    // NBA/MLB use ?dates=

  try {
    if (sport === 'soccer') {
      const results = await Promise.allSettled(
        SOCCER_LEAGUES.map(l => fetchLeagueMatches(l.slug, l.name, d, l.dateParam, requestedDate, l.flag))
      );
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    }

    if (sport === 'basketball') {
      const res = await fetch(ENDPOINTS.basketball + datesQuery);
      if (!res.ok) throw new Error('ESPN basketball fetch failed');
      const data = await res.json();
      if (requestedDate && data.day?.date && data.day.date !== requestedDate) return [];
      return (data.events ?? []).map((event: any): BasketballMatch => {
        const comp = event.competitions?.[0];
        const competitors = comp?.competitors ?? [];
        const home = competitors.find((c: any) => c.homeAway === 'home');
        const away = competitors.find((c: any) => c.homeAway === 'away');
        const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
        const homeLines: number[] = home?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
        const awayLines: number[] = away?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
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
          currentQuarter: status === 'LIVE' ? comp?.status?.period : undefined,
          quarterTimeLeft: status === 'LIVE' ? comp?.status?.displayClock : undefined,
          quarters: homeLines.map((h, i) => ({ quarter: i + 1, homeScore: h, awayScore: awayLines[i] ?? 0 })),
          stats: { fieldGoalPct: { home: 0, away: 0 }, threePointPct: { home: 0, away: 0 }, rebounds: { home: 0, away: 0 }, assists: { home: 0, away: 0 } },
        };
      });
    }

    // baseball: MLB
    const res = await fetch(ENDPOINTS.baseball + datesQuery);
    if (!res.ok) throw new Error('ESPN baseball fetch failed');
    const data = await res.json();
    if (requestedDate && data.day?.date && data.day.date !== requestedDate) return [];
    return (data.events ?? []).map((event: any) => {
      const comp = event.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      const home = competitors.find((c: any) => c.homeAway === 'home');
      const away = competitors.find((c: any) => c.homeAway === 'away');
      const status = mapStatus(comp?.status?.type?.state, comp?.status?.type?.completed);
      const homeLines: number[] = home?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
      const awayLines: number[] = away?.linescores?.map((l: any) => parseInt(l.value ?? '0', 10)) ?? [];
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
        innings: homeLines.map((h, i) => ({ inning: i + 1, homeRuns: h, awayRuns: awayLines[i] ?? 0 })),
        stats: { hits: { home: 0, away: 0 }, errors: { home: 0, away: 0 }, walks: { home: 0, away: 0 }, strikeouts: { home: 0, away: 0 } },
      };
    });
  } catch (e) {
    console.warn(`[ESPN] fetch failed for ${sport}:`, e);
    return [];
  }
}
