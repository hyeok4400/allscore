import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MatchCard from '../../components/MatchCard';
import EmptyState from '../../components/EmptyState';
import { Match } from '../../data/mock/types';
import { getMatchById } from '../../data/mock/matches';
import Colors from '../../constants/colors';

export const FAVORITES_STORAGE_KEY = '@allscore_favorites';

export default function FavoritesScreen() {
  const [favoriteMatches, setFavoriteMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) {
        setFavoriteMatches([]);
        return;
      }
      const ids: string[] = JSON.parse(raw);
      const matches = ids
        .map((id) => getMatchById(id))
        .filter((m): m is Match => m !== undefined);
      setFavoriteMatches(matches);
    } catch (_) {
      setFavoriteMatches([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  const liveCount = favoriteMatches.filter((m) => m.status === 'LIVE').length;

  return (
    <View style={styles.container}>
      {favoriteMatches.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            즐겨찾기 {favoriteMatches.length}경기
          </Text>
          {liveCount > 0 && (
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>LIVE {liveCount}</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={favoriteMatches}
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
            icon="⭐"
            title="즐겨찾기가 없습니다"
            subtitle="경기 상세 화면에서 별 아이콘을 눌러 즐겨찾기에 추가하세요."
          />
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
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  livePill: {
    backgroundColor: Colors.live,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
});
