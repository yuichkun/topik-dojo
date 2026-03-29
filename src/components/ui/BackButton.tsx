import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

type Props = {
  onPress: () => void;
  label?: string;
  color?: string;
};

export function BackButton({ onPress, label = '戻る', color = '#434653' }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 4 }}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
