import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import MapView, { Polyline, Marker } from "react-native-maps";
import axios from 'axios';
import { API_URL } from '../../config/';
import { auth } from '../../firebase/config';
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const activityIcons = {
  Running: 'running',
  Walking: 'walking',
  Cycling: 'bicycle',
  Hiking: 'hiking'
};

const ratingIcons = {
  Great: 'grin-beam',
  Good: 'smile',
  Average: 'meh',
  Poor: 'frown'
};

const difficultyIcons = {
  Easy: 'flag',
  Medium: 'flag-checkered',
  Hard: 'mountain'
};

function SavedActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedActivities();
  }, []);

  const fetchSavedActivities = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user logged in');
        setActivities([]);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/api/activities/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data) {
        setActivities([]);
        return;
      }

      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching saved activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return 'N/A';
    const km = (meters / 1000).toFixed(2);
    return `${km} km`;
  };

  const formatSpeed = (speedMps) => {
    if (!speedMps && speedMps !== 0) return 'N/A';
    const speedKph = (speedMps * 3.6).toFixed(1); // Convert m/s to km/h
    return `${speedKph} km/h`;
  };

  const formatElevation = (meters) => {
    if (!meters && meters !== 0) return 'N/A';
    return `${Math.round(meters)}m`;
  };

  const renderImages = (images) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
      {images.map((img, index) => (
        <Image key={index} source={{ uri: img }} style={styles.image} />
      ))}
    </ScrollView>
  );

  const renderMap = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return null;

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="#007bff"
          strokeWidth={4}
        />
        <Marker
          coordinate={coordinates[0]}
          title="Start"
          pinColor="green"
        />
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          title="End"
          pinColor="red"
        />
      </MapView>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.container}>
        {/* Activity type */}
        <Text style={styles.title}>{item.activityName}</Text>

        {/* Activity type, activity rating, and activity difficulty */}
        <View style={styles.detailsContainer}>
            <View style={styles.iconContainer}>
            <FontAwesome5 name={activityIcons[item.activityType] || 'question'} size={14} color="#666" />
            <Text style={styles.detailText}>{item.activityType}</Text>
            </View>

            <View style={styles.iconContainer}>
            <FontAwesome5 name={ratingIcons[item.rating] || 'meh'} size={14} color="#666" />
            <Text style={styles.detailText}>{item.rating}</Text>
            </View>

            <View style={styles.iconContainer}>
            <FontAwesome5 name={difficultyIcons[item.difficulty] || 'question'} size={14} color="#666" />
            <Text style={styles.detailText}>{item.difficulty}</Text>
            </View>
        </View>

        {/* Horizontal Media Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {(item.routeCoordinates || []).length >= 0 && (
                <View style={{ width: Dimensions.get('window').width }}>
                {renderMap(item.routeCoordinates)}
                </View>
            )}
            {item.images && item.images.length > 0 && (
                <View style={{ width: Dimensions.get('window').width }}>
                {renderImages(item.images)}
                </View>
            )}
        </ScrollView>

        {/* Stats Section */}
        {/* Duration, Distance, Elevation Gain, Avg Speed */}
        <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <FontAwesome5 name="clock" size={16} color="#666" />
                    <Text style={styles.statLabel}>Duration</Text>
                    <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
                </View>
                <View style={styles.statItem}>
                    <FontAwesome5 name="road" size={16} color="#666" />
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
                </View>
                <View style={styles.statItem}>
                    <FontAwesome5 name="mountain" size={16} color="#666" />
                    <Text style={styles.statLabel}>Elevation Gain</Text>
                    <Text style={styles.statValue}>{formatElevation(item.elevationGain)}</Text>
                </View>
                <View style={styles.statItem}>
                    <FontAwesome5 name="tachometer-alt" size={16} color="#666" />
                    <Text style={styles.statLabel}>Avg Speed</Text>
                    <Text style={styles.statValue}>{formatSpeed(item.averageSpeed)}</Text>
                </View>
            </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved activities found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 12,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 15,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  detailText: {
    ontSize: 14,
    color: '#666',
  },
  imageContainer: {
    marginTop: 12,
  },
  image: {
    width: width * 0.85,
    height: 200,
    marginRight: 8,
  },
  map: {
    height: 200,
    width: width * 0.85,
    borderRadius: 10,
    marginVertical: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
});

export default SavedActivities;