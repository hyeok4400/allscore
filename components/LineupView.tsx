import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TeamLineup, LineupPlayer } from '../data/api/espn';

interface Props {
  lineups: TeamLineup[];
}

function parseFormationRows(formation: string): number[] {
  // "4-2-3-1" → [4, 2, 3, 1], GK는 별도
  return formation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
}

function groupPlayersByRow(starters: LineupPlayer[], formation: string): LineupPlayer[][] {
  const rows = parseFormationRows(formation);
  const gk = starters.filter(p => p.formationPlace === 1);
  const outfield = starters
    .filter(p => p.formationPlace !== 1)
    .sort((a, b) => a.formationPlace - b.formationPlace);

  const groups: LineupPlayer[][] = [gk];
  let idx = 0;
  for (const count of rows) {
    groups.push(outfield.slice(idx, idx + count));
    idx += count;
  }
  return groups.filter(g => g.length > 0);
}

function PlayerDot({ player }: { player: LineupPlayer }) {
  return (
    <View style={dotStyles.container}>
      <View style={[dotStyles.circle, player.subbedIn && dotStyles.subbedIn]}>
        <Text style={dotStyles.jersey}>{player.jersey}</Text>
      </View>
      <Text style={dotStyles.name} numberOfLines={1}>
        {player.name.split(' ').pop()}
      </Text>
    </View>
  );
}

function FormationRows({ lineup, inverted }: { lineup: TeamLineup; inverted: boolean }) {
  const rows = groupPlayersByRow(lineup.starters, lineup.formation);
  const displayRows = inverted ? [...rows].reverse() : rows;

  return (
    <View style={[pitchStyles.half, inverted && pitchStyles.halfTop]}>
      {/* Formation label */}
      <Text style={[pitchStyles.formationLabel, inverted && pitchStyles.formationLabelTop]}>
        {lineup.formation}
      </Text>
      {displayRows.map((row, i) => (
        <View key={i} style={pitchStyles.row}>
          {row.map((player, j) => (
            <PlayerDot key={j} player={player} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function LineupView({ lineups }: Props) {
  const home = lineups.find(l => l.homeAway === 'home');
  const away = lineups.find(l => l.homeAway === 'away');

  return (
    <ScrollView style={lineupStyles.scroll} showsVerticalScrollIndicator={false}>
      {/* Pitch */}
      <View style={pitchStyles.pitch}>
        {/* Away (top, inverted) */}
        {away && <FormationRows lineup={away} inverted={true} />}
        {/* Center line */}
        <View style={pitchStyles.centerLine} />
        {/* Home (bottom) */}
        {home && <FormationRows lineup={home} inverted={false} />}
      </View>

      {/* Bench */}
      {[home, away].filter(Boolean).map((lineup, ti) => (
        <View key={ti} style={benchStyles.section}>
          <Text style={benchStyles.title}>{lineup!.teamName} 교체 선수</Text>
          <View style={benchStyles.list}>
            {lineup!.bench.map((p, i) => (
              <View key={i} style={benchStyles.row}>
                <View style={benchStyles.jerseyBox}>
                  <Text style={benchStyles.jersey}>{p.jersey}</Text>
                </View>
                <Text style={benchStyles.pos}>{p.position}</Text>
                <Text style={benchStyles.name}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const PITCH_COLOR = '#2d8a4e';
const PITCH_LINE = 'rgba(255,255,255,0.4)';

const lineupStyles = StyleSheet.create({
  scroll: { flex: 1 },
});

const pitchStyles = StyleSheet.create({
  pitch: {
    backgroundColor: PITCH_COLOR,
    marginHorizontal: 0,
    paddingVertical: 8,
  },
  half: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 220,
    justifyContent: 'space-around',
  },
  halfTop: {
    borderBottomWidth: 0,
  },
  centerLine: {
    height: 1,
    backgroundColor: PITCH_LINE,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 6,
  },
  formationLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  formationLabelTop: {
    marginBottom: 0,
    marginTop: 2,
  },
});

const dotStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 52,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  subbedIn: {
    borderColor: '#00c853',
    borderWidth: 2,
  },
  jersey: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  name: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 50,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

const benchStyles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jerseyBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jersey: { fontSize: 11, fontWeight: '700', color: '#333' },
  pos: { fontSize: 11, color: '#888', width: 36 },
  name: { fontSize: 13, fontWeight: '600', color: '#222', flex: 1 },
});
