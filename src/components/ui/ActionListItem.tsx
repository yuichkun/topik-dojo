import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
};

/**
 * Icon + text row with chevron, used inside BottomSheet / action lists.
 * Background: surface (#f8f9fa), borderRadius: 12.
 */
export function ActionListItem({ icon, title, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      }}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color="#002897" />
      <View style={{ marginLeft: 16, flex: 1 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: '#191c1d' }}>
          {title}
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#434653', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c3c6d5" />
    </TouchableOpacity>
  );
}
