import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Match, SoccerMatch, BaseballMatch, BasketballMatch } from '../data/mock/types';
import LiveBadge from './LiveBadge';
import Colors from '../constants/colors';

function TeamLogo({ logo }: { logo: string }) {
  const isUrl = logo.startsWith('http');
  if (isUrl) {
    return <Image source={{ uri: logo }} style={styles.teamLogoImg} resizeMode="contain" />;
  }
  return <Text style={styles.teamLogo}>{logo}</Text>;
}

interface MatchCardProps {
  match: Match;
}

function getStatusDetail(match: Match): string | undefined {
  if (match.status === 'UPCOMING') {
    const d = new Date(match.startTime);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
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

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const statusDetail = getStatusDetail(match);

  const handlePress = () => {
    router.push(`/match/${match.id}` as any);
  };

  const isLive = match.status === 'LIVE';

  return (
    <TouchableOpacity
      style={[styles.card, isLive && styles.cardLive]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View style={styles.statusRow}>
        <LiveBadge status={match.status} detail={statusDetail} />
        <Text style={styles.leagueName}>{match.leagueName}</Text>
      </View>

      {/* Teams & Score */}
      <View style={styles.matchRow}>
        {/* Home Team */}
        <View style={styles.teamSection}>
          <TeamLogo logo={match.homeTeam.logo} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>

        {/* Score */}
        <View style={styles.scoreSection}>
          {match.status === 'UPCOMING' ? (
            <Text style={styles.scoreVs}>vs</Text>
          ) : (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {match.score.home} - {match.score.away}
            </Text>
          )}
        </View>

        {/* Away Team */}
        <View style={[styles.teamSection, styles.awayTeam]}>
          <TeamLogo logo={match.awayTeam.logo} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Live indicator bar */}
      {isLive && <View style={styles.liveBar} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardLive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.live,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  awayTeam: {
    alignItems: 'flex-end',
  },
  teamLogo: {
    fontSize: 24,
  },
  teamLogoImg: {
    width: 36,
    height: 36,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 120,
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  scoreLive: {
    color: Colors.live,
  },
  scoreVs: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  liveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.live,
    opacity: 0.3,
  },
});
