/**
 * TOPIK道場 - React Native App
 * トップ画面（級選択）
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  useColorScheme,
  Alert,
  SafeAreaView,
} from 'react-native';

interface TopScreenProps {}

const TopScreen: React.FC<TopScreenProps> = () => {
  const [reviewCount, setReviewCount] = useState<number>(0);
  const isDarkMode = useColorScheme() === 'dark';

  // 復習対象数を取得（現在はモックデータ）
  useEffect(() => {
    const loadReviewCount = async () => {
      try {
        // TODO: 実際のDBから復習対象数を取得
        // 現在はモックデータを使用
        const mockReviewCount = 15;
        setReviewCount(mockReviewCount);
        
        // TODO: アプリアイコンバッジの更新
        // setBadgeCount(mockReviewCount);
      } catch (error) {
        console.error('復習対象数の取得に失敗:', error);
        // エラーの場合は0件として扱う
        setReviewCount(0);
      }
    };

    loadReviewCount();
  }, []);

  // 復習ボタンのタップハンドラ
  const handleReviewPress = () => {
    if (reviewCount === 0) {
      return; // 復習対象が0件の場合は何もしない
    }
    
    // TODO: 復習画面への遷移
    Alert.alert('復習画面', `${reviewCount}語の復習を開始します`);
  };

  // 級選択ボタンのタップハンドラ
  const handleLevelPress = (level: number) => {
    // TODO: 学習モード選択画面への遷移
    Alert.alert('級選択', `${level}級の学習モードを選択してください`);
  };

  const levels = [1, 2, 3, 4, 5, 6];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />
      
      {/* アプリタイトル */}
      <View style={styles.header}>
        <Text style={styles.title}>TOPIK道場</Text>
      </View>

      {/* 復習ボタン */}
      <View style={styles.reviewSection}>
        <TouchableOpacity
          style={[
            styles.reviewButton,
            reviewCount === 0 && styles.reviewButtonDisabled
          ]}
          onPress={handleReviewPress}
          disabled={reviewCount === 0}
        >
          <Text style={[
            styles.reviewButtonText,
            reviewCount === 0 && styles.reviewButtonTextDisabled
          ]}>
            復習 ({reviewCount}語)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 級選択ボタン */}
      <View style={styles.levelSection}>
        <View style={styles.levelGrid}>
          {/* 上段: 1級, 2級, 3級 */}
          <View style={styles.levelRow}>
            {levels.slice(0, 3).map((level) => (
              <TouchableOpacity
                key={level}
                style={styles.levelButton}
                onPress={() => handleLevelPress(level)}
              >
                <Text style={styles.levelButtonText}>{level}級</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 下段: 4級, 5級, 6級 */}
          <View style={styles.levelRow}>
            {levels.slice(3, 6).map((level) => (
              <TouchableOpacity
                key={level}
                style={styles.levelButton}
                onPress={() => handleLevelPress(level)}
              >
                <Text style={styles.levelButtonText}>{level}級</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    letterSpacing: 2,
  },
  reviewSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  reviewButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  reviewButtonDisabled: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  reviewButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  reviewButtonTextDisabled: {
    color: '#999999',
  },
  levelSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  levelGrid: {
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 15,
  },
  levelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    paddingVertical: 20,
    marginHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
});

export default TopScreen;
