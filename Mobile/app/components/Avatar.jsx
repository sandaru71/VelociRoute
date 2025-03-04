import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Avatar = ({ size = 40, name = '?' }) => {
  const initial = name ? name[0].toUpperCase() : '?';
  
  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      }
    ]}>
      <Text style={[
        styles.initial,
        { fontSize: size * 0.5 }
      ]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Avatar;
