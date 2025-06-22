/**
 * ナビゲーション型定義
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ルートスタックのパラメータ定義
export type RootStackParamList = {
  Top: undefined;
  LearningModeSelection: {
    level: number;
  };
  UnitSelection: { 
    level: number; 
  };
  Learning: { 
    level: number; 
    unitNumber: number; 
  };
  TestModeSelection: { 
    level: number; 
  };
  TestUnitSelection: { 
    level: number;
    testMode: 'reading' | 'listening';
  };
  ReadingTest: { 
    level: number; 
    unitNumber: number; 
  };
  ListeningTest: { 
    level: number; 
    unitNumber: number; 
  };
  Review: undefined;
  Results: { 
    level: number; 
  };
};

// 各画面のプロップス型定義
export type TopScreenProps = NativeStackScreenProps<RootStackParamList, 'Top'>;
export type LearningModeSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'LearningModeSelection'>;
export type UnitSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'UnitSelection'>;
export type LearningScreenProps = NativeStackScreenProps<RootStackParamList, 'Learning'>;
export type TestModeSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'TestModeSelection'>;
export type TestUnitSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'TestUnitSelection'>;
export type ReadingTestScreenProps = NativeStackScreenProps<RootStackParamList, 'ReadingTest'>;
export type ListeningTestScreenProps = NativeStackScreenProps<RootStackParamList, 'ListeningTest'>;
export type ReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Review'>;
export type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'Results'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}