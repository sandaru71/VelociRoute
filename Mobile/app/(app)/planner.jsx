import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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

  const addWaypoint = () => {
    setWaypoints([...waypoints, { id: Date.now(), location: null }]);
  };

  const removeWaypoint = (id) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
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
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
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