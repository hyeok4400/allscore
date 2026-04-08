import { SoccerMatch, BaseballMatch, BasketballMatch, Match } from './types';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Helper to build ISO time string for today
const t = (hour: number, min: number = 0) =>
  `${todayStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`;

// ─── Soccer Matches ───────────────────────────────────────────────────────────

export const soccerMatches: SoccerMatch[] = [
  {
    id: 'soccer-001',
    sport: 'soccer',
    status: 'LIVE',
    leagueName: 'K리그1',
    venue: '서울월드컵경기장',
    homeTeam: { id: 'fcu', name: 'FC 서울', shortName: '서울', logo: '⚽' },
    awayTeam: { id: 'jbh', name: '전북 현대', shortName: '전북', logo: '⚽' },
    score: { home: 2, away: 1 },
    startTime: t(19, 0),
    minute: 67,
    events: [
      { type: 'GOAL', minute: 23, player: '주민규', team: 'home' },
      { type: 'CARD', minute: 34, player: '홍정호', team: 'away', detail: 'Yellow Card' },
      { type: 'GOAL', minute: 51, player: '구스타보', team: 'away' },
      { type: 'GOAL', minute: 58, player: '나상호', team: 'home' },
      { type: 'SUBSTITUTION', minute: 63, player: '박주영 → 황의조', team: 'home' },
    ],
    stats: {
      possession: { home: 54, away: 46 },
      shots: { home: 12, away: 8 },
      shotsOnTarget: { home: 5, away: 3 },
      corners: { home: 6, away: 3 },
      fouls: { home: 9, away: 14 },
    },
  },
  {
    id: 'soccer-002',
    sport: 'soccer',
    status: 'UPCOMING',
    leagueName: 'K리그1',
    venue: '울산문수축구경기장',
    homeTeam: { id: 'uhd', name: '울산 HD', shortName: '울산', logo: '⚽' },
    awayTeam: { id: 'pod', name: '포항 스틸러스', shortName: '포항', logo: '⚽' },
    score: { home: 0, away: 0 },
    startTime: t(20, 0),
    events: [],
    stats: {
      possession: { home: 0, away: 0 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
    },
  },
  {
    id: 'soccer-003',
    sport: 'soccer',
    status: 'FINISHED',
    leagueName: 'EPL',
    venue: 'Old Trafford',
    homeTeam: { id: 'mnu', name: 'Manchester United', shortName: 'Man Utd', logo: '⚽' },
    awayTeam: { id: 'mci', name: 'Manchester City', shortName: 'Man City', logo: '⚽' },
    score: { home: 1, away: 3 },
    startTime: t(4, 30),
    events: [
      { type: 'GOAL', minute: 12, player: 'Rashford', team: 'home' },
      { type: 'GOAL', minute: 29, player: 'Haaland', team: 'away' },
      { type: 'GOAL', minute: 45, player: 'De Bruyne', team: 'away' },
      { type: 'CARD', minute: 72, player: 'Casemiro', team: 'home', detail: 'Red Card' },
      { type: 'GOAL', minute: 85, player: 'Foden', team: 'away' },
    ],
    stats: {
      possession: { home: 38, away: 62 },
      shots: { home: 9, away: 18 },
      shotsOnTarget: { home: 3, away: 8 },
      corners: { home: 3, away: 9 },
      fouls: { home: 16, away: 11 },
    },
  },
  {
    id: 'soccer-004',
    sport: 'soccer',
    status: 'FINISHED',
    leagueName: 'EPL',
    venue: 'Anfield',
    homeTeam: { id: 'liv', name: 'Liverpool', shortName: 'LFC', logo: '⚽' },
    awayTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: '⚽' },
    score: { home: 2, away: 2 },
    startTime: t(2, 0),
    events: [
      { type: 'GOAL', minute: 8, player: 'Salah', team: 'home' },
      { type: 'GOAL', minute: 33, player: 'Saka', team: 'away' },
      { type: 'GOAL', minute: 61, player: 'Martinelli', team: 'away' },
      { type: 'GOAL', minute: 89, player: 'Diaz', team: 'home' },
    ],
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 15, away: 13 },
      shotsOnTarget: { home: 6, away: 5 },
      corners: { home: 7, away: 6 },
      fouls: { home: 10, away: 12 },
    },
  },
];

// ─── Baseball Matches ─────────────────────────────────────────────────────────

export const baseballMatches: BaseballMatch[] = [
  {
    id: 'baseball-001',
    sport: 'baseball',
    status: 'LIVE',
    leagueName: 'KBO 리그',
    venue: '잠실야구장',
    homeTeam: { id: 'lgtwins', name: 'LG 트윈스', shortName: 'LG', logo: '⚾' },
    awayTeam: { id: 'ktw', name: 'KT 위즈', shortName: 'KT', logo: '⚾' },
    score: { home: 5, away: 3 },
    startTime: t(18, 30),
    currentInning: 7,
    inningHalf: 'bottom',
    innings: [
      { inning: 1, homeRuns: 0, awayRuns: 1 },
      { inning: 2, homeRuns: 2, awayRuns: 0 },
      { inning: 3, homeRuns: 0, awayRuns: 0 },
      { inning: 4, homeRuns: 1, awayRuns: 2 },
      { inning: 5, homeRuns: 0, awayRuns: 0 },
      { inning: 6, homeRuns: 2, awayRuns: 0 },
      { inning: 7, homeRuns: 0, awayRuns: 0 },
    ],
    stats: {
      hits: { home: 9, away: 7 },
      errors: { home: 1, away: 2 },
      walks: { home: 3, away: 4 },
      strikeouts: { home: 6, away: 8 },
    },
  },
  {
    id: 'baseball-002',
    sport: 'baseball',
    status: 'UPCOMING',
    leagueName: 'KBO 리그',
    venue: '사직야구장',
    homeTeam: { id: 'lotteg', name: '롯데 자이언츠', shortName: '롯데', logo: '⚾' },
    awayTeam: { id: 'ssgland', name: 'SSG 랜더스', shortName: 'SSG', logo: '⚾' },
    score: { home: 0, away: 0 },
    startTime: t(18, 30),
    innings: [],
    stats: {
      hits: { home: 0, away: 0 },
      errors: { home: 0, away: 0 },
      walks: { home: 0, away: 0 },
      strikeouts: { home: 0, away: 0 },
    },
  },
  {
    id: 'baseball-003',
    sport: 'baseball',
    status: 'FINISHED',
    leagueName: 'KBO 리그',
    venue: '고척스카이돔',
    homeTeam: { id: 'kiwoom', name: '키움 히어로즈', shortName: '키움', logo: '⚾' },
    awayTeam: { id: 'hanwha', name: '한화 이글스', shortName: '한화', logo: '⚾' },
    score: { home: 3, away: 7 },
    startTime: t(14, 0),
    innings: [
      { inning: 1, homeRuns: 0, awayRuns: 2 },
      { inning: 2, homeRuns: 1, awayRuns: 0 },
      { inning: 3, homeRuns: 0, awayRuns: 3 },
      { inning: 4, homeRuns: 2, awayRuns: 0 },
      { inning: 5, homeRuns: 0, awayRuns: 1 },
      { inning: 6, homeRuns: 0, awayRuns: 0 },
      { inning: 7, homeRuns: 0, awayRuns: 1 },
      { inning: 8, homeRuns: 0, awayRuns: 0 },
      { inning: 9, homeRuns: 0, awayRuns: 0 },
    ],
    stats: {
      hits: { home: 6, away: 12 },
      errors: { home: 2, away: 0 },
      walks: { home: 2, away: 5 },
      strikeouts: { home: 9, away: 7 },
    },
  },
  {
    id: 'baseball-004',
    sport: 'baseball',
    status: 'FINISHED',
    leagueName: 'KBO 리그',
    venue: '대구삼성라이온즈파크',
    homeTeam: { id: 'samsung', name: '삼성 라이온즈', shortName: '삼성', logo: '⚾' },
    awayTeam: { id: 'doosan', name: '두산 베어스', shortName: '두산', logo: '⚾' },
    score: { home: 4, away: 4 },
    startTime: t(14, 0),
    innings: [
      { inning: 1, homeRuns: 1, awayRuns: 0 },
      { inning: 2, homeRuns: 0, awayRuns: 2 },
      { inning: 3, homeRuns: 2, awayRuns: 0 },
      { inning: 4, homeRuns: 0, awayRuns: 1 },
      { inning: 5, homeRuns: 0, awayRuns: 1 },
      { inning: 6, homeRuns: 1, awayRuns: 0 },
      { inning: 7, homeRuns: 0, awayRuns: 0 },
      { inning: 8, homeRuns: 0, awayRuns: 0 },
      { inning: 9, homeRuns: 0, awayRuns: 0 },
    ],
    stats: {
      hits: { home: 8, away: 9 },
      errors: { home: 1, away: 1 },
      walks: { home: 3, away: 3 },
      strikeouts: { home: 8, away: 7 },
    },
  },
];

// ─── Basketball Matches ───────────────────────────────────────────────────────

export const basketballMatches: BasketballMatch[] = [
  {
    id: 'basketball-001',
    sport: 'basketball',
    status: 'LIVE',
    leagueName: 'KBL',
    venue: '잠실실내체육관',
    homeTeam: { id: 'seoulsk', name: '서울 SK 나이츠', shortName: 'SK', logo: '🏀' },
    awayTeam: { id: 'anyang', name: '안양 정관장', shortName: '정관장', logo: '🏀' },
    score: { home: 78, away: 72 },
    startTime: t(19, 0),
    currentQuarter: 4,
    quarterTimeLeft: '3:24',
    quarters: [
      { quarter: 1, homeScore: 24, awayScore: 21 },
      { quarter: 2, homeScore: 18, awayScore: 22 },
      { quarter: 3, homeScore: 21, awayScore: 15 },
      { quarter: 4, homeScore: 15, awayScore: 14 },
    ],
    stats: {
      fieldGoalPct: { home: 48, away: 44 },
      threePointPct: { home: 38, away: 32 },
      rebounds: { home: 34, away: 29 },
      assists: { home: 18, away: 15 },
    },
  },
  {
    id: 'basketball-002',
    sport: 'basketball',
    status: 'UPCOMING',
    leagueName: 'KBL',
    venue: '원주종합체육관',
    homeTeam: { id: 'wonju', name: '원주 DB 프로미', shortName: 'DB', logo: '🏀' },
    awayTeam: { id: 'ulsan', name: '울산 현대모비스', shortName: '모비스', logo: '🏀' },
    score: { home: 0, away: 0 },
    startTime: t(19, 30),
    quarters: [],
    stats: {
      fieldGoalPct: { home: 0, away: 0 },
      threePointPct: { home: 0, away: 0 },
      rebounds: { home: 0, away: 0 },
      assists: { home: 0, away: 0 },
    },
  },
  {
    id: 'basketball-003',
    sport: 'basketball',
    status: 'FINISHED',
    leagueName: 'KBL',
    venue: '부산사직실내체육관',
    homeTeam: { id: 'busan', name: '부산 KCC 이지스', shortName: 'KCC', logo: '🏀' },
    awayTeam: { id: 'goyang', name: '고양 소노 스카이거너스', shortName: '소노', logo: '🏀' },
    score: { home: 88, away: 95 },
    startTime: t(14, 0),
    quarters: [
      { quarter: 1, homeScore: 22, awayScore: 28 },
      { quarter: 2, homeScore: 24, awayScore: 23 },
      { quarter: 3, homeScore: 19, awayScore: 25 },
      { quarter: 4, homeScore: 23, awayScore: 19 },
    ],
    stats: {
      fieldGoalPct: { home: 41, away: 52 },
      threePointPct: { home: 28, away: 41 },
      rebounds: { home: 32, away: 38 },
      assists: { home: 19, away: 24 },
    },
  },
  {
    id: 'basketball-004',
    sport: 'basketball',
    status: 'FINISHED',
    leagueName: 'KBL',
    venue: '창원실내체육관',
    homeTeam: { id: 'changwon', name: '창원 LG 세이커스', shortName: 'LG', logo: '🏀' },
    awayTeam: { id: 'daegu', name: '대구 한국가스공사', shortName: '가스公', logo: '🏀' },
    score: { home: 102, away: 89 },
    startTime: t(16, 0),
    quarters: [
      { quarter: 1, homeScore: 28, awayScore: 22 },
      { quarter: 2, homeScore: 25, awayScore: 24 },
      { quarter: 3, homeScore: 26, awayScore: 21 },
      { quarter: 4, homeScore: 23, awayScore: 22 },
    ],
    stats: {
      fieldGoalPct: { home: 55, away: 43 },
      threePointPct: { home: 44, away: 31 },
      rebounds: { home: 40, away: 33 },
      assists: { home: 26, away: 19 },
    },
  },
];

export const allMatches: Match[] = [
  ...soccerMatches,
  ...baseballMatches,
  ...basketballMatches,
];

export function getMatchesBySport(sport: string): Match[] {
  return allMatches.filter((m) => m.sport === sport);
}

export function getMatchById(id: string): Match | undefined {
  return allMatches.find((m) => m.id === id);
}

export function getMatchesByDate(dateStr: string): Match[] {
  return allMatches.filter((m) => m.startTime.startsWith(dateStr));
}
