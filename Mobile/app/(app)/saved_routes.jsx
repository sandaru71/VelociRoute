import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { auth } from '../../firebase/config';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

const SavedRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRefs = useRef({});

  useEffect(() => {
    fetchSavedRoutes();
  }, []);

  const fetchSavedRoutes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const token = await user.getIdToken();
      console.log('Making API request to:', `${API_URL}/api/saved-routes/user`);
      const response = await axios.get(`${API_URL}/api/saved-routes/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('Routes received:', response.data.routes.length);
        setRoutes(response.data.routes);
      }
    } catch (error) {
      console.error('Error fetching saved routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fitMapToCoordinates = (coordinates, mapRef) => {
    if (mapRef && coordinates && coordinates.length > 0) {
      mapRef.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Saved Routes' }} />
      <ScrollView style={styles.container}>
        {routes.map((route, index) => (
          <View key={route._id} style={styles.routeCard}>
            <Text style={styles.routeName}>{route.routeName}</Text>
            <View style={[styles.mapContainer, { width: width - 40 }]}>
              <MapView
                ref={ref => mapRefs.current[index] = ref}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: 6.9271,
                  longitude: 79.8612,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                onMapReady={() => {
                  if (route.coordinates && route.coordinates.length > 0) {
                    fitMapToCoordinates(route.coordinates, mapRefs.current[index]);
                  }
                }}
              >
                {route.coordinates && route.coordinates.length > 0 && (
                  <Polyline
                    coordinates={route.coordinates}
                    strokeColor="#FF0000"
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome5 name="route" size={20} color="#666" />
                <Text style={styles.statValue}>{route.distance}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="clock" size={20} color="#666" />
                <Text style={styles.statValue}>{route.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="tachometer-alt" size={20} color="#666" />
                <Text style={styles.statValue}>{route.avgSpeed}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="mountain" size={20} color="#666" />
                <Text style={styles.statValue}>{route.elevationGain} m</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    height: 200,
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
});

export default SavedRoutes;
