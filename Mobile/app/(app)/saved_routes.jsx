import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { auth } from '../../firebase/config';
import { Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { TOMORROW_API_KEY } from '../../config/keys';

const { width } = Dimensions.get('window');

const SavedRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRefs = useRef({});
  const [selectedDates, setSelectedDates] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDatePickerRoute, setActiveDatePickerRoute] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [weatherLoading, setWeatherLoading] = useState({});

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
        
        // Initialize dates for all routes
        const initialDates = {};
        response.data.routes.forEach(route => {
          initialDates[route._id] = new Date();
        });
        setSelectedDates(initialDates);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode) => {
    switch (weatherCode) {
      case 1000: return { icon: 'sun', color: '#FFB300' };
      case 1100:
      case 1101: return { icon: 'cloud-sun', color: '#78909C' };
      case 1102:
      case 1001: return { icon: 'cloud', color: '#78909C' };
      case 4000:
      case 4001: return { icon: 'cloud-rain', color: '#4FC3F7' };
      case 5000:
      case 5001: return { icon: 'snowflake', color: '#90CAF9' };
      default: return { icon: 'sun', color: '#FFB300' };
    }
  };

  const getWeatherConditionText = (code) => {
    const conditions = {
      1000: 'Clear',
      1100: 'Mostly Clear',
      1101: 'Partly Cloudy',
      1102: 'Mostly Cloudy',
      1001: 'Cloudy',
      4000: 'Drizzle',
      4001: 'Rain',
      5000: 'Snow',
      5001: 'Flurries'
    };
    return conditions[code] || 'Clear';
  };

  const fetchWeatherData = async (routeId, coordinates, date) => {
    if (!coordinates || coordinates.length === 0) return;
    
    setWeatherLoading(prev => ({ ...prev, [routeId]: true }));
    const endPoint = coordinates[coordinates.length - 1];
    
    try {
      const response = await fetch(
        `https://api.tomorrow.io/v4/weather/forecast?location=${endPoint.latitude},${endPoint.longitude}&timesteps=1d&apikey=${TOMORROW_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Weather data not available');

      const data = await response.json();
      
      if (!data.timelines || !data.timelines.daily) {
        throw new Error('Invalid weather data format');
      }

      const formattedDate = moment(date).format('YYYY-MM-DD');
      const forecast = data.timelines.daily.find(
        day => moment(day.time).format('YYYY-MM-DD') === formattedDate
      );

      if (forecast) {
        setWeatherData(prev => ({
          ...prev,
          [routeId]: {
            temperature: forecast.values.temperatureAvg,
            condition: forecast.values.weatherCodeMax,
            humidity: forecast.values.humidityAvg,
            windSpeed: forecast.values.windSpeedAvg
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setWeatherLoading(prev => ({ ...prev, [routeId]: false }));
    }
  };

  const handleDateChange = (event, date, routeId) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDates(prev => ({ ...prev, [routeId]: date }));
      fetchWeatherData(routeId, routes.find(r => r._id === routeId)?.coordinates, date);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
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

            {/* Weather Section */}
            <View style={styles.weatherContainer}>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => {
                  setActiveDatePickerRoute(route._id);
                  setShowDatePicker(true);
                }}
              >
                <FontAwesome5 name="calendar-alt" size={20} color="#666" />
                <Text style={styles.dateText}>
                  {moment(selectedDates[route._id]).format('MMM DD, YYYY')}
                </Text>
              </TouchableOpacity>

              {weatherLoading[route._id] ? (
                <ActivityIndicator size="small" color="#f4511e" />
              ) : weatherData[route._id] ? (
                <View style={styles.weatherInfo}>
                  <View style={styles.weatherItem}>
                    <FontAwesome5
                      name={getWeatherIcon(weatherData[route._id].condition).icon}
                      size={20}
                      color={getWeatherIcon(weatherData[route._id].condition).color}
                    />
                    <Text style={styles.weatherText}>
                      {getWeatherConditionText(weatherData[route._id].condition)}
                    </Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <FontAwesome5 name="temperature-high" size={20} color="#FF6B6B" />
                    <Text style={styles.weatherText}>
                      {Math.round(weatherData[route._id].temperature)}°C
                    </Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <FontAwesome5 name="wind" size={20} color="#4A90E2" />
                    <Text style={styles.weatherText}>
                      {Math.round(weatherData[route._id].windSpeed)} m/s
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDates[activeDatePickerRoute] || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, activeDatePickerRoute)}
        />
      )}
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
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  weatherContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
});

export default SavedRoutes;
