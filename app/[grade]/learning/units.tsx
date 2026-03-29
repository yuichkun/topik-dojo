import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import database from '../../../src/database/client';
import { getUnitsByGrade } from '../../../src/database/queries/unitQueries';
import { getWordCountByGrade } from '../../../src/database/queries/wordQueries';
import {
  getWordsLearnedByGrade,
  getCurrentUnit,
  getAllUnitProgressByGrade,
  getStreakDays,
} from '../../../src/database/queries/unitProgressQueries';
import { SectionLabel, BackButton, BottomSheet, ActionListItem } from '../../../src/components/ui';
import type { Unit } from '../../../src/database/schema';

// ─── Types ───

type UnitWithProgress = {
  id: string;
  unitNumber: number;
  range: string;
  state: 'completed' | 'current' | 'not_started';
  lastWordIndex: number | null;
};

type ScreenData = {
  totalWords: number;
  wordsLearned: number;
  streak: number;
  currentUnitId: string | null;
  nextRange: string;
  units: UnitWithProgress[];
};

// ─── Data Hook ───

function useScreenData(gradeNumber: number) {
  const [data, setData] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allUnits, totalWords, wordsLearned, current, progressList, streak] = await Promise.all([
          getUnitsByGrade(database, gradeNumber),
          getWordCountByGrade(database, gradeNumber),
          getWordsLearnedByGrade(database, gradeNumber),
          getCurrentUnit(database, gradeNumber),
          getAllUnitProgressByGrade(database, gradeNumber),
          getStreakDays(database),
        ]);

        if (cancelled) return;

        const progressMap = new Map(progressList.map(p => [p.unitId, p]));
        const currentUnitId = current?.unit.id ?? null;

        const unitsWithProgress: UnitWithProgress[] = allUnits.map((u: Unit) => {
          const progress = progressMap.get(u.id);
          let state: 'completed' | 'current' | 'not_started' = 'not_started';
          if (progress?.completedAt) {
            state = 'completed';
          } else if (u.id === currentUnitId) {
            state = 'current';
          }
          return {
            id: u.id,
            unitNumber: u.unitNumber,
            range: `${(u.unitNumber - 1) * 10 + 1}-${u.unitNumber * 10}`,
            state,
            lastWordIndex: progress?.lastWordIndex ?? null,
          };
        });

        const nextUnit = current?.unit;
        const nextRange = nextUnit
          ? `${(nextUnit.unitNumber - 1) * 10 + 1}-${nextUnit.unitNumber * 10}`
          : '1-10';

        setData({ totalWords, wordsLearned, streak, currentUnitId, nextRange, units: unitsWithProgress });
      } catch (e) {
        console.error('Failed to load unit data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gradeNumber]));

  return { data, loading };
}

// ─── Unit Action Sheet ───

function UnitActionSheet({
  unit,
  onClose,
  onAction,
}: {
  unit: UnitWithProgress | null;
  onClose: () => void;
  onAction: (unitId: string, action: 'learn' | 'listening' | 'reading') => void;
}) {
  const progressLabel = (u: UnitWithProgress) => {
    if (u.state === 'completed') return '完了';
    if (u.lastWordIndex !== null) return `${u.lastWordIndex + 1}/10語 学習済み`;
    return '未着手';
  };

  return (
    <BottomSheet visible={!!unit} onClose={onClose}>
      {unit && (
        <>
          <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 24, color: '#191c1d' }}>
            単語 {unit.range}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: '#434653', marginTop: 4, marginBottom: 20 }}>
            {progressLabel(unit)}
          </Text>
          <ActionListItem icon="book-outline" title="学習する" subtitle="カード形式で語彙を覚える" onPress={() => onAction(unit.id, 'learn')} />
          <ActionListItem icon="headset-outline" title="聴解テスト" subtitle="音声を聞いて4択で回答" onPress={() => onAction(unit.id, 'listening')} />
          <ActionListItem icon="document-text-outline" title="読解テスト" subtitle="ハングルを見て4択で回答" onPress={() => onAction(unit.id, 'reading')} />
        </>
      )}
    </BottomSheet>
  );
}

// ─── Main Screen ───

export default function UnitSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeNumber = Number(grade) || 1;
  const gradeDisplay = String(gradeNumber);
  const { data, loading } = useScreenData(gradeNumber);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithProgress | null>(null);

  if (loading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#002897" />
      </SafeAreaView>
    );
  }

  const pct = data.totalWords > 0 ? Math.round((data.wordsLearned / data.totalWords) * 100) : 0;

  const onStart = () => {
    const targetId = data.currentUnitId ?? data.units[0]?.id;
    if (targetId) router.push(`/${gradeDisplay}/learning/${targetId}`);
  };

  const onAction = (unitId: string, action: 'learn' | 'listening' | 'reading') => {
    setSelectedUnit(null);
    switch (action) {
      case 'learn': router.push(`/${gradeDisplay}/learning/${unitId}`); break;
      case 'listening': router.push(`/${gradeDisplay}/test/listening/${unitId}`); break;
      case 'reading': router.push(`/${gradeDisplay}/test/reading/${unitId}`); break;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ fontFamily: 'Epilogue_600SemiBold', fontSize: 14, color: '#191c1d' }}>
          {gradeDisplay}級
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 80 }}>
        {/* Progress + streak */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 48, color: '#002897', lineHeight: 52 }}>
              {pct}%
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: '#434653', marginTop: 2 }}>
              {data.wordsLearned.toLocaleString()} / {data.totalWords.toLocaleString()}語
            </Text>
            <View style={{ width: '80%', height: 3, backgroundColor: '#e1e3e5', borderRadius: 1.5, marginTop: 10 }}>
              <View style={{ height: 3, backgroundColor: '#002897', borderRadius: 1.5, width: `${Math.min(pct, 100)}%` }} />
            </View>
          </View>
          {data.streak > 0 && (
            <View style={{ alignItems: 'center', marginLeft: 16 }}>
              <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 24, color: '#191c1d' }}>{data.streak}</Text>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 10, color: '#434653' }}>日連続</Text>
            </View>
          )}
        </View>

        {/* Continue CTA */}
        <TouchableOpacity
          onPress={onStart}
          style={{ backgroundColor: '#002897', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 20 }}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <SectionLabel style={{ color: 'rgba(255,255,255,0.45)' }}>次のセッション</SectionLabel>
              <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 20, color: '#fff', marginTop: 4 }}>
                単語 {data.nextRange}
              </Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#002897' }}>開始</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Unit grid */}
        <SectionLabel style={{ marginTop: 28, marginBottom: 14 }}>すべてのユニット</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {data.units.map(u => (
            <TouchableOpacity
              key={u.id}
              onPress={() => setSelectedUnit(u)}
              style={{
                width: '31%',
                backgroundColor: u.state === 'current' ? '#002897' : u.state === 'completed' ? '#fff' : '#edeeef',
                borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              }}
              activeOpacity={0.85}
            >
              <Text style={{
                fontFamily: 'Epilogue_700Bold', fontSize: 14,
                color: u.state === 'current' ? '#fff' : u.state === 'completed' ? '#002897' : '#c3c6d5',
              }}>
                {u.range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <UnitActionSheet unit={selectedUnit} onClose={() => setSelectedUnit(null)} onAction={onAction} />
    </SafeAreaView>
  );
}
