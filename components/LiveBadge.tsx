import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MatchStatus } from '../data/mock/types';
import Colors from '../constants/colors';

interface LiveBadgeProps {
  status: MatchStatus;
  detail?: string; // e.g. "67'" for soccer, "7회말" for baseball, "Q4 3:24" for basketball
}

export default function LiveBadge({ status, detail }: LiveBadgeProps) {
  const badgeStyle =
    status === 'LIVE'
      ? styles.liveBadge
      : status === 'UPCOMING'
      ? styles.upcomingBadge
      : styles.finishedBadge;

  const textStyle =
    status === 'LIVE'
      ? styles.liveText
      : status === 'UPCOMING'
      ? styles.upcomingText
      : styles.finishedText;

  const label =
    status === 'LIVE'
      ? detail ?? 'LIVE'
      : status === 'UPCOMING'
      ? detail ?? '예정'
      : '종료';

  return (
    <View style={[styles.badge, badgeStyle]}>
      {status === 'LIVE' && <View style={styles.dot} />}
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  liveBadge: {
    backgroundColor: Colors.badgeLiveBackground,
  },
  upcomingBadge: {
    backgroundColor: Colors.badgeUpcomingBackground,
  },
  finishedBadge: {
    backgroundColor: Colors.badgeFinishedBackground,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveText: {
    color: Colors.badgeLiveText,
  },
  upcomingText: {
    color: Colors.badgeUpcomingText,
  },
  finishedText: {
    color: Colors.badgeFinishedText,
  },
});
