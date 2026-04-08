import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../constants/colors';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface DateTabBarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  range?: number; // days before/after today, default 3
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDates(range: number): { dateStr: string; date: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = -range; i <= range; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ dateStr: formatDateStr(d), date: d });
  }
  return dates;
}

export default function DateTabBar({
  selectedDate,
  onSelect,
  range = 3,
}: DateTabBarProps) {
  const dates = buildDates(range);
  const todayStr = formatDateStr(new Date());
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to selected date
  useEffect(() => {
    const idx = dates.findIndex((d) => d.dateStr === selectedDate);
    if (idx >= 0 && scrollRef.current) {
      // Approximate scroll position
      scrollRef.current.scrollTo({ x: idx * 64 - 64, animated: true });
    }
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map(({ dateStr, date }) => {
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayName = DAY_LABELS[date.getDay()];
          const dayNum = date.getDate();

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onSelect(dateStr)}
              style={[styles.dateTab, isSelected && styles.dateTabSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {isToday ? '오늘' : dayName}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {dayNum}
              </Text>
              {isToday && !isSelected && <View style={styles.todayDot} />}
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
    paddingVertical: 8,
  },
  dateTab: {
    width: 56,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  dateTabSelected: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});
