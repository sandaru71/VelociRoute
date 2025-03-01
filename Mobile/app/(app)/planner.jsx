import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Platform, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import { Stack } from 'expo-router';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';

const DEFAULT_LOCATION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const Planner = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('cycling');
  const [showSearchFields, setShowSearchFields] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [key, setKey] = useState(0);
  const mapRef = useRef(null);

  const checkLocationServices = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openLocationSettings }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getCurrentLocation = async (retryCount = 0) => {
    try {
      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000,
      });
      
      console.log('Location received:', location);
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLocationError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      if (retryCount < 3) {
        setTimeout(() => getCurrentLocation(retryCount + 1), 2000);
      } else {
        try {
          const lastLocation = await Location.getLastKnownPositionAsync();
          if (lastLocation) {
            setCurrentLocation({
              latitude: lastLocation.coords.latitude,
              longitude: lastLocation.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
            return;
          }
        } catch (e) {
          console.error('Error getting last known location:', e);
        }
        setLocationError('Unable to get your location. Using default location.');
        setCurrentLocation(DEFAULT_LOCATION);
      }
    }
  };

  const handleZoom = (zoomIn) => {
    if (!mapRef.current) return;

    mapRef.current.getCamera().then((camera) => {
      camera.zoom += zoomIn ? 1 : -1;
      mapRef.current.animateCamera(camera, { duration: 100 });
    });
  };

  // Clear route when locations change
  useEffect(() => {
    setRouteCoordinates([]);
  }, [startLocation, endLocation]);

  // Fetch directions when locations are set
  useEffect(() => {
    if (startLocation && endLocation) {
      fetchDirections();
    }
  }, [startLocation, endLocation, waypoints, selectedActivity]);

  const fetchDirections = async () => {
    if (!startLocation || !endLocation) {
      console.log('Missing start or end location');
      return;
    }

    try {
      console.log('Fetching directions with:');
      console.log('Start:', startLocation);
      console.log('End:', endLocation);

      const origin = `${startLocation.latitude},${startLocation.longitude}`;
      const destination = `${endLocation.latitude},${endLocation.longitude}`;
      
      let waypointsString = '';
      if (waypoints.length > 0) {
        waypointsString = '&waypoints=' + waypoints
          .filter(wp => wp.location)
          .map(wp => `${wp.location.latitude},${wp.location.longitude}`)
          .join('|');
      }

      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsString}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes || !data.routes[0]) {
        console.error('Directions API error:', data);
        Alert.alert('Error', 'Failed to get route directions');
        return;
      }

      const route = data.routes[0];
      // Use mapbox polyline decoder
      const decodedPoints = polyline.decode(route.overview_polyline.points);
      
      // Convert to the format react-native-maps expects
      const coordinates = decodedPoints.map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));

      console.log('Route coordinates sample:', [
        coordinates[0],
        coordinates[Math.floor(coordinates.length / 2)],
        coordinates[coordinates.length - 1]
      ]);

      setRouteCoordinates(coordinates);

      // Show route info
      if (route.legs && route.legs[0]) {
        const { distance, duration } = route.legs[0];
        const activityDuration = calculateActivityDuration(
          distance.value,
          selectedActivity
        );
        
        Alert.alert(
          'Route Information',
          `Distance: ${distance.text}\nEstimated ${selectedActivity} time: ${activityDuration}`
        );
      }

      // Fit map to show the entire route
      if (mapRef.current) {
        const allCoords = [startLocation, ...coordinates, endLocation];
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      }

    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to process route request');
    }
  };

  const calculateActivityDuration = (distanceInMeters, activity) => {
    const distanceInKm = distanceInMeters / 1000;
    let speedKmH;
    
    // Average speeds
    if (activity === 'cycling') {
      speedKmH = 15; // Average cycling speed
    } else {
      speedKmH = 5; // Average walking speed
    }

    const hours = distanceInKm / speedKmH;
    const hoursInt = Math.floor(hours);
    const minutes = Math.round((hours - hoursInt) * 60);

    if (hoursInt === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hoursInt} hour${hoursInt > 1 ? 's' : ''}`;
    } else {
      return `${hoursInt} hour${hoursInt > 1 ? 's' : ''} ${minutes} minutes`;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints, { id: Date.now(), location: null }]);
  };

  const removeWaypoint = (id) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
  };

  useEffect(() => {
    (async () => {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this feature. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openLocationSettings }
          ]
        );
        setCurrentLocation(DEFAULT_LOCATION);
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (servicesEnabled) {
        getCurrentLocation();
      } else {
        setCurrentLocation(DEFAULT_LOCATION);
      }
    })();
  }, []);

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
        loadingEnabled={true}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2563eb"
            strokeWidth={3}
            geodesic={true}
          />
        )}
        
        {startLocation && (
          <Marker
            coordinate={startLocation}
            title="Start"
            pinColor="green"
          />
        )}
        
        {endLocation && (
          <Marker
            coordinate={endLocation}
            title="Destination"
            pinColor="red"
          />
        )}
        
        {waypoints.map((waypoint, index) => (
          waypoint.location && (
            <Marker
              key={waypoint.id}
              coordinate={waypoint.location}
              title={`Waypoint ${index + 1}`}
              pinColor="blue"
            />
          )
        ))}
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity 
          style={styles.zoomButton} 
          onPress={() => handleZoom(true)}
        >
          <MaterialIcons name="add" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.zoomButton} 
          onPress={() => handleZoom(false)}
        >
          <MaterialIcons name="remove" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {locationError && (
        <TouchableOpacity 
          style={styles.errorContainer} 
          onPress={openLocationSettings}
        >
          <Text style={styles.errorText}>{locationError}</Text>
          <Text style={styles.errorSubtext}>Tap to open settings</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        {!showSearchFields ? (
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => setShowSearchFields(true)}
          >
            <Text style={styles.searchText}>Where do you want to go?</Text>
            <TouchableOpacity 
              style={styles.activityIcon}
              onPress={() => {
                setSelectedActivity(selectedActivity === 'cycling' ? 'running' : 'cycling');
              }}
            >
              <FontAwesome5 
                name={selectedActivity === 'cycling' ? 'bicycle' : 'running'} 
                size={20} 
                color="#059669"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <View style={styles.searchFieldsContainer}>
            <GooglePlacesAutocomplete
              placeholder="Starting point"
              onPress={(data, details = null) => {
                if (details) {
                  setStartLocation({
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                  });
                }
              }}
              fetchDetails={true}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
                components: 'country:lk',
              }}
              styles={autocompleteStyles}
              enablePoweredByContainer={false}
              debounce={200}
              minLength={1}
              textInputProps={{
                placeholderTextColor: '#666',
              }}
              onFail={error => console.error(error)}
              keyboardShouldPersistTaps="handled"
              listViewDisplayed="auto"
            />
            
            <GooglePlacesAutocomplete
              placeholder="Where to?"
              onPress={(data, details = null) => {
                if (details) {
                  setEndLocation({
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                  });
                }
              }}
              fetchDetails={true}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
                components: 'country:lk',
              }}
              styles={autocompleteStyles}
              enablePoweredByContainer={false}
              debounce={200}
              minLength={1}
              textInputProps={{
                placeholderTextColor: '#666',
              }}
              onFail={error => console.error(error)}
              keyboardShouldPersistTaps="handled"
              listViewDisplayed="auto"
            />

            {waypoints.map((waypoint, index) => (
              <View key={waypoint.id} style={styles.waypointContainer}>
                <View style={styles.waypointAutocompleteContainer}>
                  <GooglePlacesAutocomplete
                    placeholder={`Waypoint ${index + 1}`}
                    onPress={(data, details = null) => {
                      if (details) {
                        const newWaypoints = [...waypoints];
                        newWaypoints[index] = {
                          ...waypoint,
                          location: {
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                          }
                        };
                        setWaypoints(newWaypoints);
                      }
                    }}
                    fetchDetails={true}
                    query={{
                      key: GOOGLE_MAPS_API_KEY,
                      language: 'en',
                      components: 'country:lk',
                    }}
                    styles={{
                      ...autocompleteStyles,
                      container: {
                        ...autocompleteStyles.container,
                        flex: 1,
                        marginTop: 0,
                      },
                    }}
                    enablePoweredByContainer={false}
                    debounce={200}
                    minLength={1}
                    textInputProps={{
                      placeholderTextColor: '#666',
                    }}
                    onFail={error => console.error(error)}
                    keyboardShouldPersistTaps="handled"
                    listViewDisplayed="auto"
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeWaypointButton}
                  onPress={() => removeWaypoint(waypoint.id)}
                >
                  <MaterialIcons name="remove-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addWaypointButton} onPress={addWaypoint}>
              <MaterialIcons name="add-circle" size={24} color="#059669" />
              <Text style={styles.addWaypointText}>Add waypoint</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchText: {
    flex: 1,
    color: '#666',
    fontSize: 16,
  },
  activityIcon: {
    padding: 5,
  },
  searchFieldsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  waypointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  waypointAutocompleteContainer: {
    flex: 1,
  },
  removeWaypointButton: {
    marginLeft: 10,
    padding: 5,
  },
  addWaypointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
  },
  addWaypointText: {
    marginLeft: 5,
    color: '#059669',
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  errorSubtext: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
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
});

const autocompleteStyles = {
  container: {
    flex: 0,
    marginTop: 10,
  },
  textInput: {
    height: 40,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  row: {
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#c8c7cc',
  },
  description: {
    fontSize: 15,
  },
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
};

export default Planner;