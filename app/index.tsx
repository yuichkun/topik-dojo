import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReviewCount } from '../src/hooks/useReviewCount';

const GRADES = [1, 2, 3, 4, 5, 6] as const;

export default function TopScreen() {
  const router = useRouter();
  const isDarkMode = useColorScheme() === 'dark';

  const { count: reviewCount } = useReviewCount();

  const handleReviewPress = () => {
    if (reviewCount === 0) {
      return;
    }
    router.push('/review');
  };

  const handleGradePress = (grade: number) => {
    router.push(`/${grade}/learning`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      <View className="items-center pt-16 pb-10">
        <Text className="text-3xl font-bold text-gray-800 tracking-wider">
          TOPIK道場
        </Text>
      </View>

      <View className="items-center py-8">
        <TouchableOpacity
          className={`border-2 rounded-lg px-10 py-4 bg-white ${
            reviewCount === 0 ? 'border-gray-300 bg-gray-50' : 'border-blue-500'
          }`}
          onPress={handleReviewPress}
          disabled={reviewCount === 0}
        >
          <Text
            className={`text-lg font-semibold ${
              reviewCount === 0 ? 'text-gray-400' : 'text-blue-500'
            }`}
          >
            復習 ({reviewCount}語)
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-5">
        <View className="items-center">
          <View className="flex-row justify-between w-full my-4">
            {GRADES.slice(0, 3).map(grade => (
              <TouchableOpacity
                key={grade}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleGradePress(grade)}
              >
                <Text className="text-base font-medium text-gray-800">
                  {grade}級
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between w-full my-4">
            {GRADES.slice(3, 6).map(grade => (
              <TouchableOpacity
                key={grade}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleGradePress(grade)}
              >
                <Text className="text-base font-medium text-gray-800">
                  {grade}級
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
