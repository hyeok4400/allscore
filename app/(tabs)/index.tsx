import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SportTabBar from '../../components/SportTabBar';
import DateTabBar from '../../components/DateTabBar';
import MatchCard from '../../components/MatchCard';
import EmptyState from '../../components/EmptyState';
import { SportType, Match } from '../../data/mock/types';
import { fetchMatchesBySport, LEAGUE_FLAG } from '../../data/api/espn';
import { setMatches as cacheMatches } from '../../data/matchCache';
import Colors from '../../constants/colors';

const SPORT_STORAGE_KEY = '@allscore_last_sport';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// League sort order for soccer
const LEAGUE_ORDER = [
  'Champions League', 'Europa League',
  'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
];
function leagueRank(name: string) {
  const i = LEAGUE_ORDER.indexOf(name);
  return i === -1 ? 99 : i;
}

type Section = { title: string; flag: string; data: Match[] };

function buildSections(matches: Match[]): Section[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.leagueName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => leagueRank(a) - leagueRank(b))
    .map(([name, data]) => ({
      title: name,
      flag: (data[0] as any).leagueFlag ?? LEAGUE_FLAG[name] ?? '🏆',
      data,
    }));
}

function LeagueSectionHeader({ title, flag }: { title: string; flag: string }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.flag}>{flag}</Text>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  flag: { fontSize: 18 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default function HomeScreen() {
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchCounts, setMatchCounts] = useState<Partial<Record<SportType, number>>>({});

  const sections = useMemo(() => {
    if (selectedSport === 'soccer') return buildSections(matches);
    return [{ title: selectedSport === 'baseball' ? 'MLB' : 'NBA', flag: selectedSport === 'baseball' ? '⚾' : '🏀', data: matches }];
  }, [matches, selectedSport]);

  const loadSport = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(SPORT_STORAGE_KEY);
      if (saved && ['soccer', 'baseball', 'basketball'].includes(saved)) {
        setSelectedSport(saved as SportType);
      }
    } catch (_) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSport();
    }, [loadSport])
  );

  const loadMatches = useCallback(async (sport: SportType, date: string) => {
    setLoading(true);
    try {
      const apiMatches = await fetchMatchesBySport(sport, date);
      const sorted = [...apiMatches].sort((a, b) => {
        const order = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
        return order[a.status] - order[b.status];
      });
      cacheMatches(sorted);
      setMatches(sorted);
      setMatchCounts(prev => ({ ...prev, [sport]: sorted.length }));
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOtherCounts = useCallback(async (currentSport: SportType, date: string) => {
    const others = (['soccer', 'baseball', 'basketball'] as SportType[]).filter(s => s !== currentSport);
    const results = await Promise.allSettled(others.map(s => fetchMatchesBySport(s, date)));
    setMatchCounts(prev => {
      const next = { ...prev };
      others.forEach((s, i) => {
        const r = results[i];
        next[s] = r.status === 'fulfilled' ? r.value.length : 0;
      });
      return next;
    });
  }, []);

  React.useEffect(() => {
    loadMatches(selectedSport, selectedDate);
  }, [selectedSport, selectedDate, loadMatches]);

  React.useEffect(() => {
    loadOtherCounts(selectedSport, selectedDate);
  }, [selectedDate, loadOtherCounts]);

  const handleSelectSport = async (sport: SportType) => {
    setSelectedSport(sport);
    try {
      await AsyncStorage.setItem(SPORT_STORAGE_KEY, sport);
    } catch (_) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches(selectedSport, selectedDate);
    setRefreshing(false);
  }, [selectedSport, selectedDate, loadMatches]);

  const sportLabel = selectedSport === 'soccer' ? '축구' : selectedSport === 'baseball' ? '야구' : '농구';

  return (
    <View style={styles.container}>
      <SportTabBar
        selected={selectedSport}
        onSelect={handleSelectSport}
        liveCounts={matchCounts}
      />
      <DateTabBar selectedDate={selectedDate} onSelect={setSelectedDate} />

      {loading && (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        renderSectionHeader={({ section }) => (
          <LeagueSectionHeader title={section.title} flag={section.flag} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🏟️"
              title="경기가 없습니다"
              subtitle={`선택한 날짜에 ${sportLabel} 경기가 없습니다.`}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
});
