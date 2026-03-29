import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GRADE_WORD_COUNTS: Record<string, number> = {
  '1': 400, '2': 1400, '3': 2000, '4': 2000, '5': 3000, '6': 3000,
};

export default function LearningModeSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeDisplay = grade ?? '1';
  const wordCount = GRADE_WORD_COUNTS[gradeDisplay] ?? 400;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#002897' }}>
      <StatusBar barStyle="light-content" backgroundColor="#002897" />

      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Cobalt Header */}
        <View
          style={{
            backgroundColor: '#002897',
            paddingHorizontal: 32,
            paddingTop: 16,
            paddingBottom: 36,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                戻る
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{
              fontFamily: 'Manrope_500Medium', fontSize: 11,
              color: 'rgba(255,255,255,0.45)', letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              TOPIK
            </Text>
            <Text style={{
              fontFamily: 'Epilogue_700Bold', fontSize: 48,
              color: '#ffffff', lineHeight: 52, letterSpacing: -1,
            }}>
              {gradeDisplay}級
            </Text>
            <Text style={{
              fontFamily: 'Manrope_400Regular', fontSize: 14,
              color: 'rgba(255,255,255,0.55)', marginTop: 4,
            }}>
              {wordCount.toLocaleString()}語の語彙
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          {/* 学習 Hero Card */}
          <TouchableOpacity
            onPress={() => router.push(`/${gradeDisplay}/learning/units` as Href)}
            style={{
              backgroundColor: '#002897',
              borderRadius: 16,
              paddingHorizontal: 28,
              paddingVertical: 32,
              marginBottom: 16,
            }}
            activeOpacity={0.85}
          >
            <Text style={{
              fontFamily: 'Manrope_500Medium', fontSize: 11,
              color: 'rgba(255,255,255,0.45)', letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              TRAINING
            </Text>
            <Text style={{
              fontFamily: 'Epilogue_700Bold', fontSize: 30,
              color: '#ffffff', marginTop: 8, letterSpacing: -0.5,
            }}>
              学習を始める
            </Text>
            <Text style={{
              fontFamily: 'Manrope_400Regular', fontSize: 14,
              color: 'rgba(255,255,255,0.55)', marginTop: 8,
            }}>
              単語カード形式で語彙を覚える
            </Text>
            <View style={{
              marginTop: 24,
              backgroundColor: '#ffffff',
              borderRadius: 4,
              paddingVertical: 12,
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: 'Manrope_600SemiBold', fontSize: 14,
                color: '#002897', letterSpacing: 0.5,
              }}>
                ユニットを選ぶ
              </Text>
            </View>
          </TouchableOpacity>

          {/* Test + Results pair */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push(`/${gradeDisplay}/test` as Href)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 24,
                alignItems: 'center',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="headset-outline" size={28} color="#002897" style={{ marginBottom: 12 }} />
              <Text style={{
                fontFamily: 'Epilogue_600SemiBold', fontSize: 22,
                color: '#191c1d',
              }}>
                テスト
              </Text>
              <Text style={{
                fontFamily: 'Manrope_400Regular', fontSize: 12,
                color: '#434653', marginTop: 6, textAlign: 'center',
              }}>
                聴解・読解で力試し
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/${gradeDisplay}/results` as Href)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 24,
                alignItems: 'center',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="trending-up" size={28} color="#002897" style={{ marginBottom: 12 }} />
              <Text style={{
                fontFamily: 'Epilogue_600SemiBold', fontSize: 22,
                color: '#191c1d',
              }}>
                成績
              </Text>
              <Text style={{
                fontFamily: 'Manrope_400Regular', fontSize: 12,
                color: '#434653', marginTop: 6, textAlign: 'center',
              }}>
                学習の記録を確認
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
