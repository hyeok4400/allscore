import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Match, SoccerMatch, BaseballMatch, BasketballMatch } from '../data/mock/types';
import Colors from '../constants/colors';

function TeamLogo({ logo }: { logo: string }) {
  const isUrl = logo.startsWith('http');
  if (isUrl) {
    return <Image source={{ uri: logo }} style={styles.teamLogoImg} resizeMode="contain" />;
  }
  return <Text style={styles.teamLogoEmoji}>{logo}</Text>;
}

interface MatchCardProps {
  match: Match;
}

function getCenterContent(match: Match): { top: string; bottom?: string; isLive: boolean; isFinished: boolean } {
  if (match.status === 'UPCOMING') {
    const d = new Date(match.startTime);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return { top: `${h}:${m}`, isLive: false, isFinished: false };
  }
  if (match.status === 'LIVE') {
    let bottom = 'LIVE';
    if (match.sport === 'soccer') bottom = (match as SoccerMatch).minute ? `${(match as SoccerMatch).minute}'` : 'LIVE';
    else if (match.sport === 'baseball') {
      const bm = match as BaseballMatch;
      bottom = bm.currentInning ? `${bm.currentInning}회` : 'LIVE';
    } else if (match.sport === 'basketball') {
      const bk = match as BasketballMatch;
      bottom = bk.currentQuarter ? `Q${bk.currentQuarter}` : 'LIVE';
    }
    return { top: `${match.score.home} - ${match.score.away}`, bottom, isLive: true, isFinished: false };
  }
  // FINISHED
  return { top: `${match.score.home} - ${match.score.away}`, bottom: '종료', isLive: false, isFinished: true };
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const center = getCenterContent(match);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/match/${match.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Home team */}
      <View style={styles.teamLeft}>
        <TeamLogo logo={match.homeTeam.logo} />
        <Text style={styles.teamName} numberOfLines={1}>{match.homeTeam.name}</Text>
      </View>

      {/* Center: time or score */}
      <View style={styles.center}>
        <Text style={[
          styles.centerTop,
          center.isLive && styles.centerLive,
          center.isFinished && styles.centerFinished,
        ]}>
          {center.top}
        </Text>
        {center.bottom && (
          <Text style={[styles.centerBottom, center.isLive && styles.centerBottomLive]}>
            {center.bottom}
          </Text>
        )}
      </View>

      {/* Away team */}
      <View style={styles.teamRight}>
        <Text style={styles.teamName} numberOfLines={1}>{match.awayTeam.name}</Text>
        <TeamLogo logo={match.awayTeam.logo} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  teamLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  teamLogoImg: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
  teamLogoEmoji: {
    fontSize: 22,
    flexShrink: 0,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  center: {
    width: 72,
    alignItems: 'center',
    gap: 2,
  },
  centerTop: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  centerLive: {
    color: Colors.live,
  },
  centerFinished: {
    color: Colors.textPrimary,
  },
  centerBottom: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  centerBottomLive: {
    color: Colors.live,
    fontWeight: '600',
  },
});
