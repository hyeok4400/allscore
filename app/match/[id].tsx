import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';

function TeamLogo({ logo, size = 32 }: { logo: string; size?: number }) {
  if (logo.startsWith('http')) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return <Text style={{ fontSize: size }}>{logo}</Text>;
}
import { useLocalSearchParams, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getMatchById as getMockMatchById } from '../../data/mock/matches';
import { getMatchById as getCachedMatchById } from '../../data/matchCache';
import { fetchMatchesBySport, fetchSoccerLineup, fetchSoccerSummary, TeamLineup } from '../../data/api/espn';
import { setMatches as cacheMatches } from '../../data/matchCache';
import LineupView from '../../components/LineupView';
import {
  Match,
  SoccerMatch,
  BaseballMatch,
  BasketballMatch,
  SoccerEvent,
} from '../../data/mock/types';
import LiveBadge from '../../components/LiveBadge';
import Colors from '../../constants/colors';

const FAVORITES_STORAGE_KEY = '@allscore_favorites';

type DetailTab = 'summary' | 'events' | 'stats' | 'lineup';

function getSportLabel(sport: string): string {
  if (sport === 'soccer') return '타임라인';
  if (sport === 'baseball') return '이닝표';
  return '쿼터표';
}

function getStatusDetail(match: Match): string | undefined {
  if (match.status === 'LIVE') {
    if (match.sport === 'soccer') {
      const sm = match as SoccerMatch;
      return sm.minute ? `${sm.minute}'` : 'LIVE';
    }
    if (match.sport === 'baseball') {
      const bm = match as BaseballMatch;
      return bm.currentInning
        ? `${bm.currentInning}회${bm.inningHalf === 'top' ? '초' : '말'}`
        : 'LIVE';
    }
    if (match.sport === 'basketball') {
      const bkm = match as BasketballMatch;
      return bkm.currentQuarter
        ? `Q${bkm.currentQuarter} ${bkm.quarterTimeLeft ?? ''}`
        : 'LIVE';
    }
  }
  return undefined;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreHeader({ match, isFav, onToggleFav }: { match: Match; isFav: boolean; onToggleFav: () => void }) {
  const statusDetail = getStatusDetail(match);

  const startTime = new Date(match.startTime);
  const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.topRow}>
        <View style={headerStyles.badgeRow}>
          <LiveBadge status={match.status} detail={statusDetail} />
          <Text style={headerStyles.league}>{match.leagueName}</Text>
        </View>
        <TouchableOpacity onPress={onToggleFav} style={headerStyles.favBtn}>
          <Text style={headerStyles.favIcon}>{isFav ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <View style={headerStyles.scoreRow}>
        {/* Home Team */}
        <View style={headerStyles.teamCol}>
          <TeamLogo logo={match.homeTeam.logo} size={40} />
          <Text style={headerStyles.teamName}>{match.homeTeam.name}</Text>
        </View>

        {/* Score */}
        <View style={headerStyles.scoreCol}>
          {match.status === 'UPCOMING' ? (
            <>
              <Text style={headerStyles.scoreVs}>vs</Text>
              <Text style={headerStyles.kickoffTime}>{timeStr}</Text>
            </>
          ) : (
            <Text style={headerStyles.score}>
              {match.score.home} - {match.score.away}
            </Text>
          )}
        </View>

        {/* Away Team */}
        <View style={[headerStyles.teamCol, headerStyles.awayCol]}>
          <TeamLogo logo={match.awayTeam.logo} size={40} />
          <Text style={headerStyles.teamName}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {match.venue && (
        <Text style={headerStyles.venue}>📍 {match.venue}</Text>
      )}
    </View>
  );
}

// Soccer Timeline
function SoccerTimeline({ match }: { match: SoccerMatch }) {
  const events = [...match.events].sort((a, b) => a.minute - b.minute);

  const eventIcon = (e: SoccerEvent): string => {
    if (e.type === 'GOAL') return '⚽';
    if (e.type === 'CARD') {
      return e.detail?.includes('Red') ? '🟥' : '🟨';
    }
    return '🔄';
  };

  if (events.length === 0) {
    return (
      <View style={eventStyles.empty}>
        <Text style={eventStyles.emptyText}>아직 이벤트가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={eventStyles.container}>
      {events.map((e, i) => (
        <View
          key={i}
          style={[
            eventStyles.row,
            e.team === 'home' ? eventStyles.rowHome : eventStyles.rowAway,
          ]}
        >
          {e.team === 'home' ? (
            <>
              <View style={eventStyles.homeContent}>
                <Text style={eventStyles.playerName}>{e.player}</Text>
                {e.detail && <Text style={eventStyles.detail}>{e.detail}</Text>}
              </View>
              <View style={eventStyles.minuteCol}>
                <Text style={eventStyles.minute}>{e.minute}'</Text>
              </View>
              <Text style={eventStyles.eventIcon}>{eventIcon(e)}</Text>
              <View style={eventStyles.awayPlaceholder} />
            </>
          ) : (
            <>
              <View style={eventStyles.homePlaceholder} />
              <Text style={eventStyles.eventIcon}>{eventIcon(e)}</Text>
              <View style={eventStyles.minuteCol}>
                <Text style={eventStyles.minute}>{e.minute}'</Text>
              </View>
              <View style={eventStyles.awayContent}>
                <Text style={eventStyles.playerName}>{e.player}</Text>
                {e.detail && <Text style={eventStyles.detail}>{e.detail}</Text>}
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// Baseball Innings Table
function BaseballInnings({ match }: { match: BaseballMatch }) {
  const innings = match.innings;

  if (innings.length === 0) {
    return (
      <View style={inningStyles.empty}>
        <Text style={inningStyles.emptyText}>이닝 데이터가 없습니다</Text>
      </View>
    );
  }

  const homeTotal = innings.reduce((s, i) => s + i.homeRuns, 0);
  const awayTotal = innings.reduce((s, i) => s + i.awayRuns, 0);

  return (
    <View style={inningStyles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={inningStyles.row}>
            <View style={inningStyles.teamCell}>
              <Text style={inningStyles.headerText}>팀</Text>
            </View>
            {innings.map((ing) => (
              <View key={ing.inning} style={inningStyles.cell}>
                <Text style={inningStyles.headerText}>{ing.inning}</Text>
              </View>
            ))}
            <View style={inningStyles.totalCell}>
              <Text style={inningStyles.headerText}>R</Text>
            </View>
          </View>

          {/* Away row */}
          <View style={inningStyles.row}>
            <View style={inningStyles.teamCell}>
              <Text style={inningStyles.teamText}>{match.awayTeam.shortName}</Text>
            </View>
            {innings.map((ing) => (
              <View key={ing.inning} style={inningStyles.cell}>
                <Text style={inningStyles.cellText}>{ing.awayRuns}</Text>
              </View>
            ))}
            <View style={inningStyles.totalCell}>
              <Text style={inningStyles.totalText}>{awayTotal}</Text>
            </View>
          </View>

          {/* Home row */}
          <View style={inningStyles.row}>
            <View style={inningStyles.teamCell}>
              <Text style={inningStyles.teamText}>{match.homeTeam.shortName}</Text>
            </View>
            {innings.map((ing) => (
              <View key={ing.inning} style={inningStyles.cell}>
                <Text style={inningStyles.cellText}>{ing.homeRuns}</Text>
              </View>
            ))}
            <View style={inningStyles.totalCell}>
              <Text style={inningStyles.totalText}>{homeTotal}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Basketball Quarters Table
function BasketballQuarters({ match }: { match: BasketballMatch }) {
  const quarters = match.quarters;

  if (quarters.length === 0) {
    return (
      <View style={quarterStyles.empty}>
        <Text style={quarterStyles.emptyText}>쿼터 데이터가 없습니다</Text>
      </View>
    );
  }

  const homeTotal = quarters.reduce((s, q) => s + q.homeScore, 0);
  const awayTotal = quarters.reduce((s, q) => s + q.awayScore, 0);

  return (
    <View style={quarterStyles.container}>
      <View style={quarterStyles.row}>
        <View style={quarterStyles.teamCell}>
          <Text style={quarterStyles.headerText}>팀</Text>
        </View>
        {quarters.map((q) => (
          <View key={q.quarter} style={quarterStyles.cell}>
            <Text style={quarterStyles.headerText}>Q{q.quarter}</Text>
          </View>
        ))}
        <View style={quarterStyles.totalCell}>
          <Text style={quarterStyles.headerText}>합계</Text>
        </View>
      </View>

      <View style={quarterStyles.row}>
        <View style={quarterStyles.teamCell}>
          <Text style={quarterStyles.teamText}>{match.awayTeam.shortName}</Text>
        </View>
        {quarters.map((q) => (
          <View key={q.quarter} style={quarterStyles.cell}>
            <Text style={quarterStyles.cellText}>{q.awayScore}</Text>
          </View>
        ))}
        <View style={quarterStyles.totalCell}>
          <Text style={quarterStyles.totalText}>{awayTotal}</Text>
        </View>
      </View>

      <View style={quarterStyles.row}>
        <View style={quarterStyles.teamCell}>
          <Text style={quarterStyles.teamText}>{match.homeTeam.shortName}</Text>
        </View>
        {quarters.map((q) => (
          <View key={q.quarter} style={quarterStyles.cell}>
            <Text style={quarterStyles.cellText}>{q.homeScore}</Text>
          </View>
        ))}
        <View style={quarterStyles.totalCell}>
          <Text style={quarterStyles.totalText}>{homeTotal}</Text>
        </View>
      </View>
    </View>
  );
}

// Stats section
function StatRow({ label, home, away, isPercent = false }: { label: string; home: number; away: number; isPercent?: boolean }) {
  const total = home + away;
  const homeRatio = total > 0 ? home / total : 0.5;

  return (
    <View style={statStyles.row}>
      <Text style={statStyles.homeVal}>{isPercent ? `${home}%` : home}</Text>
      <View style={statStyles.barContainer}>
        <Text style={statStyles.label}>{label}</Text>
        <View style={statStyles.bar}>
          <View style={[statStyles.barFill, { flex: homeRatio }]} />
          <View style={[statStyles.barFillAway, { flex: 1 - homeRatio }]} />
        </View>
      </View>
      <Text style={statStyles.awayVal}>{isPercent ? `${away}%` : away}</Text>
    </View>
  );
}

function SoccerStats({ match }: { match: SoccerMatch }) {
  const s = match.stats;
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.sectionTitle}>팀 스탯</Text>
      <View style={statStyles.teamHeaders}>
        <Text style={statStyles.homeTeam}>{match.homeTeam.shortName}</Text>
        <Text style={statStyles.awayTeam}>{match.awayTeam.shortName}</Text>
      </View>
      <StatRow label="점유율" home={s.possession.home} away={s.possession.away} isPercent />
      <StatRow label="슈팅" home={s.shots.home} away={s.shots.away} />
      <StatRow label="유효 슈팅" home={s.shotsOnTarget.home} away={s.shotsOnTarget.away} />
      <StatRow label="코너킥" home={s.corners.home} away={s.corners.away} />
      <StatRow label="파울" home={s.fouls.home} away={s.fouls.away} />
    </View>
  );
}

function BaseballStats({ match }: { match: BaseballMatch }) {
  const s = match.stats;
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.sectionTitle}>팀 스탯</Text>
      <View style={statStyles.teamHeaders}>
        <Text style={statStyles.homeTeam}>{match.homeTeam.shortName}</Text>
        <Text style={statStyles.awayTeam}>{match.awayTeam.shortName}</Text>
      </View>
      <StatRow label="안타" home={s.hits.home} away={s.hits.away} />
      <StatRow label="실책" home={s.errors.home} away={s.errors.away} />
      <StatRow label="볼넷" home={s.walks.home} away={s.walks.away} />
      <StatRow label="삼진" home={s.strikeouts.home} away={s.strikeouts.away} />
    </View>
  );
}

function BasketballStats({ match }: { match: BasketballMatch }) {
  const s = match.stats;
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.sectionTitle}>팀 스탯</Text>
      <View style={statStyles.teamHeaders}>
        <Text style={statStyles.homeTeam}>{match.homeTeam.shortName}</Text>
        <Text style={statStyles.awayTeam}>{match.awayTeam.shortName}</Text>
      </View>
      <StatRow label="야투율" home={s.fieldGoalPct.home} away={s.fieldGoalPct.away} isPercent />
      <StatRow label="3점슛" home={s.threePointPct.home} away={s.threePointPct.away} isPercent />
      <StatRow label="리바운드" home={s.rebounds.home} away={s.rebounds.away} />
      <StatRow label="어시스트" home={s.assists.home} away={s.assists.away} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');
  const [isFav, setIsFav] = useState(false);
  const [lineups, setLineups] = useState<TeamLineup[] | null>(null);
  const [lineupLoaded, setLineupLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;

    // 1. 캐시에 있으면 바로 표시
    const cached = getCachedMatchById(id) ?? getMockMatchById(id);
    if (cached) {
      setMatch(cached);
      setMatchLoading(false);
      return;
    }

    const sport = id.startsWith('espn-soccer') ? 'soccer'
      : id.startsWith('espn-bball') ? 'basketball'
      : id.startsWith('espn-baseball') ? 'baseball'
      : null;

    if (!sport) {
      setMatch(null);
      setMatchLoading(false);
      return;
    }

    // 2. 오늘 스코어보드에서 찾기
    fetchMatchesBySport(sport).then(async matches => {
      cacheMatches(matches);
      const found = matches.find(m => m.id === id);
      if (found) {
        setMatch(found);
        setMatchLoading(false);
        return;
      }

      // 3. 스코어보드에 없음(과거 경기 등) — summary API로 직접 조회
      if (sport === 'soccer') {
        const summary = await fetchSoccerSummary(id);
        if (summary) {
          setMatch(summary.match);
          if (summary.lineups) {
            setLineups(summary.lineups);
            setLineupLoaded(true);
          }
        } else {
          setMatch(null);
        }
      } else {
        setMatch(null);
      }
      setMatchLoading(false);
    }).catch(() => {
      setMatch(null);
      setMatchLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const checkFav = async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        setIsFav(ids.includes(id));
      } catch (_) {}
    };
    checkFav();
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let ids: string[] = raw ? JSON.parse(raw) : [];
      if (isFav) {
        ids = ids.filter((i) => i !== id);
        Alert.alert('즐겨찾기 해제', '즐겨찾기에서 제거되었습니다.');
      } else {
        ids.push(id);
        Alert.alert('즐겨찾기 추가', '즐겨찾기에 추가되었습니다!');
      }
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
      setIsFav(!isFav);
    } catch (_) {}
  }, [isFav, id]);

  if (matchLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>경기 정보를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'summary', label: '요약' },
    { key: 'events', label: getSportLabel(match.sport) },
    { key: 'stats', label: '스탯' },
    ...(match.sport === 'soccer' ? [{ key: 'lineup' as DetailTab, label: '라인업' }] : []),
  ];

  const handleTabPress = (tabKey: DetailTab) => {
    setActiveTab(tabKey);
    if (tabKey === 'lineup' && !lineupLoaded && match.sport === 'soccer') {
      setLineupLoaded(true);
      fetchSoccerLineup(match.id).then(result => {
        setLineups(result);
      });
    }
  };

  const renderEvents = () => {
    if (match.sport === 'soccer') return <SoccerTimeline match={match as SoccerMatch} />;
    if (match.sport === 'baseball') return <BaseballInnings match={match as BaseballMatch} />;
    return <BasketballQuarters match={match as BasketballMatch} />;
  };

  const renderStats = () => {
    if (match.sport === 'soccer') return <SoccerStats match={match as SoccerMatch} />;
    if (match.sport === 'baseball') return <BaseballStats match={match as BaseballMatch} />;
    return <BasketballStats match={match as BasketballMatch} />;
  };

  const renderSummary = () => (
    <View style={styles.summaryContent}>
      {renderEvents()}
      {renderStats()}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Score Header */}
      <ScoreHeader match={match} isFav={isFav} onToggleFav={toggleFavorite} />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'lineup' && (
          lineups
            ? <LineupView lineups={lineups} />
            : (
              <View style={styles.loading}>
                {lineupLoaded
                  ? <Text style={styles.loadingText}>라인업 준비 중입니다</Text>
                  : <ActivityIndicator size="large" color={Colors.primary} />
                }
              </View>
            )
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  summaryContent: { gap: 0 },
});

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.scoreHeaderBg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  league: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  favBtn: { padding: 4 },
  favIcon: { fontSize: 22 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: { flex: 1, alignItems: 'flex-start', gap: 6 },
  awayCol: { alignItems: 'flex-end' },
  teamLogo: { fontSize: 32 },
  teamName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 110,
  },
  scoreCol: { alignItems: 'center', paddingHorizontal: 8 },
  score: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreVs: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 24,
    fontWeight: '700',
  },
  kickoffTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  venue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

const eventStyles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 4,
  },
  rowHome: {},
  rowAway: {},
  homeContent: { flex: 1, alignItems: 'flex-end', paddingRight: 4 },
  awayContent: { flex: 1, paddingLeft: 4 },
  homePlaceholder: { flex: 1 },
  awayPlaceholder: { flex: 1 },
  minuteCol: { width: 36, alignItems: 'center' },
  minute: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  eventIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  playerName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  detail: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});

const inningStyles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  teamCell: {
    width: 56,
    paddingVertical: 10,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  cell: {
    width: 36,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCell: {
    width: 42,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  headerText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  teamText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  cellText: { fontSize: 13, color: Colors.textPrimary },
  totalText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
});

const quarterStyles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  teamCell: {
    width: 64,
    paddingVertical: 12,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  totalCell: {
    width: 56,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  headerText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  teamText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cellText: { fontSize: 14, color: Colors.textPrimary },
  totalText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
});

const statStyles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  teamHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  homeTeam: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  awayTeam: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  homeVal: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  awayVal: { width: 44, textAlign: 'left', fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  barContainer: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: Colors.border,
  },
  barFill: { backgroundColor: Colors.primary, borderRadius: 3 },
  barFillAway: { backgroundColor: Colors.secondary, borderRadius: 3 },
});
