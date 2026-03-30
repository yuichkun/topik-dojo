import React from 'react';
import { View, Modal, Pressable, type ViewStyle } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function BottomSheet({ visible, onClose, children, contentStyle }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={[
            {
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 40,
            },
            contentStyle,
          ]}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: '#e1e3e5',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
