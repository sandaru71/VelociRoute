import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const GOOGLE_MAPS_API_KEY = 'AIzaSyB7alGuNMvdyAk8Tb0B2jG3KjnotL4fYqo';

const DEFAULT_LOCATION = {
  latitude: 6.9271,  // Default to Sri Lanka coordinates
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

  const checkLocationServices = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError('Location services are disabled. Please enable them in your device settings.');
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

  useEffect(() => {
    (async () => {
      console.log('Requesting location permission...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        setLocationError('Location permission was denied. Please enable it in settings.');
        setCurrentLocation(DEFAULT_LOCATION);
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setCurrentLocation(DEFAULT_LOCATION);
        return;
      }

      try {
        console.log('Getting current position...');
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeInterval: 5000,
          distanceInterval: 0,
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
        // Try with mock location for development
        console.log('Trying to get last known location...');
        try {
          let location = await Location.getLastKnownPositionAsync();
          if (location) {
            console.log('Last known location:', location);
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
            setLocationError(null);
            return;
          }
        } catch (e) {
          console.error('Error getting last known location:', e);
        }
        
        setLocationError('Unable to get your location. Using default location.');
        setCurrentLocation(DEFAULT_LOCATION);
      }
    })();
  }, []);

  const addWaypoint = () => {
    setWaypoints([...waypoints, null]);
  };

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
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentLocation}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="You are here"
        />
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
      </MapView>

      {locationError && (
        <TouchableOpacity 
          style={styles.errorContainer} 
          onPress={openLocationSettings}
        >
          <Text style={styles.errorText}>{locationError}</Text>
          <Text style={styles.errorSubtext}>Tap to open settings</Text>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
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
                setStartLocation({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
              }}
              styles={autocompleteStyles}
              fetchDetails={true}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
              }}
              enablePoweredByContainer={false}
            />
            
            <GooglePlacesAutocomplete
              placeholder="Destination"
              onPress={(data, details = null) => {
                setEndLocation({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
              }}
              styles={autocompleteStyles}
              fetchDetails={true}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
              }}
              enablePoweredByContainer={false}
            />

            <TouchableOpacity style={styles.addWaypointButton} onPress={addWaypoint}>
              <MaterialIcons name="add" size={24} color="#059669" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => {
          // TODO: Implement save functionality
          console.log('Save route');
        }}
      >
        <Text style={styles.saveButtonText}>Save Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fee2e2',
    padding: 10,
    alignItems: 'center',
    zIndex: 3,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
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
    borderRadius: 25,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addWaypointButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  saveButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const autocompleteStyles = {
  container: {
    flex: 0,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  listView: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 5,
  },
};

export default Planner;