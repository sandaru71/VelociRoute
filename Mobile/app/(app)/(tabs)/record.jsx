import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import SpotifyPlayer from '../../../components/SpotifyPlayer';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
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
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [path, setPath] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();
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

  const getElevationGain = async (newLat, newLng, lastLat, lastLng) => {
    const [newElevation, lastElevation] = await Promise.all([
      getElevationData(newLat, newLng),
      getElevationData(lastLat, lastLng)
    ]);
  
    // Update elevation if altitude changed
    if (lastElevation !== null && newElevation !== null) {
      const elevationChange = newElevation - lastElevation;
      if (elevationChange > 0) {
        setElevationGain(prev => prev + elevationChange);
      }
    }
  }

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
          setCurrentRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          
          if (!paused) {
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

                getElevationGain(latitude, longitude, lastLocation.latitude, lastLocation.longitude);

                return [...prevPath, newLocation];
              }
              return prevPath;
            });
          }
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

  useEffect(() => {
    // Calculate average speed whenever time or distance changes
    if (time > 0) {
      const avgSpeed = (totalDistance / (time / 3600)); // km/h
      setAverageSpeed(avgSpeed);
    }
  }, [time, totalDistance]);

  useEffect(() => {
    // Check if we need to reset the tracking data
    if (params.reset === 'true') {
      resetTimer();
    }
  }, [params.reset]);

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
    // Pause the activity before saving
    if (!paused) {
      toggleTimer();
    }
    
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

  const onRegionChangeComplete = (region) => {
    setCurrentRegion(region);
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
      <View style={styles.container}>
        <ScrollView style={styles.spotifyContainer}>
          <SpotifyPlayer />
        </ScrollView>
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
        {/* Map View */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={isFollowingUser}
          region={currentRegion}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {path.length > 0 && (
            <Polyline
              coordinates={path}
              strokeColor="#FEBE15"
              strokeWidth={3}
            />
          )}
        </MapView>

        {/* Spotify Player */}
        <View style={styles.spotifyContainer}>
          <SpotifyPlayer />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
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
              <Text style={styles.statValue}>{averageSpeed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Speed (km/h)</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="elevation-rise" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{elevationGain.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Elevation Gain (m)</Text>
            </View>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetTimer}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#FF3B30" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playPauseButton} 
            onPress={toggleTimer}
          >
            <MaterialCommunityIcons 
              name={paused ? "play" : "pause"} 
              size={32} 
              color="white" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={zoomToCurrentLocation}
          >
            <MaterialCommunityIcons 
              name="crosshairs-gps" 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#fff',
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
  spotifyContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 100,
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
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 2,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEBE15',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
});

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600)/60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
};
