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
  getListeningMasteredCount,
  getReadingMasteredCount,
  getUnitMasteryByGrade,
} from '../../../src/database/queries/wordMasteryQueries';
import {
  getNextUnit,
  getUnitStudyStateByGrade,
} from '../../../src/database/queries/unitProgressQueries';
import { SectionLabel, BackButton, BottomSheet, ActionListItem } from '../../../src/components/ui';
import type { Unit } from '../../../src/database/schema';

// ─── Types ───

type StudyState = 'completed' | 'in_progress' | 'not_started';

type UnitData = {
  id: string;
  unitNumber: number;
  range: string;
  studyState: StudyState;
  listeningMastered: number;
  readingMastered: number;
};

type ScreenData = {
  totalWords: number;
  listeningMastered: number;
  readingMastered: number;
  nextUnitId: string | null;
  nextRange: string;
  units: UnitData[];
};

// ─── Data Hook ───

function useScreenData(gradeNumber: number) {
  const [data, setData] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allUnits, totalWords, listeningMastered, readingMastered, masteryByUnit, studyStates, nextUnit] = await Promise.all([
          getUnitsByGrade(database, gradeNumber),
          getWordCountByGrade(database, gradeNumber),
          getListeningMasteredCount(database, gradeNumber),
          getReadingMasteredCount(database, gradeNumber),
          getUnitMasteryByGrade(database, gradeNumber),
          getUnitStudyStateByGrade(database, gradeNumber),
          getNextUnit(database, gradeNumber),
        ]);

        if (cancelled) return;

        const masteryMap = new Map(masteryByUnit.map(m => [m.unitId, m]));
        const studyMap = new Map(studyStates.map(s => [s.unitId, s.state]));

        const units: UnitData[] = allUnits.map((u: Unit) => {
          const m = masteryMap.get(u.id);
          return {
            id: u.id,
            unitNumber: u.unitNumber,
            range: `${(u.unitNumber - 1) * 10 + 1}-${u.unitNumber * 10}`,
            studyState: studyMap.get(u.id) ?? 'not_started',
            listeningMastered: m?.listeningMastered ?? 0,
            readingMastered: m?.readingMastered ?? 0,
          };
        });

        const nextUnitId = nextUnit?.id ?? units[0]?.id ?? null;
        const next = units.find(u => u.id === nextUnitId);
        const nextRange = next?.range ?? '1-10';

        setData({
          totalWords: totalWords ?? 0,
          listeningMastered: listeningMastered ?? 0,
          readingMastered: readingMastered ?? 0,
          nextUnitId,
          nextRange,
          units,
        });
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
  unit: UnitData | null;
  onClose: () => void;
  onAction: (unitId: string, action: 'learn' | 'listening' | 'reading') => void;
}) {
  return (
    <BottomSheet visible={!!unit} onClose={onClose}>
      {unit && (
        <>
          <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 24, color: '#191c1d' }}>
            単語 {unit.range}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: '#434653', marginTop: 4, marginBottom: 20 }}>
            リスニング {unit.listeningMastered}/10 ・ リーディング {unit.readingMastered}/10
          </Text>
          <ActionListItem icon="book-outline" title="学習する" subtitle="カード形式で語彙を覚える" onPress={() => onAction(unit.id, 'learn')} />
          <ActionListItem
            icon="headset-outline"
            title="リスニング"
            subtitle={unit.listeningMastered >= 10 ? '習得済み' : `${unit.listeningMastered}/10 習得`}
            onPress={() => onAction(unit.id, 'listening')}
          />
          <ActionListItem
            icon="document-text-outline"
            title="リーディング"
            subtitle={unit.readingMastered >= 10 ? '習得済み' : `${unit.readingMastered}/10 習得`}
            onPress={() => onAction(unit.id, 'reading')}
          />
        </>
      )}
    </BottomSheet>
  );
}

// ─── Progress Bar ───

function ProgressBar({ label, mastered, total }: { label: string; mastered: number; total: number }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: '#191c1d' }}>
          {label}
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#434653' }}>
          {mastered.toLocaleString()} / {total.toLocaleString()}
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: '#e1e3e5', borderRadius: 1.5 }}>
        <View style={{ height: 3, backgroundColor: '#002897', borderRadius: 1.5, width: `${total > 0 ? Math.min(Math.round((mastered / total) * 100), 100) : 0}%` }} />
      </View>
    </View>
  );
}

// ─── Grid Colors ───

function getGridColors(state: StudyState) {
  switch (state) {
    case 'completed': return { bg: '#fff', text: '#002897' };
    case 'in_progress': return { bg: '#002897', text: '#fff' };
    case 'not_started': return { bg: '#edeeef', text: '#c3c6d5' };
  }
}

// ─── Main Screen ───

export default function UnitSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeNumber = Number(grade) || 1;
  const gradeDisplay = String(gradeNumber);
  const { data, loading } = useScreenData(gradeNumber);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);

  if (loading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#002897" />
      </SafeAreaView>
    );
  }

  const onStart = () => {
    if (data.nextUnitId) setSelectedUnit(data.units.find(u => u.id === data.nextUnitId) ?? null);
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
        {/* Two-axis mastery progress */}
        <View style={{ paddingVertical: 20 }}>
          <ProgressBar label="リスニング" mastered={data.listeningMastered} total={data.totalWords} />
          <ProgressBar label="リーディング" mastered={data.readingMastered} total={data.totalWords} />
        </View>

        {/* Continue CTA */}
        <TouchableOpacity
          onPress={onStart}
          style={{ backgroundColor: '#002897', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 20 }}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <SectionLabel style={{ color: 'rgba(255,255,255,0.45)' }}>次のユニット</SectionLabel>
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
          {data.units.map(u => {
            const { bg, text: textColor } = getGridColors(u.studyState);
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => setSelectedUnit(u)}
                style={{
                  width: '31%', backgroundColor: bg,
                  borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 14, color: textColor }}>
                  {u.range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <UnitActionSheet unit={selectedUnit} onClose={() => setSelectedUnit(null)} onAction={onAction} />
    </SafeAreaView>
  );
}
