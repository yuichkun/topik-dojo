import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReviewCount } from '../src/hooks/useReviewCount';

const GRADES = [1, 2, 3, 4, 5, 6] as const;


export default function TopScreen() {
  const router = useRouter();
  const { count: reviewCount } = useReviewCount();
  const hasReviews = reviewCount > 0;
  const headerBg = hasReviews ? '#4c1d95' : '#002897';

  const handleReviewPress = () => {
    if (reviewCount === 0) return;
    router.push('/review');
  };

  const handleGradePress = (grade: number) => {
    router.push(`/${grade}/learning`);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      <View
        style={{ backgroundColor: headerBg, paddingHorizontal: 32, paddingTop: 48, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
      >
        <View>
          <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 48, color: '#fff', letterSpacing: -2, lineHeight: 48 }}>
            TOPIK
          </Text>
          <Text style={{ fontFamily: 'Epilogue_600SemiBold', fontSize: 24, color: 'rgba(255,255,255,0.55)', letterSpacing: -0.5, marginTop: 4 }}>
            道場
          </Text>
        </View>

        <View style={{ marginTop: 32, alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            今日の復習
          </Text>
          <View className="flex-row items-end mt-1">
            <Text
              style={{
                fontFamily: 'Epilogue_700Bold',
                fontSize: 56,
                color: '#ffffff',
                lineHeight: 60,
              }}
            >
              {reviewCount}
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 16,
                color: 'rgba(255,255,255,0.5)',
                marginLeft: 8,
                marginBottom: 10,
              }}
            >
              語
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: hasReviews ? '#ffffff' : 'rgba(255,255,255,0.15)',
            borderRadius: 4,
            paddingVertical: 14,
          }}
          onPress={handleReviewPress}
          disabled={!hasReviews}
        >
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 14,
              color: hasReviews ? headerBg : 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            {hasReviews ? '復習を始める' : '復習なし'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 mt-6 justify-center">
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 11,
            color: '#434653',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          レベルを選択
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {GRADES.map(grade => (
            <TouchableOpacity
              key={grade}
              className="w-[30%] bg-white rounded-xl py-7 items-center"
              onPress={() => handleGradePress(grade)}
            >
              <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 30, color: '#191c1d' }}>
                {grade}
              </Text>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: '#434653', letterSpacing: 1, marginTop: 2 }}>
                級
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </SafeAreaView>
  );
}
