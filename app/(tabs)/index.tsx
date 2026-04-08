import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
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
import { getMatchesBySport, soccerMatches, baseballMatches, basketballMatches } from '../../data/mock/matches';
import { fetchMatchesBySport } from '../../data/api/espn';
import { setMatches as cacheMatches } from '../../data/matchCache';
import Colors from '../../constants/colors';

const SPORT_STORAGE_KEY = '@allscore_last_sport';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLiveCounts(): Partial<Record<SportType, number>> {
  const counts: Partial<Record<SportType, number>> = {};
  for (const m of soccerMatches) if (m.status === 'LIVE') counts.soccer = (counts.soccer ?? 0) + 1;
  for (const m of baseballMatches) if (m.status === 'LIVE') counts.baseball = (counts.baseball ?? 0) + 1;
  for (const m of basketballMatches) if (m.status === 'LIVE') counts.basketball = (counts.basketball ?? 0) + 1;
  return counts;
}

export default function HomeScreen() {
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const liveCounts = getLiveCounts();

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
      // 오늘은 date 파라미터 없이 호출 (ESPN 기본 엔드포인트가 더 정확)
      const todayStr = getTodayStr();
      const apiMatches = await fetchMatchesBySport(sport, date === todayStr ? undefined : date);
      const sorted = [...apiMatches].sort((a, b) => {
        const order = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
        return order[a.status] - order[b.status];
      });
      cacheMatches(sorted);
      setMatches(sorted);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMatches(selectedSport, selectedDate);
  }, [selectedSport, selectedDate, loadMatches]);

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

  return (
    <View style={styles.container}>
      <SportTabBar
        selected={selectedSport}
        onSelect={handleSelectSport}
        liveCounts={liveCounts}
      />
      <DateTabBar selectedDate={selectedDate} onSelect={setSelectedDate} />

      {loading && (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
      )}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🏟️"
            title="경기가 없습니다"
            subtitle={`선택한 날짜에 ${
              selectedSport === 'soccer'
                ? '축구'
                : selectedSport === 'baseball'
                ? '야구'
                : '농구'
            } 경기가 없습니다.`}
          />
        }
        ListHeaderComponent={
          matches.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {matches.length}경기
              </Text>
            </View>
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
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
