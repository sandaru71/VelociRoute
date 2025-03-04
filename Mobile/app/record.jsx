import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
    let {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted'){
      setErrorMsg('Permission to access location was not granted.');
      return;
    }
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0.1, // Reduced to 0.1 meters for more frequent updates
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Update current speed (convert m/s to km/h)
        const currentSpeedKmh = speed ? speed * 3.6 : 0;
        setCurrentSpeed(currentSpeedKmh);
      }
    );

    setLocationSubscription(subscription);
  };

  const startTracking = async () => {
    if (!currentLocation) return;
    
    // Get initial elevation
    const { latitude, longitude } = currentLocation;
    const initialElevation = await getElevationData(latitude, longitude);
    setPath([{ latitude, longitude, elevation: initialElevation }]);
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0.1, // Reduced to 0.1 meters for more frequent updates
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

            // Update distance for any movement (removed minimum threshold)
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

  const toggleTimer = () => {
    if (paused) {
      // Reset path and counters when starting new tracking
      setPath([]);
      setTotalDistance(0);
      setElevationGain(0);
      setAverageSpeed(0);
      
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
      startTracking().then(setLocationSubscription);
    } else {
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
    setCurrentLocation(null);
  };

  const handleSaveActivity = () => {
    // TODO: Implement save functionality
    console.log('Saving activity...');
  };

  const zoomToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Closer zoom level
        longitudeDelta: 0.005,
      }, 1000); // Animation duration in ms
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
          onPress={() => handleSaveActivity()}
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
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
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
        {/* {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )} */}
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor={paused ? "#007AFF80" : "#007AFF"} // Transparent blue when paused, solid when active
            strokeWidth={6}
            lineDashPattern={paused ? [5, 5] : null} // Dashed when paused, solid when active
          />
        )}
      </MapView>

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
    bottom: 25, // Adjusted for better positioning without tab bar
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
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 25, // Adjusted for better positioning without tab bar
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
});

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600)/60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
};
