import 'react-native-get-random-values';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Linking, 
  Platform, 
  Alert, 
  ScrollView, 
  Animated, 
  PanResponder,
  ActivityIndicator 
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import config from '../../../config';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';

const DEFAULT_LOCATION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MINIMIZED_HEIGHT = 80;
const HALF_HEIGHT = SCREEN_HEIGHT * 0.5;
const FULL_HEIGHT = SCREEN_HEIGHT * 0.9;

const API_BASE_URL = 'http://192.168.18.32:5000';

const Planner = () => {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('cycling');
  const [showSearchFields, setShowSearchFields] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDetails, setRouteDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const [elevationData, setElevationData] = useState({ totalGain: 0, profile: [] });
  const [routeConditions, setRouteConditions] = useState(null);
  const [isAnalyzingRoad, setIsAnalyzingRoad] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastGestureDy = useRef(0);
  const mapRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.setOffset(lastGestureDy.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, { dy }) => {
        translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        translateY.flattenOffset();
        const currentPosition = lastGestureDy.current + dy;

        // Determine which position to snap to based on velocity and position
        let snapPoint;
        if (vy > 0.5) { // Fast downward swipe
          snapPoint = SCREEN_HEIGHT - MINIMIZED_HEIGHT;
        } else if (vy < -0.5) { // Fast upward swipe
          snapPoint = SCREEN_HEIGHT - FULL_HEIGHT;
        } else {
          if (currentPosition > SCREEN_HEIGHT - MINIMIZED_HEIGHT - 50) {
            snapPoint = SCREEN_HEIGHT - MINIMIZED_HEIGHT;
          } else if (currentPosition > SCREEN_HEIGHT - HALF_HEIGHT) {
            snapPoint = SCREEN_HEIGHT - HALF_HEIGHT;
          } else {
            snapPoint = SCREEN_HEIGHT - FULL_HEIGHT;
          }
        }

        lastGestureDy.current = snapPoint;
        setIsScrollEnabled(snapPoint === SCREEN_HEIGHT - FULL_HEIGHT);
        setModalVisible(true); // Keep modal visible even when minimized

        Animated.spring(translateY, {
          toValue: snapPoint,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

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

  const calculateElevationGain = async (coordinates) => {
    try {
      // Sample points along the route (max 512 points per API call)
      const sampledPoints = coordinates.filter((_, index) => index % Math.ceil(coordinates.length / 500) === 0);
      
      // Create locations string for API call
      const locations = sampledPoints
        .map(coord => `${coord.latitude},${coord.longitude}`)
        .join('|');

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/elevation/json?locations=${locations}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        let totalGain = 0;
        let prevElevation = data.results[0].elevation;

        // Calculate total elevation gain
        for (let i = 1; i < data.results.length; i++) {
          const currentElevation = data.results[i].elevation;
          const difference = currentElevation - prevElevation;
          
          if (difference > 0) {
            totalGain += difference;
          }
          
          prevElevation = currentElevation;
        }

        // Store elevation profile data
        const elevationProfile = data.results.map(point => point.elevation);
        setElevationData({ totalGain: Math.round(totalGain), profile: elevationProfile });
        return { totalGain: Math.round(totalGain), profile: elevationProfile };
      }
      return { totalGain: 0, profile: [] };
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      return { totalGain: 0, profile: [] };
    }
  };

  const fetchDirections = async () => {
    if (!startLocation || !endLocation) {
      console.log('Missing start or end location');
      return;
    }

    try {
      console.log('Fetching directions with:');
      console.log('Start:', startLocation);
      console.log('End:', endLocation);
      console.log('Waypoints:', waypoints);

      const origin = `${startLocation.latitude},${startLocation.longitude}`;
      const destination = `${endLocation.latitude},${endLocation.longitude}`;
      
      let waypointsString = '';
      if (waypoints.length > 0) {
        waypointsString = '&waypoints=' + waypoints
          .filter(wp => wp.location)
          .map(wp => `${wp.location.latitude},${wp.location.longitude}`)
          .join('|');
      }

      const travelMode = selectedActivity === 'cycling' ? 'BICYCLING' : 'WALKING';
      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsString}&mode=${travelMode}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes || !data.routes[0]) {
        console.error('Directions API error:', data);
        Alert.alert('Error', 'Failed to get route directions. Please try a different route or mode of transport.');
        return;
      }

      const route = data.routes[0];
      const decodedPoints = polyline.decode(route.overview_polyline.points);
      
      const coordinates = decodedPoints.map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));

      setRouteCoordinates(coordinates);
      setRouteDetails(route);
      showRouteDetails();

      // Calculate elevation gain after getting route
      const elevationResult = await calculateElevationGain(coordinates);
      setElevationData({ totalGain: elevationResult.totalGain, profile: elevationResult.profile });
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to process route request');
    }
  };

  const showRouteDetails = () => {
    setModalVisible(true);
    lastGestureDy.current = SCREEN_HEIGHT - HALF_HEIGHT;
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT - HALF_HEIGHT,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const minimizeModal = () => {
    lastGestureDy.current = SCREEN_HEIGHT - MINIMIZED_HEIGHT;
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT - MINIMIZED_HEIGHT,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  useEffect(() => {
    if (routeDetails) {
      showRouteDetails();
    }
  }, [routeDetails, waypoints]); // Added waypoints dependency

  const calculateAverageSpeed = (activity) => {
    return activity === 'cycling' ? 15 : 5; // 15 km/h for cycling, 5 km/h for walking
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

  const RouteDetailsModal = () => {
    if (!routeDetails || !routeDetails.legs) return null;

    // Calculate total distance and duration across all legs
    const totalDistance = {
      text: routeDetails.legs.reduce((total, leg) => total + leg.distance.value, 0),
      value: routeDetails.legs.reduce((total, leg) => total + leg.distance.value, 0)
    };
    totalDistance.text = `${(totalDistance.value / 1000).toFixed(1)} km`;

    const activityDuration = calculateActivityDuration(totalDistance.value, selectedActivity);
    const averageSpeed = calculateAverageSpeed(selectedActivity);

    const currentPosition = -translateY._value;
    const isMinimized = currentPosition <= SCREEN_HEIGHT - MINIMIZED_HEIGHT - 50;

    return (
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.modalHandle} />
        
        {/* Minimized View */}
        <View style={[
          styles.minimizedContent,
          isMinimized ? styles.minimizedContentActive : null
        ]}>
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>
          <View style={styles.minimizedMetrics}>
            <View style={styles.routeMetric}>
              <MaterialIcons name="directions" size={20} color="#4A90E2" />
              <Text style={styles.minimizedText}>{totalDistance.text}</Text>
            </View>
            <View style={styles.routeMetric}>
              <MaterialIcons name="timer" size={20} color="#4A90E2" />
              <Text style={styles.minimizedText}>{activityDuration}</Text>
            </View>
          </View>
        </View>

        {/* Expanded View */}
        <ScrollView 
          style={styles.expandedContent}
          scrollEnabled={isScrollEnabled}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.routeSummary}>
            {/* Distance */}
            <View style={styles.routeMetricExpanded}>
              <MaterialIcons name="directions" size={24} color="#4A90E2" />
              <View style={styles.metricTextContainer}>
                <Text style={styles.metricLabel}>Distance</Text>
                <Text style={styles.metricValue}>{totalDistance.text}</Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.routeMetricExpanded}>
              <MaterialIcons name="timer" size={24} color="#4A90E2" />
              <View style={styles.metricTextContainer}>
                <Text style={styles.metricLabel}>Est. Time</Text>
                <Text style={styles.metricValue}>{activityDuration}</Text>
              </View>
            </View>

            {/* Average Speed */}
            <View style={styles.routeMetricExpanded}>
              <MaterialIcons name="speed" size={24} color="#4A90E2" />
              <View style={styles.metricTextContainer}>
                <Text style={styles.metricLabel}>Avg Speed</Text>
                <Text style={styles.metricValue}>{averageSpeed} km/h</Text>
              </View>
            </View>

            {/* Elevation Gain */}
            <View style={styles.routeMetricExpanded}>
              <MaterialIcons name="terrain" size={24} color="#4A90E2" />
              <View style={styles.metricTextContainer}>
                <Text style={styles.metricLabel}>Elevation Gain</Text>
                <Text style={styles.metricValue}>{elevationData.totalGain} m</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.directionsTitle}>Turn-by-turn directions</Text>
          {routeDetails.legs[0].steps.map((step, index) => (
            <View key={index} style={styles.directionStep}>
              <View style={styles.stepIconContainer}>
                <MaterialIcons 
                  name={getDirectionIcon(step.maneuver)} 
                  size={20} 
                  color="#4A90E2" 
                />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepText}>{step.html_instructions.replace(/<[^>]*>/g, '')}</Text>
                <Text style={styles.stepDistance}>{step.distance.text}</Text>
              </View>
            </View>
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>
    );
  };

  const getDirectionIcon = (maneuver) => {
    const iconMap = {
      'turn-right': 'turn-right',
      'turn-left': 'turn-left',
      'straight': 'straight',
      'roundabout-left': 'rotate-left',
      'roundabout-right': 'rotate-right',
      'uturn-left': 'turn-left',
      'uturn-right': 'turn-right',
      'merge': 'merge',
      'fork-left': 'turn-slight-left',
      'fork-right': 'turn-slight-right',
      'ramp-left': 'turn-slight-left',
      'ramp-right': 'turn-slight-right',
    };
    return iconMap[maneuver] || 'directions';
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

  const analyzeRoadConditions = async () => {
    console.log('analyzeRoadConditions function called. Starting analysis...');

    if (!routeCoordinates.length) {
      console.log('No route coordinates found.')
      Alert.alert(
        "No Route Selected",
        "Please set a route before analyzing road conditions."
      );
      return;
    }

    if (!routeDetails) {
      console.log('No route details found.')
      Alert.alert(
        "No Route Details",
        "Please set a route before analyzing road conditions."
      );
      return;
    }

    console.log('Route validation passed, starting analysis...');
    console.log('Route coordinates:', routeCoordinates);
    console.log('Route details:', routeDetails);

    setIsAnalyzingRoad(true);
    try {
      console.log('Starting road analysis...');

      const totalDistanceMeters = routeDetails.legs.reduce((total, leg) => total + leg.distance.value, 0);
      const totalDistanceKm = totalDistanceMeters / 1000;
      console.log('Total route distance in km: ', totalDistanceKm);

      const SAMPLING_INTERVAL_KM = 1; // 1 km intervals
      const numPoints = Math.max(2, Math.ceil(totalDistanceKm / SAMPLING_INTERVAL_KM));
      console.log(`Will analyze ${numPoints} points along the route (one every ${SAMPLING_INTERVAL_KM} km)`);

      const selectedCoords = [];
      let accumulatedDistance = 0;
      let currentKilometer = 0;
      let prevCoord = routeCoordinates[0];

      selectedCoords.push({
        coord: routeCoordinates[0],
        distanceKm: 0
      });

      for (let i=1; i < routeCoordinates.length; i++) {
        const coord = routeCoordinates[i];
        const segmentDistance = calculateHaversineDistance(
          prevCoord.latitude,
          prevCoord.longitude,
          coord.latitude,
          coord.longitude
        );

        accumulatedDistance += segmentDistance;

        while (accumulatedDistance >= (currentKilometer + SAMPLING_INTERVAL_KM) && currentKilometer < totalDistanceKm) {
          currentKilometer += SAMPLING_INTERVAL_KM;

          const ratio = (currentKilometer - (accumulatedDistance - segmentDistance)) / segmentDistance;
          const interpolatedCoord = {
            latitude: prevCoord.latitude + (coord.latitude - prevCoord.latitude) * ratio,
            longitude: prevCoord.longitude + (coord.longitude - prevCoord.longitude) * ratio
          };
          selectedCoords.push({
            coord: interpolatedCoord,
            distanceKm: currentKilometer
          });
        }
        prevCoord = coord;
      }

      const lastPoint = routeCoordinates[routeCoordinates.length - 1];
      if (totalDistanceKm - currentKilometer > 0.1) {
        selectedCoords.push({
          coord: lastPoint,
          distanceKm: totalDistanceKm
        });
      }

      console.log('Selected coordinates for analysis:', selectedCoords);

      const images = await Promise.all(
        selectedCoords.map(async({coord, distance}, index) => {
          console.log(`Processing point ${index}: `, {
            coordinates: coord,
            distanceKm: distance
          });

          const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${coord.latitude},${coord.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
          return {
            url: imageUrl,
            kilometer: distance
          };
        })
      );

      console.log('Preparing request...');

      const requestBody = {
        route: {
         coordinates: selectedCoords.map(({coord}) => ({
            latitude: coord.latitude,
            longitude: coord.longitude
          }))
        }
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      console.log('Sending request to backend...');
      const apiUrl = `${config.API_URL}/api/road-conditions/analyze`;
      console.log('API URL:', apiUrl);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Response received from backend');
        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status} - ${responseText}`);
        }

        let analysis;
        try {
          analysis = JSON.parse(responseText);
          console.log('Parsed analysis:', analysis);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          throw new Error('Invalid response from backend');
        }

        if (analysis.error) {
          throw new Error(`Backend error: ${analysis.error}`);
        }

        setRouteConditions(analysis);
        console.log('Analysis complete. Displaying message to user...');

        const conditionCounts = {};
        if (analysis.points && analysis.points.length > 0) {
          analysis.points.forEach(point => {
            if (point.conditions) {
              console.log('Point Condition:', point.conditions);
              const condition = point.conditions;
              conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
            }
          });
        } 
        
        const formattedConditions = Object.entries(conditionCounts).map(([condition, count]) => {
          const formattedCondition = condition.split('_').map(word => word.charAt(0).toUpperCase + word.slice(1).toLowerCase()).join(' ');
          
          const total = Object.values(conditionCounts).reduce((a, b) => a + b, 0);
          const percentage = ((count / total) * 100).toFixed(1);
          return `${formattedCondition} - ${percentage}%`;
        })
        .join('\n');

        Alert.alert(
          "Road Analysis Completed",
          `${analysis.message}\n\n${formattedConditions}`,
          [{ text: "OK" }]
        );
      } catch (error) {
        console.error('Error during ML service request:', error);
        Alert.alert(
          "Road Analysis Failed",
          `Unable to analyze road conditions: ${error.message}. Please try again later.`,
          [{ text: "OK" }]
        );
      } finally {
        setIsAnalyzingRoad(false);
      }
    } catch (error) {
      console.error('Error in analyzeRoadConditions:', error);
      Alert.alert(
        "Road Analysis Failed",
        "Unable to analyze road conditions. Please try again later.",
        [{ text: "OK" }]
      );
      setIsAnalyzingRoad(false);
    }
  };

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const renderRoadConditions = () => {
    if (!routeConditions) return null;

    return (
      <View style={styles.roadConditionsContainer}>
        <Text style={styles.sectionTitle}>Road Conditions</Text>
        <Text style={styles.conditionSummary}>{routeConditions.summary}</Text>
        
        {routeConditions.points.map((point, index) => (
          <View key={index} style={styles.conditionPoint}>
            <Text style={styles.kilometerText}>KM {point.kilometer}</Text>
            {point.conditions && (
              <View style={styles.conditionDetails}>
                <Text style={styles.conditionText}>
                  {point.conditions.condition} 
                  ({Math.round(point.conditions.confidence * 100)}% confidence)
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {routeConditions.unavailablePoints.length > 0 && (
          <Text style={styles.unavailableText}>
            Note: Road condition data unavailable for {routeConditions.unavailablePoints.length} points along the route
          </Text>
        )}
      </View>
    );
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
      <Stack.Screen
        options={{
          title: 'Plan Route',
          headerShown: false,
        }}
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation || DEFAULT_LOCATION}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4A90E2"
            strokeWidth={3}
          />
        )}
        {startLocation && (
          <Marker
            coordinate={startLocation}
            pinColor="green"
            title="Start"
          />
        )}
        {endLocation && (
          <Marker
            coordinate={endLocation}
            pinColor="red"
            title="End"
          />
        )}
        {waypoints.map((waypoint, index) => 
          waypoint.location && (
            <Marker
              key={waypoint.id}
              coordinate={waypoint.location}
              pinColor="blue"
              title={`Waypoint ${index + 1}`}
            />
          )
        )}
      </MapView>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => {
          if (!routeCoordinates.length || !routeDetails) {
            Alert.alert('Error', 'Please create a route first');
            return;
          }
          
          // Pass route data to the route screen
          router.push({
            pathname: '../../../route',
            params: {
              routeCoordinates: JSON.stringify(routeCoordinates),
              routeDetails: JSON.stringify(routeDetails),
              elevationProfile: JSON.stringify(elevationData.profile || []),
              elevationGain: elevationData.totalGain || 0,
              selectedActivity: selectedActivity,
              routeConditions: routeConditions ? JSON.stringify(routeConditions) : null
            }
          });
        }}
      >
        <View style={styles.saveButtonContent}>
          <Text style={styles.saveButtonText}>Save</Text>
          <Feather name="arrow-right-circle" size={20} color="#FFF" />
        </View>
      </TouchableOpacity>

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

      {/* Analyze road button */}
      {routeCoordinates.length > 0 && (
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            isAnalyzingRoad && styles.analyzeButtonDisabled
          ]}
          onPress={analyzeRoadConditions}
          disabled={isAnalyzingRoad}
        >
          {isAnalyzingRoad ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="analytics" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Analyze Road</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {modalVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHandle} />
          </View>
          
          <ScrollView
            style={styles.bottomSheetContent}
            scrollEnabled={isScrollEnabled}
            showsVerticalScrollIndicator={false}
          >
            {routeDetails && (
              <>
                {/* Existing route details */}
                <RouteDetailsModal />
                
                {/* Road conditions section */}
                {renderRoadConditions()}
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
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
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: FULL_HEIGHT,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  minimizedContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  minimizedContentActive: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  minimizedMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomPadding: {
    height: 40,
  },
  routeSummary: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeMetricExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTextContainer: {
    marginLeft: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  directionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  stepDistance: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  saveButton: {
    position: 'absolute',
    right: 20,
    bottom: 120, // Increased from 100 to 120 to move button higher
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  analyzeButton: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  roadConditionsContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  conditionSummary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  conditionPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kilometerText: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  conditionDetails: {
    flex: 1,
  },
  conditionText: {
    fontSize: 14,
    color: '#333',
  },
  unavailableText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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