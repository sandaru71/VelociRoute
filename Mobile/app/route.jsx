import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import { Card, Surface } from 'react-native-paper';

const RouteScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [routeName, setRouteName] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Get route data from planner
  const routeCoordinates = params.routeCoordinates ? JSON.parse(params.routeCoordinates) : [];
  const routeDetails = params.routeDetails ? JSON.parse(params.routeDetails) : null;
  const elevationProfile = params.elevationProfile ? JSON.parse(params.elevationProfile) : [];
  const elevationGain = params.elevationGain || 0;
  const selectedActivity = params.selectedActivity || 'cycling';

  // Calculate map region from route coordinates
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
});

export default RouteScreen;
