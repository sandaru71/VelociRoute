import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Avatar({ source, size = 40 }) {
  return (
    <View style={styles.container}>
      <Image source={source} style={[styles.image, { width: size, height: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 50,
  },
});
