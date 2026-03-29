import React from 'react';
import { Text, type TextStyle } from 'react-native';

type Props = {
  children: string;
  style?: TextStyle;
};

/**
 * DESIGN.md §6 Section Labels:
 * Manrope_500Medium, 11px, on_surface_variant, letterSpacing: 2, uppercase
 */
export function SectionLabel({ children, style }: Props) {
  return (
    <Text
      style={[
        {
          fontFamily: 'Manrope_500Medium',
          fontSize: 11,
          color: '#434653',
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
