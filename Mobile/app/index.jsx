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
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import MapView, { Polyline, Marker } from 'react-native-maps';
import GpxParser from 'gpxparser';

// Configure axios base URL
const API_BASE_URL = 'http://localhost:3000/api';
axios.defaults.baseURL = API_BASE_URL;

const { width } = Dimensions.get('window');

const activityTypes = ['All', 'Cycling', 'Running', 'Hiking', 'Walking'];
const difficultyLevels = ['All', 'Easy', 'Moderate', 'Hard', 'Expert'];

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

const RouteMapModal = ({ visible, onClose, mapUrl }) => {
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (visible && mapUrl) {
      fetchAndParseGpx();
    }
  }, [visible, mapUrl]);

  const fetchAndParseGpx = async () => {
    try {
      setLoading(true);
      const response = await axios.get(mapUrl);
      const gpx = new GpxParser();
      gpx.parse(response.data);

      const coordinates = gpx.tracks[0].points.map(point => ({
        latitude: point.lat,
        longitude: point.lon,
      }));

      setRouteCoordinates(coordinates);

      // Calculate the center point and delta for the map region
      if (coordinates.length > 0) {
        const latitudes = coordinates.map(coord => coord.latitude);
        const longitudes = coordinates.map(coord => coord.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        
        // Add some padding to the deltas
        const latDelta = (maxLat - minLat) * 1.5;
        const lonDelta = (maxLon - minLon) * 1.5;
        
        setRegion({
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: Math.max(latDelta, 0.02),
          longitudeDelta: Math.max(lonDelta, 0.02),
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching GPX:', error);
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading route...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={region}
            showsUserLocation={true}
          >
            {routeCoordinates.length > 0 && (
              <>
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#FF0000"
                  strokeWidth={3}
                />
                <Marker
                  coordinate={routeCoordinates[0]}
                  title="Start"
                  pinColor="green"
                />
                <Marker
                  coordinate={routeCoordinates[routeCoordinates.length - 1]}
                  title="End"
                  pinColor="red"
                />
              </>
            )}
          </MapView>
        )}
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

  useEffect(() => {
    fetchRoutes();
  }, [selectedActivity, selectedDifficulty, distanceRange, location]);

  const fetchRoutes = async () => {
    try {
      let queryParams = new URLSearchParams();
      if (selectedActivity !== 'All') queryParams.append('activityType', selectedActivity.toLowerCase());
      if (selectedDifficulty !== 'All') queryParams.append('difficulty', selectedDifficulty.toLowerCase());
      if (distanceRange.min) queryParams.append('minDistance', distanceRange.min);
      if (distanceRange.max) queryParams.append('maxDistance', distanceRange.max);
      if (location) queryParams.append('location', location);

      const response = await axios.get(`/popular-routes?${queryParams}`);
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      // Fallback to dummy data for now
      setRoutes([
        {
          id: '1',
          name: 'Scenic Mountain Trail',
          activity: 'Cycling',
          difficulty: 'Moderate',
          distance: '15.5 km',
          time: '2h 00m',
          elevation: '750m',
          images: ['https://your-image-url.com'],
          location: 'Mountain View Park',
          mapUrl: 'https://your-map-url.com',
        },
        // Add more dummy routes as needed
      ]);
    }
  };

  const clearFilters = () => {
    setSelectedActivity('All');
    setSelectedDifficulty('All');
    setDistanceRange({ min: '', max: '' });
    setLocation('');
    setSearchText('');
  };

  const handleViewMap = (route) => {
    setSelectedRoute(route);
    setMapModalVisible(true);
  };

  const renderRouteCard = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.images[0] }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="directions-run" size={20} color="#666" />
            <Text style={styles.detailText}>{item.activityType}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="trending-up" size={20} color="#666" />
            <Text style={styles.detailText}>{item.difficulty}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="straighten" size={20} color="#666" />
            <Text style={styles.detailText}>{item.distance} km</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="timer" size={20} color="#666" />
            <Text style={styles.detailText}>{Math.floor(item.averageTime / 60)}h {item.averageTime % 60}m</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="height" size={20} color="#666" />
            <Text style={styles.detailText}>{item.elevation}m</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewMapButton}
          onPress={() => handleViewMap(item)}
        >
          <MaterialIcons name="map" size={20} color="#fff" />
          <Text style={styles.viewMapButtonText}>View Route Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>VelociRoute</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setActivityModalVisible(true)}
          >
            <Text style={styles.filterText}>Activity: {selectedActivity}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setDifficultyModalVisible(true)}
          >
            <Text style={styles.filterText}>Difficulty: {selectedDifficulty}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.distanceContainer}>
            <TextInput
              style={styles.distanceInput}
              placeholder="Min km"
              value={distanceRange.min}
              onChangeText={(text) => setDistanceRange({ ...distanceRange, min: text })}
              keyboardType="numeric"
            />
            <Text style={styles.distanceSeparator}>-</Text>
            <TextInput
              style={styles.distanceInput}
              placeholder="Max km"
              value={distanceRange.max}
              onChangeText={(text) => setDistanceRange({ ...distanceRange, max: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Routes List */}
      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.routesList}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  navbar: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 15, 
    backgroundColor: '#fbc02d', 
    alignItems: 'center' 
  },
  logo: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  searchContainer: { 
    padding: 15, 
    backgroundColor: '#fff' 
  },
  searchInput: { 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 15, 
    fontSize: 16, 
    width: '100%',
  },
  filterContainer: { 
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 5 
  },
  filterButton: { 
    padding: 12, 
    backgroundColor: '#fbc02d', 
    borderRadius: 15, 
    width: width * 0.4, 
    alignItems: 'center' 
  },
  filterText: { 
    fontSize: 16, 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  distanceInput: {
    width: width * 0.4,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    fontSize: 16,
  },
  distanceSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
  clearButton: { 
    marginTop: 10, 
    padding: 10, 
    backgroundColor: '#ff5252', 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  clearText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  routesList: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
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
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  viewMapButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
