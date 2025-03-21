import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import { Card, Surface, Button, Modal, Portal, Dialog, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { TOMORROW_API_KEY } from '../config/keys';
import { ActivityIndicator } from 'react-native';
import { API_URL } from '../config';
import { auth } from '../firebase/config';

const RouteScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [routeName, setRouteName] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get route data from planner
  const routeCoordinates = params.routeCoordinates ? JSON.parse(params.routeCoordinates) : [];
  const routeDetails = params.routeDetails ? JSON.parse(params.routeDetails) : null;
  const elevationProfile = params.elevationProfile ? JSON.parse(params.elevationProfile) : [];
  const elevationGain = params.elevationGain || 0;
  const selectedActivity = params.selectedActivity || 'cycling';

  // Weather states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getWeatherIcon = (weatherCode) => {
    // Tomorrow.io weather codes
    switch (weatherCode) {
      case 1000: // Clear
        return { icon: 'sun', color: '#FFB300' };
      case 1100: // Mostly Clear
      case 1101: // Partly Cloudy
        return { icon: 'cloud-sun', color: '#78909C' };
      case 1102: // Mostly Cloudy
      case 1001: // Cloudy
        return { icon: 'cloud', color: '#78909C' };
      case 4000: // Drizzle
      case 4001: // Rain
        return { icon: 'cloud-rain', color: '#4FC3F7' };
      case 5000: // Snow
      case 5001: // Flurries
        return { icon: 'snowflake', color: '#90CAF9' };
      default:
        return { icon: 'sun', color: '#FFB300' };
    }
  };

  const getWeatherConditionText = (code) => {
    // Tomorrow.io weather codes to text
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

  const onDateChange = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    fetchWeatherData(date);
  };

  const fetchWeatherData = async (date) => {
    if (!routeCoordinates.length) return;
    
    setLoading(true);
    setError(null);
    const endPoint = routeCoordinates[routeCoordinates.length - 1];
    
    try {
      const response = await fetch(
        `https://api.tomorrow.io/v4/weather/forecast?location=${endPoint.latitude},${endPoint.longitude}&timesteps=1d&apikey=${TOMORROW_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Weather data not available');
      }

      const data = await response.json();
      
      if (!data.timelines || !data.timelines.daily) {
        throw new Error('Invalid weather data format');
      }

      const formattedDate = moment(date).format('YYYY-MM-DD');
      const forecast = data.timelines.daily.find(
        day => moment(day.time).format('YYYY-MM-DD') === formattedDate
      );

      if (forecast) {
        setWeatherData({
          temperature: forecast.values.temperatureAvg,
          condition: forecast.values.weatherCodeMax,
          humidity: forecast.values.humidityAvg,
          windSpeed: forecast.values.windSpeedAvg
        });
      } else {
        throw new Error('No forecast available for selected date');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError(error.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const getMapRegion = () => {
    if (routeCoordinates.length === 0) return null;

    let minLat = routeCoordinates[0].latitude;
    let maxLat = routeCoordinates[0].latitude;
    let minLng = routeCoordinates[0].longitude;
    let maxLng = routeCoordinates[0].longitude;

    routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const PADDING = 0.1;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + PADDING,
      longitudeDelta: (maxLng - minLng) + PADDING,
    };
  };

  const handleConfirmName = () => {
    if (routeName.trim()) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setIsEditing(false);
    }
  };

  const handleSaveRoute = async () => {
    try {
      setIsSaving(true);
      console.log('Starting route save process...');

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        setSnackbarMessage('Please log in to save routes');
        setSnackbarVisible(true);
        return;
      }

      // Get fresh token
      const token = await user.getIdToken(true); // Force refresh the token
      console.log('Got fresh user token');

      // Create form data
      const formData = new FormData();
      formData.append('routeName', routeName || 'Untitled Route');
      formData.append('distance', routeDetails?.legs?.[0]?.distance?.text || '0 km');
      formData.append('duration', routeDetails?.legs?.[0]?.duration?.text || '0 min');
      formData.append('avgSpeed', selectedActivity === 'cycling' ? '15 km/h' : '5 km/h');
      formData.append('elevationGain', elevationGain.toString());

      // Create GPX string
      const gpxString = generateGPX(routeCoordinates, routeName || 'Untitled Route');
      console.log('Generated GPX string');

      // Create GPX file blob
      const gpxBlob = new Blob([gpxString], { type: 'application/gpx+xml' });
      const gpxFile = {
        uri: Platform.OS === 'android' ? 'gpx-uri' : 'gpx-uri',
        name: `${(routeName || 'route').replace(/\s+/g, '_')}.gpx`,
        type: 'application/gpx+xml'
      };
      formData.append('gpxData', gpxFile);

      // Create elevation profile image (placeholder for now)
      const elevationFile = {
        uri: Platform.OS === 'android' ? 'elevation-uri' : 'elevation-uri',
        name: `${(routeName || 'route').replace(/\s+/g, '_')}_elevation.png`,
        type: 'image/png'
      };
      formData.append('elevationProfileImage', elevationFile);

      console.log('Form data prepared');
      console.log('Sending request to:', `${API_URL}/api/saved-routes/save`);

      const response = await fetch(`${API_URL}/api/saved-routes/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Save route response:', result);

      if (result.success) {
        setSnackbarMessage('Route saved successfully!');
      } else {
        setSnackbarMessage(result.message || 'Failed to save route. Please try again.');
      }
      setSnackbarVisible(true);

    } catch (error) {
      console.error('Error saving route:', error);
      setSnackbarMessage('Error saving route. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const generateGPX = (coordinates, name) => {
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="VelociRoute">\n' +
      `<trk><name>${name}</name><trkseg>\n`;

    const points = coordinates.map(coord => 
      `<trkpt lat="${coord.latitude}" lon="${coord.longitude}"></trkpt>`
    ).join('\n');

    const footer = '\n</trkseg></trk></gpx>';
    return header + points + footer;
  };

  const convertChartToImage = async () => {
    // This is a placeholder - in a real implementation, you'd use something like
    // react-native-view-shot to capture the chart as an image
    return '';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Save Route',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#000"
              style={{ marginLeft: 16 }}
              onPress={() => router.back()}
            />
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
        }}
      />

      <ScrollView style={styles.scrollContainer}>
        {/* Route Name Input/Display */}
        <Surface style={styles.nameContainer} elevation={1}>
          {isEditing ? (
            <View style={styles.nameInputWrapper}>
              <TextInput
                style={styles.nameInput}
                placeholder="Name your route"
                placeholderTextColor="#666"
                value={routeName}
                onChangeText={setRouteName}
                maxLength={50}
                autoCapitalize="words"
              />
              {routeName.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmName}
                >
                  <MaterialIcons name="check-circle" size={28} color="#4A90E2" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Animated.View style={[styles.nameDisplay, { opacity: fadeAnim }]}>
              <Text style={styles.nameDisplayText}>{routeName}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={20} color="#666" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Surface>

        {/* Route Map Preview */}
        <Card style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={getMapRegion()}
          >
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#4A90E2"
                strokeWidth={3}
              />
            )}
            {routeCoordinates.length > 0 && (
              <>
                <Marker
                  coordinate={routeCoordinates[0]}
                  pinColor="green"
                  title="Start"
                />
                <Marker
                  coordinate={routeCoordinates[routeCoordinates.length - 1]}
                  pinColor="red"
                  title="End"
                />
              </>
            )}
          </MapView>
        </Card>

        {/* Route Information */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>
                {routeDetails?.legs?.[0]?.distance?.text || '0 km'}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {routeDetails?.legs?.[0]?.duration?.text || '0 min'}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Avg Speed</Text>
              <Text style={styles.statValue}>
                {selectedActivity === 'cycling' ? '15 km/h' : '5 km/h'}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Elevation Gain</Text>
              <Text style={styles.statValue}>{elevationGain} m</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Elevation Chart */}
        {elevationProfile.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Title title="Elevation Profile" />
            <Card.Content>
              <LineChart
                data={{
                  labels: Array(6).fill('').map((_, i) => 
                    `${((i * (routeDetails?.legs?.[0]?.distance?.value || 0)) / 5000).toFixed(1)}km`
                  ),
                  datasets: [{
                    data: elevationProfile,
                    color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                    strokeWidth: 2
                  }]
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '3',
                    strokeWidth: '1',
                    stroke: '#5196f4'
                  },
                  formatYLabel: (value) => `${Math.round(value)}m`
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={false}
                segments={5}
              />
              <View style={styles.elevationLegend}>
                <Text style={styles.elevationLegendText}>Distance (km)</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Weather Section */}
        <Card style={styles.weatherCard}>
          <Card.Title title="Weather Forecast" />
          <Card.Content>
            <View style={styles.datePickerContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                icon="calendar"
                style={styles.dateButton}
              >
                {moment(selectedDate).format('MMM DD, YYYY')}
              </Button>
            </View>

            <Portal>
              <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
                <Dialog.Title>Select Date</Dialog.Title>
                <Dialog.Content>
                  <View style={styles.dialogContent}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {Array.from({ length: 15 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        return (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.dateOption,
                              moment(selectedDate).isSame(date, 'day') && styles.selectedDate
                            ]}
                            onPress={() => onDateChange(date)}
                          >
                            <Text style={[
                              styles.dateText,
                              moment(selectedDate).isSame(date, 'day') && styles.selectedDateText
                            ]}>
                              {moment(date).format('ddd')}
                            </Text>
                            <Text style={[
                              styles.dateNumber,
                              moment(selectedDate).isSame(date, 'day') && styles.selectedDateText
                            ]}>
                              {moment(date).format('D')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowDatePicker(false)}>Done</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading weather data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
                <Button 
                  mode="contained" 
                  onPress={() => fetchWeatherData(selectedDate)}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </View>
            ) : weatherData && (
              <View style={styles.weatherWidget}>
                <View style={styles.weatherIconContainer}>
                  <FontAwesome5
                    name={getWeatherIcon(weatherData.condition).icon}
                    size={48}
                    color={getWeatherIcon(weatherData.condition).color}
                  />
                </View>
                <View style={styles.weatherDetails}>
                  <Text style={styles.temperature}>
                    {Math.round(weatherData.temperature)}°C
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {getWeatherConditionText(weatherData.condition)}
                  </Text>
                  <Text style={styles.weatherSubtext}>
                    Humidity: {Math.round(weatherData.humidity)}%
                  </Text>
                  <Text style={styles.weatherSubtext}>
                    Wind: {Math.round(weatherData.windSpeed)} km/h
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Route Actions */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveRoute}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="bookmark" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Save Route</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {/* Delete functionality will be added later */}}
          >
            <MaterialIcons name="delete" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Route</Text>
          </TouchableOpacity>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}>
          {snackbarMessage}
        </Snackbar>

        {/* Add padding at the bottom */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  nameContainer: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  confirmButton: {
    padding: 4,
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  nameDisplayText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  mapCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    height: 250,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartCard: {
    margin: 16,
    borderRadius: 12,
    padding: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  elevationLegend: {
    alignItems: 'center',
    marginTop: 4,
  },
  elevationLegendText: {
    fontSize: 12,
    color: '#666',
  },
  weatherCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    width: '80%',
  },
  weatherWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  weatherIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherDetails: {
    flex: 2,
    paddingLeft: 16,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  weatherSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#4A90E2',
  },
  dialogContent: {
    paddingVertical: 10,
  },
  dateOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 60,
  },
  selectedDate: {
    backgroundColor: '#4A90E2',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateText: {
    color: '#fff',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});

export default RouteScreen;