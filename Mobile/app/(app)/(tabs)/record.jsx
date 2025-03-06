import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance, getPreciseDistance } from 'geolib';
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
  const router = useRouter();
  const [totalDistance, setTotalDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const mapRef = useRef(null);

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

  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const { latitude, longitude, altitude } = location.coords;
          const newLocation = { latitude, longitude, altitude };
          
          setCurrentLocation(newLocation);
          
          setPath(prevPath => {
            if (prevPath.length === 0) {
              return [newLocation];
            }

            const lastLocation = prevPath[prevPath.length - 1];
            const distanceFromLast = getPreciseDistance(
              { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
              { latitude: newLocation.latitude, longitude: newLocation.longitude }
            );

            // Only add new point if we've moved at least 1 meter
            if (distanceFromLast >= 1) {
              // Update total distance
              setTotalDistance(prevDistance => {
                const newDistance = prevDistance + (distanceFromLast / 1000); // Convert to km
                return newDistance;
              });

              // Calculate current speed (km/h)
              const speedInKmH = (location.coords.speed * 3.6) || 0; // Convert m/s to km/h
              setCurrentSpeed(speedInKmH);

              // Update elevation if altitude changed
              if (lastLocation.altitude && newLocation.altitude) {
                const elevationChange = newLocation.altitude - lastLocation.altitude;
                if (elevationChange > 0) {
                  setElevationGain(prev => prev + elevationChange);
                }
              }

              return [...prevPath, newLocation];
            }
            return prevPath;
          });
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      setErrorMsg('Failed to start location tracking');
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude
      });
    })();
  }, []);

  useEffect(() => {
    if (!paused) {
      startLocationTracking();
    } else if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [paused]);

  const toggleTimer = () => {
    if (paused) {
      // Starting the timer
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => {
          return prevTime + 1;
        });
      }, 1000);
      setIntervalId(newIntervalId);
    } else {
      // Pausing the timer
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setPaused(!paused);
  };

  const resetTimer = () => {
    if (!paused) {
      // Stop the timer if it's running
      clearInterval(intervalId);
      setIntervalId(null);
      setPaused(true);
    }
    // Reset all tracking data
    setTime(0);
    setPath([]);
    setTotalDistance(0);
    setElevationGain(0);
    setCurrentSpeed(0);
    setAverageSpeed(0);
  };

  const handleSaveActivity = () => {
    console.log('Saving activity...');
    const stats = {
      duration: time,
      distance: totalDistance.toFixed(2),
      averageSpeed: averageSpeed.toFixed(2),
      elevationGain: elevationGain.toFixed(0)
    };

    router.push({
      pathname: "/(app)/post",
      params: {
        routeData: JSON.stringify(path),
        stats: JSON.stringify(stats)
      }
    });
  };

  const onRegionChangeComplete = () => {
    // When user manually moves the map, stop following
    setIsFollowingUser(false);
  };

  const zoomToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }, 1000);
      setIsFollowingUser(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => router.push('/(app)/(tabs)/')}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={[styles.saveButton, { opacity: path.length > 0 ? 1 : 0.5 }]}
              disabled={path.length === 0}
              onPress={handleSaveActivity}
            > 
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation={true}
          followsUserLocation={isFollowingUser}
          onRegionChangeComplete={onRegionChangeComplete}
          region={
            currentLocation && isFollowingUser
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                }
              : undefined
          }
        >
          {path.length > 0 && (
            <Polyline
              coordinates={path}
              strokeColor={paused ? "#007AFF80" : "#007AFF"}
              strokeWidth={6}
              lineDashPattern={paused ? [5, 5] : null}
              zIndex={1}
            />
          )}
        </MapView>

        <TouchableOpacity 
          style={[
            styles.locationButton,
            !isFollowingUser && styles.locationButtonActive
          ]}
          onPress={zoomToCurrentLocation}
        >
          <MaterialCommunityIcons 
            name="crosshairs-gps" 
            size={24} 
            color={isFollowingUser ? "#007AFF" : "#FFFFFF"} 
          />
        </TouchableOpacity>

        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{formatTime(time)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{totalDistance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distance (km)</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="speedometer" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Current Speed (km/h)</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#FEBE15" />
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
    </>
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
    color: 'black',
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
    bottom: 25,
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
    backgroundColor: '#FEBE15',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#FEBE15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
  },
});

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600)/60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
};
