import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';


export default function Record() {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [path, setPath] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const navigation = useNavigation();
  const [totalDistance, setTotalDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);

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
      headerRight: () => (
        <TouchableOpacity style={styles.saveButton}> 
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )
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
        const{latitude, longitude, altitude} = location.coords;
        setCurrentLocation({latitude,longitude});

        if(!paused){
          setPath((prevPath) => {
            if(prevPath.length > 0) {
              const lastPoint = prevPath[prevPath.length - 1];
              const distance = getDistance(
                {latitude: lastPoint.latitude, longitude: lastPoint.longitude},
                {latitude, longitude}
              );
              setTotalDistance((prevDistance) => prevDistance + distance);

              const altitudeGain = altitude - lastPoint.altitude;

              if (altitudeGain > 0) {
                setElevationGain((prevElevation) => prevElevation + altitudeGain);
              }
            }
            return [...prevPath, {latitude,longitude,altitude}];
          });
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

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600)/60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
  }

  const toggleTimer = () => {
    if (paused) {
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime > 0 && totalDistance > 0){
            setAverageSpeed((totalDistance/newTime) * 3.6);
          }
          return newTime;
        });
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
    setTotalDistance(0);
    setElevationGain(0);
    setAverageSpeed(0);
    setCurrentLocation(null);
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
      {/* Statistics Display */}
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsText}>Time: {formatTime(time)}</Text>
        <Text style={styles.statisticsText}>Distance: {totalDistance.toFixed(2)}m</Text>
        <Text style={styles.statisticsText}>Elevation Gain: {elevationGain.toFixed(2)}m</Text>
        <Text style={styles.statisticsText}>Avg speed: {averageSpeed.toFixed(2)}km/h</Text>
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
        {/* {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            description="This is your current position"
            pinColor="blue"
          />
        )} */}
      </MapView>

      {/* Buttons for timer control */}
      <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: paused ? 'green' : 'orange', marginRight: 10}]}
            onPress={toggleTimer}
          >
            <Text style={styles.buttonText}>{paused ? 'Start': 'Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'red', marginLeft: 10}]}
            onPress={resetTimer}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
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
  statisticsContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 40,
    backgroundColor: '#FEBE15',
    padding: 10,
    borderRadius: 5,
  },
  statisticsText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: '12%',
    alignSelf:'center',
    padding: 20,
    zIndex: 1,
  },
  saveButton: {
    backgroundColor: 'white',
    padding: 10,
    marginRight: 10,
  },
  saveButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    width: 150,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
