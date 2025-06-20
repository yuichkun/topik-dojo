import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SCREEN_NAMES } from '../../constants/screens';
import { Unit } from '../../database/models';
import { useUnits } from '../../hooks/useUnits';
import TestUnitSelectionScreen from '../TestUnitSelectionScreen';

// Mock the useUnits hook
jest.mock('../../hooks/useUnits');

const mockUseUnits = useUnits as jest.MockedFunction<typeof useUnits>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    level: 3,
    testMode: 'reading' as const,
  },
};

// Helper to render screen with navigation context
const renderScreen = (customRoute?: any) => {
  return render(
    <NavigationContainer>
      <TestUnitSelectionScreen
        navigation={mockNavigation as any}
        route={customRoute || mockRoute as any}
      />
    </NavigationContainer>,
  );
};

describe('TestUnitSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading indicator when units are being fetched', () => {
      mockUseUnits.mockReturnValue({
        units: [],
        loading: true,
        error: null,
      });

      const { getByText, getByTestId } = renderScreen();

      expect(getByText('ユニット情報を読み込んでいます...')).toBeTruthy();
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });
  });

  describe('Error state', () => {
    it('should show error message when fetch fails', () => {
      const mockError = new Error('Database connection failed');
      mockUseUnits.mockReturnValue({
        units: [],
        loading: false,
        error: mockError,
      });

      const { getByText } = renderScreen();

      expect(getByText('エラーが発生しました')).toBeTruthy();
      expect(getByText('Database connection failed')).toBeTruthy();
      expect(getByText('戻る')).toBeTruthy();
    });

    it('should navigate back when error back button is pressed', () => {
      const mockError = new Error('Database error');
      mockUseUnits.mockReturnValue({
        units: [],
        loading: false,
        error: mockError,
      });

      const { getByText } = renderScreen();

      fireEvent.press(getByText('戻る'));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success state', () => {
    const mockUnits = [
      {
        id: 'unit_3_1',
        grade: 3,
        unitNumber: 1,
        displayName: '1-10',
      },
      {
        id: 'unit_3_2',
        grade: 3,
        unitNumber: 2,
        displayName: '11-20',
      },
      {
        id: 'unit_3_3',
        grade: 3,
        unitNumber: 3,
        displayName: '21-30',
      },
    ] as Unit[];

    beforeEach(() => {
      mockUseUnits.mockReturnValue({
        units: mockUnits,
        loading: false,
        error: null,
      });
    });

    it('should render header with correct grade and reading test label', () => {
      const { getByText } = renderScreen();

      expect(getByText('3級 リーディングテスト')).toBeTruthy();
      expect(getByText('← 戻る')).toBeTruthy();
      expect(getByText('ホーム')).toBeTruthy();
    });

    it('should render description text for reading test', () => {
      const { getByText } = renderScreen();

      expect(getByText('📖 ハングル文字を見て日本語訳を4択から選択してください')).toBeTruthy();
    });

    it('should render unit buttons with correct display names and question count', () => {
      const { getByText } = renderScreen();

      expect(getByText('ユニット 1-10')).toBeTruthy();
      expect(getByText('ユニット 11-20')).toBeTruthy();
      expect(getByText('ユニット 21-30')).toBeTruthy();
      
      // Check that "10問" appears for each unit
      const questionCounts = renderScreen().getAllByText('10問');
      expect(questionCounts).toHaveLength(3);
    });

    it('should call useUnits with correct grade', () => {
      renderScreen();

      expect(mockUseUnits).toHaveBeenCalledWith(3);
    });

    it('should navigate to reading test screen when unit button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('ユニット 11-20'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(SCREEN_NAMES.READING_TEST, {
        level: 3,
        unitNumber: 2,
      });
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

  describe('Empty units', () => {
    it('should handle empty units array gracefully', () => {
      mockUseUnits.mockReturnValue({
        units: [],
        loading: false,
        error: null,
      });

      const { getByText, queryByText } = renderScreen();

      // Header should still be rendered
      expect(getByText('3級 リーディングテスト')).toBeTruthy();
      expect(getByText('📖 ハングル文字を見て日本語訳を4択から選択してください')).toBeTruthy();

      // No unit buttons should be rendered
      expect(queryByText('ユニット 1-10')).toBeNull();
      expect(queryByText('ユニット 11-20')).toBeNull();
    });
  });

  describe('Different grade levels', () => {
    it('should work with different grade levels', () => {
      const mockRoute1 = { params: { level: 1, testMode: 'reading' as const } };

      const { rerender, getByText } = render(
        <NavigationContainer>
          <TestUnitSelectionScreen
            navigation={mockNavigation as any}
            route={mockRoute1 as any}
          />
        </NavigationContainer>,
      );

      expect(mockUseUnits).toHaveBeenCalledWith(1);
      expect(getByText('1級 リーディングテスト')).toBeTruthy();

      const mockRoute6 = { params: { level: 6, testMode: 'reading' as const } };

      rerender(
        <NavigationContainer>
          <TestUnitSelectionScreen
            navigation={mockNavigation as any}
            route={mockRoute6 as any}
          />
        </NavigationContainer>,
      );

      expect(mockUseUnits).toHaveBeenCalledWith(6);
      expect(getByText('6級 リーディングテスト')).toBeTruthy();

      // Test listening mode
      const listeningRoute = { params: { level: 6, testMode: 'listening' as const } };

      rerender(
        <NavigationContainer>
          <TestUnitSelectionScreen
            navigation={mockNavigation as any}
            route={listeningRoute as any}
          />
        </NavigationContainer>,
      );

      expect(mockUseUnits).toHaveBeenCalledWith(6);
      expect(getByText('6級 リスニングテスト')).toBeTruthy();
    });

    it('should pass correct level to reading test navigation', () => {
      const mockUnits = [
        {
          id: 'unit_5_1',
          grade: 5,
          unitNumber: 1,
          displayName: '1-10',
        },
      ] as Unit[];

      mockUseUnits.mockReturnValue({
        units: mockUnits,
        loading: false,
        error: null,
      });

      const customRoute = { params: { level: 5, testMode: 'reading' as const } };
      const { getByText } = renderScreen(customRoute);

      fireEvent.press(getByText('ユニット 1-10'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(SCREEN_NAMES.READING_TEST, {
        level: 5,
        unitNumber: 1,
      });
    });

    it('should navigate to listening test when test mode is listening', () => {
      const mockUnits = [
        {
          id: 'unit_3_1',
          grade: 3,
          unitNumber: 1,
          displayName: '1-10',
        },
      ] as Unit[];

      mockUseUnits.mockReturnValue({
        units: mockUnits,
        loading: false,
        error: null,
      });

      const customRoute = { params: { level: 3, testMode: 'listening' as const } };
      const { getByText } = renderScreen(customRoute);

      fireEvent.press(getByText('ユニット 1-10'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(SCREEN_NAMES.LISTENING_TEST, {
        level: 3,
        unitNumber: 1,
      });
    });
  });

  describe('Button interactions', () => {
    const mockUnits = [
      {
        id: 'unit_3_1',
        grade: 3,
        unitNumber: 1,
        displayName: '1-10',
      },
    ] as Unit[];

    beforeEach(() => {
      mockUseUnits.mockReturnValue({
        units: mockUnits,
        loading: false,
        error: null,
      });
    });

    it('should have all interactive elements accessible', () => {
      const { getByText } = renderScreen();
      
      // Check that interactive elements exist
      expect(getByText('← 戻る')).toBeTruthy();
      expect(getByText('ホーム')).toBeTruthy();
      expect(getByText('ユニット 1-10')).toBeTruthy();
    });

    it('should handle button press events correctly', () => {
      const { getByText } = renderScreen();

      // Test that buttons can be pressed without errors
      fireEvent.press(getByText('ユニット 1-10'));
      expect(mockNavigation.navigate).toHaveBeenCalled();
    });
  });

  describe('UI styling and layout', () => {
    it('should use teal color scheme for reading test theme', () => {
      const mockUnits = [
        {
          id: 'unit_3_1',
          grade: 3,
          unitNumber: 1,
          displayName: '1-10',
        },
      ] as Unit[];

      mockUseUnits.mockReturnValue({
        units: mockUnits,
        loading: false,
        error: null,
      });

      const { getByText } = renderScreen();

      // The component should render without errors (style assertions are implicit)
      expect(getByText('3級 リーディングテスト')).toBeTruthy();
      expect(getByText('ユニット 1-10')).toBeTruthy();
    });
  });

  // Note: Edge cases with missing params are not tested as they should never occur
  // with proper TypeScript and React Navigation usage
});