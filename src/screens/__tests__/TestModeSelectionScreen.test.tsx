import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { SCREEN_NAMES } from '../../constants/screens';
import TestModeSelectionScreen from '../TestModeSelectionScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    level: 3,
  },
};

// Helper to render screen with navigation context
const renderScreen = (customRoute?: any) => {
  return render(
    <NavigationContainer>
      <TestModeSelectionScreen
        navigation={mockNavigation as any}
        route={customRoute || mockRoute as any}
      />
    </NavigationContainer>,
  );
};

describe('TestModeSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header', () => {
    it('should render header with correct grade', () => {
      const { getByText } = renderScreen();

      expect(getByText('3級 テスト')).toBeTruthy();
      expect(getByText('← 戻る')).toBeTruthy();
      expect(getByText('ホーム')).toBeTruthy();
    });

    it('should navigate back when back button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('← 戻る'));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('should navigate to top when home button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('ホーム'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith(SCREEN_NAMES.TOP);
    });
  });

  describe('Test mode buttons', () => {
    it('should render listening test button with correct content', () => {
      const { getByText } = renderScreen();

      expect(getByText('🎧')).toBeTruthy();
      expect(getByText('リスニング')).toBeTruthy();
      expect(getByText('音声を聞いて日本語訳を4択から選択')).toBeTruthy();
    });

    it('should render reading test button with correct content', () => {
      const { getByText } = renderScreen();

      expect(getByText('📖')).toBeTruthy();
      expect(getByText('リーディング')).toBeTruthy();
      expect(getByText('ハングル文字を見て日本語訳を4択から選択')).toBeTruthy();
    });

    it('should show alert when listening button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('リスニング'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'リスニングテスト',
        '3級のリスニングテストを開始します'
      );
    });

    it('should show alert when reading button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('リーディング'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'リーディングテスト',
        '3級のリーディングテストを開始します'
      );
    });

    // TODO: Update these tests when navigation is implemented
    it.skip('should navigate to listening unit selection when listening button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('リスニング'));
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        SCREEN_NAMES.LISTENING_UNIT_SELECTION,
        { level: 3, mode: 'listening' }
      );
    });

    it.skip('should navigate to reading unit selection when reading button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('リーディング'));
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        SCREEN_NAMES.READING_UNIT_SELECTION,
        { level: 3, mode: 'reading' }
      );
    });
  });

  describe('Different grade levels', () => {
    it.each([1, 2, 3, 4, 5, 6])('should work with grade %i', (level) => {
      const customRoute = { params: { level } };
      const { getByText } = renderScreen(customRoute);

      expect(getByText(`${level}級 テスト`)).toBeTruthy();
    });

    it('should pass correct level to alert messages', () => {
      const customRoute = { params: { level: 5 } };
      const { getByText } = renderScreen(customRoute);

      fireEvent.press(getByText('リスニング'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'リスニングテスト',
        '5級のリスニングテストを開始します'
      );

      fireEvent.press(getByText('リーディング'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'リーディングテスト',
        '5級のリーディングテストを開始します'
      );
    });
  });

  describe('Button interactions', () => {
    it('should have all interactive elements accessible', () => {
      const { getByText } = renderScreen();
      
      // Check that interactive elements exist
      expect(getByText('← 戻る')).toBeTruthy();
      expect(getByText('ホーム')).toBeTruthy();
      expect(getByText('リスニング')).toBeTruthy();
      expect(getByText('リーディング')).toBeTruthy();
    });

    it('should have proper button structure', () => {
      const { getByText } = renderScreen();

      // Verify buttons are rendered with correct text
      const listeningText = getByText('リスニング');
      const readingText = getByText('リーディング');

      // Check that they exist and are part of touchable components
      expect(listeningText).toBeTruthy();
      expect(readingText).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing level parameter gracefully', () => {
      const routeWithoutLevel = { params: {} };
      // Should not crash and display default or handle error appropriately
      expect(() => renderScreen(routeWithoutLevel)).not.toThrow();
    });

    it('should handle undefined route params', () => {
      const routeWithoutParams = {};
      expect(() => renderScreen(routeWithoutParams)).not.toThrow();
    });
  });

  describe('Dark mode support', () => {
    it('should render correctly in dark mode', () => {
      // Mock dark mode
      jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
      
      const { getByText } = renderScreen();
      
      // Should still render all elements correctly
      expect(getByText('3級 テスト')).toBeTruthy();
      expect(getByText('リスニング')).toBeTruthy();
      expect(getByText('リーディング')).toBeTruthy();
    });
  });
});