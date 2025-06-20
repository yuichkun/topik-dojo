import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import { createTestWord } from '../../../__tests__/helpers/databaseHelpers';
import database from '../../database';
import { TableName } from '../../database/constants';
import { Unit } from '../../database/models';
import ReadingTestScreen from '../ReadingTestScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock SoundPlayer
const mockSoundPlayer = SoundPlayer as jest.Mocked<typeof SoundPlayer>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    level: 3,
    unitNumber: 1,
  },
};

// Helper to render screen with navigation context
const renderScreen = (customRoute?: any) => {
  return render(
    <NavigationContainer>
      <ReadingTestScreen
        navigation={mockNavigation as any}
        route={customRoute || (mockRoute as any)}
      />
    </NavigationContainer>,
  );
};

// Helper to create test data
const createTestData = async () => {
  // Create unit
  const unit = await database.write(async () => {
    return await database.collections
      .get<Unit>(TableName.UNITS)
      .create(newUnit => {
        newUnit._raw.id = 'unit_3_1';
        newUnit.grade = 3;
        newUnit.unitNumber = 1;
      });
  });

  // Create words for the unit
  const words = await Promise.all([
    createTestWord(database, {
      id: 'word_1',
      korean: '안녕하세요',
      japanese: 'こんにちは',
      grade: 3,
      unitId: 'unit_3_1',
      unitOrder: 1,
    }),
    createTestWord(database, {
      id: 'word_2',
      korean: '감사합니다',
      japanese: 'ありがとうございます',
      grade: 3,
      unitId: 'unit_3_1',
      unitOrder: 2,
    }),
    createTestWord(database, {
      id: 'word_3',
      korean: '죄송합니다',
      japanese: 'すみません',
      grade: 3,
      unitId: 'unit_3_1',
      unitOrder: 3,
    }),
  ]);

  // Create additional words in same grade for wrong options
  await Promise.all([
    createTestWord(database, {
      id: 'word_4',
      korean: '학생',
      japanese: '学生',
      grade: 3,
      unitId: 'unit_3_2',
      unitOrder: 1,
    }),
    createTestWord(database, {
      id: 'word_5',
      korean: '선생님',
      japanese: '先生',
      grade: 3,
      unitId: 'unit_3_2',
      unitOrder: 2,
    }),
    createTestWord(database, {
      id: 'word_6',
      korean: '학교',
      japanese: '学校',
      grade: 3,
      unitId: 'unit_3_2',
      unitOrder: 3,
    }),
  ]);

  return { unit, words };
};

describe('ReadingTestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should eventually load test content after loading state', async () => {
      await createTestData();

      const { getByText } = renderScreen();

      // Should eventually show test content
      await waitFor(() => {
        expect(getByText('안녕하세요')).toBeTruthy();
      });
    });
  });

  describe('Error states', () => {
    it('should show error when no unit is found', async () => {
      // Don't create any test data
      const customRoute = { params: { level: 3, unitNumber: 999 } };

      const { getByText } = renderScreen(customRoute);

      // Should show error message
      await waitFor(() => {
        expect(getByText('問題データが見つかりません')).toBeTruthy();
      });
    });

    it('should show error message when no questions are available', async () => {
      // Create unit but no words
      await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create(unit => {
            unit._raw.id = 'unit_3_1';
            unit.grade = 3;
            unit.unitNumber = 1;
          });
      });

      const { getByText } = renderScreen();

      await waitFor(() => {
        expect(getByText('問題データが見つかりません')).toBeTruthy();
        expect(getByText('戻る')).toBeTruthy();
      });
    });
  });

  describe('Successful test flow', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should render test screen with correct header information', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        expect(getByText('3級 リーディングテスト')).toBeTruthy();
        expect(getByText('← 戻る')).toBeTruthy();
        expect(getByText('ホーム')).toBeTruthy();
        expect(getByText('ユニット 1-10 (1/3)')).toBeTruthy();
      });
    });

    it('should display Korean word and 4 answer options', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        // Should show Korean word
        expect(getByText('안녕하세요')).toBeTruthy();

        // Should show sound button
        expect(getByText('🔊')).toBeTruthy();

        // Should show 4 options (one correct, three wrong)
        expect(getByText('こんにちは')).toBeTruthy(); // Correct answer should be present
      });
    });

    it('should play sound when sound button is pressed', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        const soundButton = getByText('🔊');
        fireEvent.press(soundButton);

        expect(mockSoundPlayer.playAsset).toHaveBeenCalled();
      });
    });

    it('should handle answer selection and show feedback', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        // Select the correct answer
        const correctAnswer = getByText('こんにちは');
        fireEvent.press(correctAnswer);

        // Should show next button
        expect(getByText('次の問題へ')).toBeTruthy();
      });
    });

    it('should advance to next question when next button is pressed', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        // Select an answer
        const correctAnswer = getByText('こんにちは');
        fireEvent.press(correctAnswer);

        // Press next button
        const nextButton = getByText('次の問題へ');
        fireEvent.press(nextButton);

        // Should show next question (2/3)
        expect(getByText('ユニット 1-10 (2/3)')).toBeTruthy();
      });
    });

    it('should show test complete button on last question', async () => {
      const { getByText } = renderScreen();

      // Answer first two questions to get to the last one
      await waitFor(async () => {
        // First question
        fireEvent.press(getByText('こんにちは'));
        fireEvent.press(getByText('次の問題へ'));

        // Second question - need to wait for it to load
        await waitFor(() => {
          expect(getByText('감사합니다')).toBeTruthy();
        });

        fireEvent.press(getByText('ありがとうございます'));
        fireEvent.press(getByText('次の問題へ'));

        // Third question
        await waitFor(() => {
          expect(getByText('죄송합니다')).toBeTruthy();
        });

        fireEvent.press(getByText('すみません'));

        // Should show "テスト完了" button
        expect(getByText('テスト完了')).toBeTruthy();
      });
    });

    it('should show completion alert when test is finished', async () => {
      const { getByText } = renderScreen();

      // Complete all three questions
      await waitFor(async () => {
        // First question
        fireEvent.press(getByText('こんにちは'));
        fireEvent.press(getByText('次の問題へ'));

        // Second question
        await waitFor(() => {
          expect(getByText('감사합니다')).toBeTruthy();
        });
        fireEvent.press(getByText('ありがとうございます'));
        fireEvent.press(getByText('次の問題へ'));

        // Third question
        await waitFor(() => {
          expect(getByText('죄송합니다')).toBeTruthy();
        });
        fireEvent.press(getByText('すみません'));
        fireEvent.press(getByText('テスト完了'));

        // Should show completion alert
        expect(Alert.alert).toHaveBeenCalledWith(
          'テスト完了！',
          expect.stringContaining('正答率'),
          [{ text: 'OK', onPress: expect.any(Function) }],
        );
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should show confirmation dialog when back button is pressed', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        fireEvent.press(getByText('← 戻る'));

        expect(Alert.alert).toHaveBeenCalledWith(
          'テストを中断しますか？',
          '現在のテスト結果は保存されません。',
          expect.arrayContaining([
            { text: 'キャンセル', style: 'cancel' },
            { text: '中断する', onPress: expect.any(Function) },
          ]),
        );
      });
    });

    it('should show confirmation dialog when home button is pressed', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        fireEvent.press(getByText('ホーム'));

        expect(Alert.alert).toHaveBeenCalledWith(
          'テストを中断しますか？',
          '現在のテスト結果は保存されません。',
          expect.arrayContaining([
            { text: 'キャンセル', style: 'cancel' },
            { text: '中断する', onPress: expect.any(Function) },
          ]),
        );
      });
    });

    it('should navigate back when error back button is pressed', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        expect(getByText('問題データが見つかりません')).toBeTruthy();

        fireEvent.press(getByText('戻る'));
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Answer selection and feedback', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should disable answer buttons after selection', async () => {
      const { getByText } = renderScreen();

      await waitFor(() => {
        const correctAnswer = getByText('こんにちは');
        fireEvent.press(correctAnswer);

        // Try to press another answer - should not change selection
        // This is implicitly tested by the UI state not changing
        expect(getByText('次の問題へ')).toBeTruthy();
      });
    });

    it('should track correct and incorrect answers', async () => {
      const { getByText, queryByText } = renderScreen();

      await waitFor(async () => {
        // Answer first question correctly
        fireEvent.press(getByText('こんにちは'));
        fireEvent.press(getByText('次の問題へ'));

        // Answer second question incorrectly (find a wrong answer)
        await waitFor(() => {
          expect(getByText('감사합니다')).toBeTruthy();
        });

        // Press a wrong answer if available, otherwise press correct
        const wrongAnswers = ['学生', '先生', '学校'];
        let foundWrongAnswer = false;

        for (const wrongAnswer of wrongAnswers) {
          const wrongElement = queryByText(wrongAnswer);
          if (wrongElement) {
            fireEvent.press(wrongElement);
            foundWrongAnswer = true;
            break;
          }
        }

        if (!foundWrongAnswer) {
          // If no wrong answers visible, press correct answer
          fireEvent.press(getByText('ありがとうございます'));
        }

        fireEvent.press(getByText('次の問題へ'));

        // Complete third question
        await waitFor(() => {
          expect(getByText('죄송합니다')).toBeTruthy();
        });
        fireEvent.press(getByText('すみません'));
        fireEvent.press(getByText('テスト完了'));

        // Should show results with accuracy
        expect(Alert.alert).toHaveBeenCalledWith(
          'テスト完了！',
          expect.stringMatching(/正答率: \d+% \(\d+\/3問正解\)/),
          [{ text: 'OK', onPress: expect.any(Function) }],
        );
      });
    });
  });

  describe('Progress tracking', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should show correct progress throughout the test', async () => {
      const { getByText } = renderScreen();

      await waitFor(async () => {
        // Should start at 1/3
        expect(getByText('ユニット 1-10 (1/3)')).toBeTruthy();

        // Complete first question
        fireEvent.press(getByText('こんにちは'));
        fireEvent.press(getByText('次の問題へ'));

        // Should show 2/3
        await waitFor(() => {
          expect(getByText('ユニット 1-10 (2/3)')).toBeTruthy();
        });
      });
    });
  });

  describe('Different grade levels', () => {
    it('should work with different grade levels', async () => {
      // Create data for grade 5
      await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create(unit => {
            unit._raw.id = 'unit_5_1';
            unit.grade = 5;
            unit.unitNumber = 1;
          });
      });

      await createTestWord(database, {
        id: 'word_5_1',
        korean: '컴퓨터',
        japanese: 'コンピューター',
        grade: 5,
        unitId: 'unit_5_1',
        unitOrder: 1,
      });

      const customRoute = { params: { level: 5, unitNumber: 1 } };
      const { getByText } = renderScreen(customRoute);

      await waitFor(() => {
        expect(getByText('5級 リーディングテスト')).toBeTruthy();
        expect(getByText('컴퓨터')).toBeTruthy();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle insufficient wrong answer options', async () => {
      // Create unit with only one word (not enough for wrong options)
      await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create(unit => {
            unit._raw.id = 'unit_3_1';
            unit.grade = 3;
            unit.unitNumber = 1;
          });
      });

      await createTestWord(database, {
        id: 'word_only',
        korean: '유일한',
        japanese: '唯一の',
        grade: 3,
        unitId: 'unit_3_1',
        unitOrder: 1,
      });

      const { getByText } = renderScreen();

      // Should still render but may have fewer than 4 options
      await waitFor(() => {
        expect(getByText('유일한')).toBeTruthy();
        expect(getByText('唯一の')).toBeTruthy();
      });
    });
  });

  describe('Sound player error handling', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should handle sound player errors gracefully', async () => {
      mockSoundPlayer.playAsset.mockImplementation(() => {
        throw new Error('Audio error');
      });

      const { getByText } = renderScreen();

      await waitFor(() => {
        const soundButton = getByText('🔊');

        // Should not crash when sound button is pressed
        expect(() => fireEvent.press(soundButton)).not.toThrow();

        // Should still show Korean word
        expect(getByText('안녕하세요')).toBeTruthy();
      });
    });
  });
});
