import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  TextInput, 
  FlatList,
  Modal,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
  BlurView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import MapView, { Polyline, Marker } from 'react-native-maps';

// Configure axios base URL and defaults
const API_BASE_URL = Platform.select({
  android: 'http://10.54.219.97:3000/api',
  ios: 'http://10.54.219.97:3000/api', // Your computer's IP address
  default: 'http://localhost:3000/api'
});

console.log('Using API URL:', API_BASE_URL); // Debug log

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  timeoutErrorMessage: 'Request timed out',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      message: error.message,
      code: error.code,
      config: error.config
    });
    throw error;
  }
);

const { width, height } = Dimensions.get('window');

const activityTypes = ['All', 'Cycling', 'Running', 'Hiking', 'Walking'];
const difficultyLevels = ['All', 'Easy', 'Moderate', 'Hard', 'Expert'];

// Simple GPX parser function
const parseGPX = (gpxContent) => {
  try {
    // Extract coordinates using regex
    const coordRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g;
    const coordinates = [];
    let match;

    while ((match = coordRegex.exec(gpxContent)) !== null) {
      coordinates.push({
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      });
    }

    if (coordinates.length === 0) {
      throw new Error('No coordinates found in GPX file');
    }

    // Calculate center point for initial region
    const centerPoint = coordinates[Math.floor(coordinates.length / 2)];
    
    return {
      coordinates,
      initialRegion: {
        latitude: centerPoint.latitude,
        longitude: centerPoint.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      startPoint: coordinates[0],
      endPoint: coordinates[coordinates.length - 1]
    };
  } catch (error) {
    console.error('GPX parsing error:', error);
    throw new Error('Failed to parse GPX file');
  }
};

const RouteMapModal = ({ visible, onClose, mapUrl }) => {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && mapUrl) {
      fetchAndParseGpx();
    }
  }, [visible, mapUrl]);

  const fetchAndParseGpx = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching GPX from:', mapUrl);
      const response = await axiosInstance.get(mapUrl);
      const data = parseGPX(response.data);
      
      console.log('GPX parsed successfully:', {
        coordinatesCount: data.coordinates.length,
        startPoint: data.startPoint,
        endPoint: data.endPoint
      });
      
      setRouteData(data);
    } catch (error) {
      console.error('Error fetching GPX:', error);
      setError('Failed to load route map');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={{ marginTop: 10 }}>Loading route map...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="error" size={48} color="#f44336" />
            <Text style={{ marginTop: 10, color: '#f44336' }}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={fetchAndParseGpx}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={routeData.initialRegion}
          >
            <Polyline
              coordinates={routeData.coordinates}
              strokeColor="#4CAF50"
              strokeWidth={3}
            />
            <Marker
              coordinate={routeData.startPoint}
              title="Start"
              pinColor="#4CAF50"
            />
            <Marker
              coordinate={routeData.endPoint}
              title="End"
              pinColor="#f44336"
            />
          </MapView>
        )}
      </View>
    </Modal>
  );
};

const FilterModal = ({ visible, onClose, title, options, selectedValue, onSelect }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.modalOption,
                selectedValue === option && styles.selectedOption,
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedValue === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const DashboardScreen = () => {
  const [routes, setRoutes] = useState([]);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [distanceRange, setDistanceRange] = useState({ min: '', max: '' });
  const [location, setLocation] = useState('');
  const [searchText, setSearchText] = useState('');
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, [selectedActivity, selectedDifficulty, distanceRange, location]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          let queryParams = new URLSearchParams();
          if (selectedActivity !== 'All') queryParams.append('activityType', selectedActivity.toLowerCase());
          if (selectedDifficulty !== 'All') queryParams.append('difficulty', selectedDifficulty.toLowerCase());
          if (distanceRange.min) queryParams.append('minDistance', distanceRange.min);
          if (distanceRange.max) queryParams.append('maxDistance', distanceRange.max);
          if (location) queryParams.append('location', location);

          console.log('Fetching routes with params:', queryParams.toString());
          const response = await axiosInstance.get(`popular-routes?${queryParams}`);  
          console.log('Routes fetched successfully:', response.data.length, 'routes');
          setRoutes(response.data);
          setLoading(false);
          return;
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt + 1} failed:`, error.message);
          if (attempt < maxRetries - 1) {
            console.log('Waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      setLoading(false);
      console.error('All attempts failed:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: () => fetchRoutes() }, { text: 'OK' }]
      );
    }
  };

  const handleViewMap = (route) => {
    setSelectedRoute(route);
    setMapModalVisible(true);
  };

  const renderRouteCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleViewMap(item)}
      activeOpacity={0.95}
    >
      <Image 
        source={{ uri: item.images[0] }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.activityBadge}>
            <MaterialIcons 
              name={
                item.activityType === 'cycling' ? 'directions-bike' :
                item.activityType === 'hiking' ? 'terrain' :
                item.activityType === 'walking' ? 'directions-walk' :
                'directions-run'
              } 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.activityText}>{item.activityType}</Text>
          </View>
        </View>
        
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons name="straighten" size={18} color="#fff" />
            <Text style={styles.statText}>{item.distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="timer" size={18} color="#fff" />
            <Text style={styles.statText}>
              {Math.floor(item.averageTime / 60)}h {item.averageTime % 60}m
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="height" size={18} color="#fff" />
            <Text style={styles.statText}>{item.elevation}m</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#fff" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, {
            backgroundColor: 
              item.difficulty === 'easy' ? '#4CAF50' :
              item.difficulty === 'moderate' ? '#FFA000' :
              item.difficulty === 'hard' ? '#F44336' :
              '#9C27B0'
          }]}>
            <Text style={styles.difficultyText}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setActivityModalVisible(true)}
        >
          <MaterialIcons name="directions-run" size={20} color="#666" />
          <Text style={styles.filterButtonText}>{selectedActivity}</Text>
          <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setDifficultyModalVisible(true)}
        >
          <MaterialIcons name="trending-up" size={20} color="#666" />
          <Text style={styles.filterButtonText}>{selectedDifficulty}</Text>
          <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRouteCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.routesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="landscape" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No routes found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        title="Select Activity"
        options={activityTypes}
        selectedValue={selectedActivity}
        onSelect={setSelectedActivity}
      />

      <FilterModal
        visible={difficultyModalVisible}
        onClose={() => setDifficultyModalVisible(false)}
        title="Select Difficulty"
        options={difficultyLevels}
        selectedValue={selectedDifficulty}
        onSelect={setSelectedDifficulty}
      />

      <RouteMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        mapUrl={selectedRoute?.mapUrl}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  routesList: {
    paddingVertical: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapModalHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DashboardScreen;