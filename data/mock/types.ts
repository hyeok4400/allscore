export type SportType = 'soccer' | 'baseball' | 'basketball';
export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string; // emoji or URL placeholder
}

export interface Score {
  home: number;
  away: number;
}

// Soccer types
export type SoccerEventType = 'GOAL' | 'CARD' | 'SUBSTITUTION';
export interface SoccerEvent {
  type: SoccerEventType;
  minute: number;
  player: string;
  team: 'home' | 'away';
  detail?: string; // e.g. "Yellow Card", "Red Card", "Own Goal"
}

export interface SoccerStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
}

// Baseball types
export interface BaseballInning {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

export interface BaseballStats {
  hits: { home: number; away: number };
  errors: { home: number; away: number };
  walks: { home: number; away: number };
  strikeouts: { home: number; away: number };
}

// Basketball types
export interface BasketballQuarter {
  quarter: number;
  homeScore: number;
  awayScore: number;
}

export interface BasketballStats {
  fieldGoalPct: { home: number; away: number };
  threePointPct: { home: number; away: number };
  rebounds: { home: number; away: number };
  assists: { home: number; away: number };
}

// Base match interface
export interface BaseMatch {
  id: string;
  sport: SportType;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  startTime: string; // ISO 8601
  leagueName: string;
  leagueSlug?: string; // e.g. 'eng.1', 'uefa.champions'
  venue?: string;
}

// Soccer match
export interface SoccerMatch extends BaseMatch {
  sport: 'soccer';
  minute?: number;
  events: SoccerEvent[];
  stats: SoccerStats;
}

// Baseball match
export interface BaseballMatch extends BaseMatch {
  sport: 'baseball';
  currentInning?: number;
  inningHalf?: 'top' | 'bottom';
  innings: BaseballInning[];
  stats: BaseballStats;
}

// Basketball match
export interface BasketballMatch extends BaseMatch {
  sport: 'basketball';
  currentQuarter?: number;
  quarterTimeLeft?: string;
  quarters: BasketballQuarter[];
  stats: BasketballStats;
}

export type Match = SoccerMatch | BaseballMatch | BasketballMatch;
