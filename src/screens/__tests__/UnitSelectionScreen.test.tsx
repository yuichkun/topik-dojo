import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SCREEN_NAMES } from '../../constants/screens';
import { Unit } from '../../database/models';
import { useUnits } from '../../hooks/useUnits';
import UnitSelectionScreen from '../UnitSelectionScreen';

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
  },
};

// Helper to render screen with navigation context
const renderScreen = () => {
  return render(
    <NavigationContainer>
      <UnitSelectionScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    </NavigationContainer>,
  );
};

describe('UnitSelectionScreen', () => {
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

    it('should render header with correct grade', () => {
      const { getByText } = renderScreen();

      expect(getByText('3級 学習')).toBeTruthy();
      expect(getByText('← 戻る')).toBeTruthy();
      expect(getByText('ホーム')).toBeTruthy();
    });

    it('should render unit buttons with correct display names', () => {
      const { getByText } = renderScreen();

      expect(getByText('1-10')).toBeTruthy();
      expect(getByText('11-20')).toBeTruthy();
      expect(getByText('21-30')).toBeTruthy();
    });

    it('should call useUnits with correct grade', () => {
      renderScreen();

      expect(mockUseUnits).toHaveBeenCalledWith(3);
    });

    it('should navigate to learning screen when unit button is pressed', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('11-20'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(SCREEN_NAMES.LEARNING, {
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
      expect(getByText('3級 学習')).toBeTruthy();

      // No unit buttons should be rendered
      expect(queryByText('1-10')).toBeNull();
      expect(queryByText('11-20')).toBeNull();
    });
  });

  describe('Different grade levels', () => {
    it('should work with different grade levels', () => {
      const mockRoute1 = { params: { level: 1 } };

      const { rerender } = render(
        <NavigationContainer>
          <UnitSelectionScreen
            navigation={mockNavigation as any}
            route={mockRoute1 as any}
          />
        </NavigationContainer>,
      );

      expect(mockUseUnits).toHaveBeenCalledWith(1);

      const mockRoute6 = { params: { level: 6 } };

      rerender(
        <NavigationContainer>
          <UnitSelectionScreen
            navigation={mockNavigation as any}
            route={mockRoute6 as any}
          />
        </NavigationContainer>,
      );

      expect(mockUseUnits).toHaveBeenCalledWith(6);
    });
  });

  describe('Units with different display names', () => {
    it('should render units with various display name formats', () => {
      const specialUnits = [
        {
          id: 'unit_1_1',
          grade: 1,
          unitNumber: 1,
          displayName: '1-10',
        },
        {
          id: 'unit_1_40',
          grade: 1,
          unitNumber: 40,
          displayName: '391-400',
        },
        {
          id: 'unit_6_300',
          grade: 6,
          unitNumber: 300,
          displayName: '2991-3000',
        },
      ] as Unit[];

      mockUseUnits.mockReturnValue({
        units: specialUnits,
        loading: false,
        error: null,
      });

      const { getByText } = renderScreen();

      expect(getByText('1-10')).toBeTruthy();
      expect(getByText('391-400')).toBeTruthy();
      expect(getByText('2991-3000')).toBeTruthy();
    });
  });
});
