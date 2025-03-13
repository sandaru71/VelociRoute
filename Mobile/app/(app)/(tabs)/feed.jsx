import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { API_URL } from '../../../config';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as geolib from 'geolib';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const mapRefs = useRef({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const parseGPX = (gpxData) => {
    try {
      // Basic XML parsing for GPX data
      const trackPoints = [];
      const matches = gpxData.match(/<trkpt[^>]*>.*?<\/trkpt>/g);
      
      if (matches) {
        matches.forEach(point => {
          const lat = point.match(/lat="([^"]*)"/)?.[1];
          const lon = point.match(/lon="([^"]*)"/)?.[1];
          if (lat && lon) {
            trackPoints.push({
              latitude: parseFloat(lat),
              longitude: parseFloat(lon)
            });
          }
        });
      }
      return trackPoints;
    } catch (error) {
      console.error('Error parsing GPX:', error);
      return [];
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts from:', `${API_URL}/api/activity-posts`);
      const response = await axios.get(`${API_URL}/api/activity-posts`);
      console.log('Posts response:', response.data);
      if (response.data.success) {
        const postsWithRoutes = await Promise.all(response.data.data.map(async post => {
          if (post.gpxFile) {
            try {
              const gpxResponse = await axios.get(`${API_URL}/api/gpx/${post._id}`);
              const routePoints = parseGPX(gpxResponse.data);
              return { ...post, route: routePoints };
            } catch (error) {
              console.error('Error fetching GPX for post:', post._id, error);
              return post;
            }
          }
          return post;
        }));
        setPosts(postsWithRoutes);
      } else {
        console.error('Failed to fetch posts:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (error, type, url) => {
    console.error(`Error loading ${type} image:`, url, error.nativeEvent.error);
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.put(`${API_URL}/api/activity-posts/like/${postId}`);
      if (response.data.success) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? response.data.data : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!commentInputs[postId]?.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/activity-posts/comment/${postId}`, {
        text: commentInputs[postId]
      });

      if (response.data.success) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? response.data.data : post
          )
        );
        setCommentInputs(prevInputs => ({ ...prevInputs, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fitToRoute = (postId, route) => {
    if (mapRefs.current[postId] && route && route.length > 0) {
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      mapRefs.current[postId].fitToCoordinates(route, { edgePadding: padding, animated: true });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDistance = (meters) => {
    if (!meters) return 'N/A';
    const km = (meters / 1000).toFixed(2);
    return `${km} km`;
  };

  const formatSpeed = (speedMps) => {
    if (!speedMps) return 'N/A';
    const speedKph = (speedMps * 3.6).toFixed(1);
    return `${speedKph} km/h`;
  };

  const formatElevation = (meters) => {
    if (!meters) return 'N/A';
    return `${meters.toFixed(1)}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No posts found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <ScrollView style={styles.container}>
        {posts.map((post, index) => (
          <View 
            key={post._id} 
            style={[
              styles.postCard,
              index === posts.length - 1 && styles.lastPost
            ]}
          >
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {post.userName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{post.userName || 'Anonymous'}</Text>
                {/* <Text style={styles.location}>{post.activityName}</Text> */}
              </View>
            </View>

            {/* Activity Details */}
            <Text style={styles.activityTitle}>{post.activityName}</Text>
            

            {/* Map and Images */}
            <ScrollView horizontal pagingEnabled style={styles.mediaScroller}>
              {post.route && Array.isArray(post.route) && post.route.length > 0 && (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={ref => mapRefs.current[post._id] = ref}
                    provider={PROVIDER_GOOGLE}
                    style={styles.postMap}
                    initialRegion={{
                      latitude: post.route[0].latitude,
                      longitude: post.route[0].longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                  >
                    <Polyline
                      coordinates={post.route}
                      strokeColor="#FF4500"
                      strokeWidth={3}
                      strokeOpacity={0.8}
                    />
                    <Marker
                      coordinate={post.route[0]}
                      title="Start"
                      pinColor="green"
                    />
                    <Marker
                      coordinate={post.route[post.route.length - 1]}
                      title="End"
                      pinColor="red"
                    />
                  </MapView>
                  
                </View>
              )}
              <TouchableOpacity 
                    style={styles.zoomButton}
                    onPress={() => fitToRoute(post._id, post.route)}
                  >
                    <FontAwesome name="compress" size={20} color="white" />
                  </TouchableOpacity>
              {post.images && Array.isArray(post.images) && post.images.map((imageUrl, index) => (
                typeof imageUrl === "string" && imageUrl.trim() !== '' ? (
                <Image 
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={(error) => handleImageError(error, 'activity', imageUrl)}
                />
                ) : null
              ))}
            </ScrollView>

            {/* Activity Description */}
            <Text style={styles.activityDescription}>{post.description}</Text>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome name="clock-o" size={16} color="#666" />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(post.time)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="road" size={16} color="#666" />
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(post.distance)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="arrow-up" size={16} color="#666" />
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>{formatElevation(post.elevationGain)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="flash" size={16} color="#666" />
                <Text style={styles.statLabel}>Avg Speed</Text>
                <Text style={styles.statValue}>{formatSpeed(post.averageSpeed)}</Text>
              </View>
            </View>

            {/* Like and Comment Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleLike(post._id)} style={styles.button}>
                <FontAwesome 
                  name={(post.likes || []).includes(post.userName) ? "heart" : "heart-o"} 
                  size={20} 
                  color="red" 
                />
                <Text style={styles.buttonText}>{post.likes?.length || 0} Likes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button}>
                <FontAwesome name="comment-o" size={20} color="#666" />
                <Text style={styles.buttonText}>{post.comments?.length || 0} Comments</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              {post.comments?.map((comment, index) => (
                <View key={index} style={styles.commentContainer}>
                  <Text style={styles.commentUser}>{comment.userName || 'Anonymous'}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>

            {/* Add Comment */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentInputs[post._id] || ''}
                onChangeText={(text) => setCommentInputs({ ...commentInputs, [post._id]: text })}
                onSubmitEditing={() => handleComment(post._id)}
              />
              <TouchableOpacity 
                style={styles.commentButton}
                onPress={() => handleComment(post._id)}
              >
                <FontAwesome name="send" size={20} color="#FF4500" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'lightGrey',
    padding: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  defaultAvatar: {
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  mediaScroller: {
    height: 200,
    marginVertical: 10,
  },
  postImage: {
    width: Dimensions.get('window').width - 30,
    height: 200,
    borderRadius: 10,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  statsContainer: {
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    marginTop: 10,
  },
  commentContainer: {
    marginBottom: 8,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
  },
  commentButton: {
    padding: 8,
  },
  mapContainer: {
    position: 'relative',
    width: Dimensions.get('window').width,
    height: 300,
    marginVertical: 10,
  },
  postMap: {
    width: '100%',
    height: '100%',
  },
  zoomButton: {
    position: 'absolute',
    right: 40,
    bottom: 10,
    backgroundColor: 'black',
    opacity: 0.5,
    padding: 10,
    borderRadius: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lastPost: {
    marginBottom: 105,
  },
});

export default Feed;
