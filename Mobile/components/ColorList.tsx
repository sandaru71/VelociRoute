import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ViewStyle } from 'react-native';

interface ColorListProps {
  color: string;
}

const ColorList: React.FC<ColorListProps> = ({ color }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.container}>
      {
        [1, 0.8, 0.5].map(opacity => (
          <View 
            key={opacity} 
            style={[styles.color, { backgroundColor: color, opacity }]} 
          />
        ))
      }
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  color: {
    width: '100%',
    height: 150,
    borderRadius: 25,
    borderCurve: 'continuous', 
    marginBottom: 15,
  } as ViewStyle, // Explicit type for the styles
  container: {
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    height: '100%',
  } as ViewStyle,
});

export default ColorList;
