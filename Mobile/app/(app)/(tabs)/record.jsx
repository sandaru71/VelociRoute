import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import axios from 'axios';
import { Audio } from 'expo-av';
// Adjust the import path below if needed based on your project folder structure.
import songFile from '../../../assets/music/song.mp3';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';

// Default location: Colombo, Sri Lanka
const DEFAULT_LOCATION = {
  latitude: 6.9271,
  longitude: 79.8612,
};

export default function Record() {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [errorMsg, setErrorMsg] = useState("");
  const [path, setPath] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const navigation = useNavigation();
  const [totalDistance, setTotalDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  
  // Audio state for controlling music
  const [sound, setSound] = useState(null);

  // Load the sound when the component mounts and set it to loop
  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(songFile);
        await sound.setIsLoopingAsync(true); // Enable looping when the song ends
        setSound(sound);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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

  const startLocationWatch = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was not granted.');
      return;
    }
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0.1,
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;
        setCurrentLocation({ latitude, longitude });
        const currentSpeedKmh = speed ? speed * 3.6 : 0;
        setCurrentSpeed(currentSpeedKmh);
      }
    );
    setLocationSubscription(subscription);
  };

  const startTracking = async () => {
    if (!currentLocation) return;
    const { latitude, longitude } = currentLocation;
    const initialElevation = await getElevationData(latitude, longitude);
    setPath([{ latitude, longitude, elevation: initialElevation }]);
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0.1,
      },
      async (location) => {
        const { latitude, longitude, speed } = location.coords;
        if (!paused) {
          const elevation = await getElevationData(latitude, longitude);
          setPath((prevPath) => {
            const lastPoint = prevPath[prevPath.length - 1];
            const distance = getDistance(
              { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
              { latitude, longitude }
            );
            setTotalDistance((prevDistance) => prevDistance + distance);
            if (elevation !== null && lastPoint.elevation !== null) {
              const elevationDiff = elevation - lastPoint.elevation;
              if (elevationDiff > 0) {
                setElevationGain((prev) => prev + elevationDiff);
              }
            }
            return [...prevPath, { latitude, longitude, elevation }];
          });
        }
      }
    );
    return subscription;
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  // Toggle the timer and control the music play/pause accordingly
  const toggleTimer = async () => {
    if (paused) {
      // When starting, play the song
      if (sound) {
        await sound.playAsync();
      }
      // Reset counters and start tracking
      setPath([]);
      setTotalDistance(0);
      setElevationGain(0);
      setAverageSpeed(0);
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime > 0 && totalDistance > 0) {
            setAverageSpeed((totalDistance / newTime) * 3.6);
          }
          return newTime;
        });
      }, 1000);
      setIntervalId(newIntervalId);
      startTracking().then(setLocationSubscription);
    } else {
      // When pausing, pause the song
      if (sound) {
        await sound.pauseAsync();
      }
      clearInterval(intervalId);
      setIntervalId(null);
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
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
    // Reset to default Colombo location when resetting
    setCurrentLocation(DEFAULT_LOCATION);
  };

  const handleSaveActivity = () => {
    console.log('Saving activity...');
    const activityData = {
      routeData: {
        path: path,
        startLocation: path[0],
        endLocation: path[path.length - 1]
      },
      stats: {
        totalDistance: totalDistance,
        elevationGain: elevationGain,
        averageSpeed: averageSpeed,
        duration: time
      }
    };
    navigation.navigate('post', {
      routeData: JSON.stringify(activityData.routeData),
      stats: JSON.stringify(activityData.stats)
    });
  };

  // Zoom functionality: Adjust the map's zoom level based on the direction
  const handleZoom = (direction) => {
    if (!mapRef.current) return;
    mapRef.current.getCamera().then((camera) => {
      if (direction === 'in') {
        camera.zoom = (camera.zoom || 15) + 1;
      } else {
        camera.zoom = (camera.zoom || 15) - 1;
      }
      mapRef.current.animateCamera(camera, { duration: 300 });
    });
  };

  const zoomToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  useEffect(() => {
    getUserLocation();
    startLocationWatch();
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

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
        <TouchableOpacity 
          style={[styles.saveButton, { opacity: path.length > 0 ? 1 : 0.5 }]}
          disabled={path.length === 0}
          onPress={handleSaveActivity}
        > 
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, path]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map displays the initialRegion (Colombo) and user location */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor={paused ? "#007AFF80" : "#007AFF"}
            strokeWidth={6}
            lineDashPattern={paused ? [5, 5] : null}
          />
        )}
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('in')}>
          <MaterialIcons name="add" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('out')}>
          <MaterialIcons name="remove" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={zoomToCurrentLocation}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#007AFF" />
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
            <Text style={styles.statValue}>{(totalDistance / 1000).toFixed(2)}</Text>
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
  zoomControls: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 25,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
});

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};