import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as AuthSession from 'expo-auth-session';


export default function Record() {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [path, setPath] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 15 }}
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was not granted.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (location?.coords) {
        const { latitude, longitude } = location.coords;
        console.log("Latitude & Longitude:", latitude, longitude);

        setCurrentLocation({ latitude, longitude });

        let response = await Location.reverseGeocodeAsync({ latitude, longitude });
        console.log('User Location:', response);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const startTracking = async () => {
    let {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted'){
      console.log('Permission to access location not granted.')
      return;
    }
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      (location) => {
        const{latitude, longitude} = location.coords;
        setCurrentLocation({latitude,longitude});

        if(!paused){
          setPath((prevPath) => [...prevPath, {latitude,longitude}]);
        }
      }
    );

    setLocationSubscription(subscription);
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const toggleTimer = () => {
    if (paused) {
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      setIntervalId(newIntervalId);
      startTracking();
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
      stopTracking();
    }
    setPaused(!paused);
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setTime(0);
    setPaused(true);
    setIntervalId(null);
    stopTracking();
    setPath([]);
  };

  useEffect(() => {
    getUserLocation(); // Fetch user's location when component mounts

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (locationSubscription) stopTracking();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Timer Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timerText}>Time: {time}s</Text>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              }
            : {
                latitude: 24.833368,
                longitude: 67.048489,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              }
        }
        showsUserLocation={true} // Display blue dot for user's location
        followsUserLocation={true} // Keep map centered on user
      >
        {/* Marker for current location */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            description="This is your current position"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* Buttons for timer control */}
      <View style={styles.buttonContainer}>
        <Button title={paused ? 'Start' : 'Pause'} onPress={toggleTimer} />
        <Button title="Reset" onPress={resetTimer} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  timeContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 40,
    backgroundColor: '#FEBE15',
    padding: 10,
    borderRadius: 5,
  },
  timerText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 150,
    backgroundColor: 'black',
    padding: 20,
    zIndex: 1,
    borderRadius: 5,
  },
});
