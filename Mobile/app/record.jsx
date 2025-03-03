import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';

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
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 15 }}
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity 
          style={[styles.saveButton, { opacity: path.length > 0 ? 1 : 0.5 }]}
          disabled={path.length === 0}
          onPress={() => handleSaveActivity()}
        > 
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, path]);

  const getElevationData = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/elevation/json?locations=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].elevation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching elevation:', error);
      return null;
    }
  };

  const getUserLocation = async () => {
    try {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was not granted.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (location?.coords) {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsLoading(false);
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
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      async (location) => {
        const { latitude, longitude, speed } = location.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Update current speed (convert m/s to km/h)
        const currentSpeedKmh = speed ? speed * 3.6 : 0;
        setCurrentSpeed(currentSpeedKmh);

        if (!paused) {
          const elevation = await getElevationData(latitude, longitude);
          
          setPath((prevPath) => {
            if (prevPath.length > 0) {
              const lastPoint = prevPath[prevPath.length - 1];
              const distance = getDistance(
                { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
                { latitude, longitude }
              );
              setTotalDistance((prevDistance) => prevDistance + distance);

              if (elevation && lastPoint.elevation) {
                const elevationDiff = elevation - lastPoint.elevation;
                if (elevationDiff > 0) {
                  setElevationGain((prev) => prev + elevationDiff);
                }
              }
            }
            return [...prevPath, { latitude, longitude, elevation }];
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
  };

  const toggleTimer = () => {
    if (paused) {
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime > 0 && totalDistance > 0) {
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
    setCurrentSpeed(0);
    setCurrentLocation(null);
  };

  const handleSaveActivity = () => {
    // TODO: Implement save functionality
    console.log('Saving activity...');
  };

  useEffect(() => {
    getUserLocation();
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (locationSubscription) stopTracking();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            : null
        }
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )}
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.statsOverlay}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{formatTime(time)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{(totalDistance / 1000).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Distance (km)</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="speedometer" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Current Speed (km/h)</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{elevationGain.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Elevation Gain (m)</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.resetButton]} 
          onPress={resetTimer}
        >
          <MaterialCommunityIcons name="refresh" size={30} color="#FF3B30" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.startButton]} 
          onPress={toggleTimer}
        >
          <MaterialCommunityIcons 
            name={paused ? "play" : "pause"} 
            size={40} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
});
