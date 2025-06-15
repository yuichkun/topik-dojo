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
  // TODO: 他の画面のパラメータ定義を追加
  // TestModeSelection: { level: number };
  // Results: { level: number };
  // ListeningTest: { level: number; unitId: string };
  // ReadingTest: { level: number; unitId: string };
  // Review: undefined;
};

// 各画面のプロップス型定義
export type TopScreenProps = NativeStackScreenProps<RootStackParamList, 'Top'>;
export type LearningModeSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'LearningModeSelection'>;
export type UnitSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'UnitSelection'>;
export type LearningScreenProps = NativeStackScreenProps<RootStackParamList, 'Learning'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}