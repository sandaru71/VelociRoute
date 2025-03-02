import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import ColorList from '@/components/ColorList';
import { Stack, useRouter } from 'expo-router';

const Record = () => {
  const router = useRouter();
  
  // Mock data for testing
  const mockData = {
    routeData: {
      coordinates: [
        { latitude: 6.9271, longitude: 79.8612 },
        { latitude: 6.9275, longitude: 79.8618 }
      ]
    },
    stats: {
      averageSpeed: 15.5,
      distance: 5.2,
      timeTaken: 1800, // 30 minutes in seconds
      elevationGain: 125
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ColorList color='#78716c'/>
      
      {/* Mock recording controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.title}>Record Activity</Text>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={() => {
            // Navigate to post screen with mock data
            router.push({
              pathname: "/(app)/post",
              params: {
                routeData: JSON.stringify(mockData.routeData),
                stats: JSON.stringify(mockData.stats)
              }
            });
          }}
        >
          <Text style={styles.buttonText}>Finish Activity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default Record;
