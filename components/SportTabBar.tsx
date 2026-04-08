import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SportType } from '../data/mock/types';
import Colors from '../constants/colors';

const SPORTS: { type: SportType; label: string; icon: string }[] = [
  { type: 'soccer', label: '축구', icon: '⚽' },
  { type: 'baseball', label: '야구', icon: '⚾' },
  { type: 'basketball', label: '농구', icon: '🏀' },
];

interface SportTabBarProps {
  selected: SportType;
  onSelect: (sport: SportType) => void;
  liveCounts?: Partial<Record<SportType, number>>;
}

export default function SportTabBar({ selected, onSelect, liveCounts = {} }: SportTabBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SPORTS.map((sport) => {
          const isActive = selected === sport.type;
          const liveCount = liveCounts[sport.type] ?? 0;

          return (
            <TouchableOpacity
              key={sport.type}
              onPress={() => onSelect(sport.type)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{sport.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {sport.label}
              </Text>
              {liveCount > 0 && (
                <View style={styles.liveDot}>
                  <Text style={styles.liveDotText}>{liveCount}</Text>
                </View>
              )}
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 6,
    position: 'relative',
  },
  tabActive: {
    // indicator handles active styling
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.sportTabInactive,
  },
  labelActive: {
    color: Colors.sportTabActive,
  },
  liveDot: {
    backgroundColor: Colors.live,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  liveDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 18,
    right: 18,
    height: 3,
    backgroundColor: Colors.sportTabIndicator,
    borderRadius: 2,
  },
});
