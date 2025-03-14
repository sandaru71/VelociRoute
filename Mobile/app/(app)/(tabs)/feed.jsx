import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions, SafeAreaView, FlatList } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { API_URL } from '../../../config';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as geolib from 'geolib';
import { auth } from '../../../firebase/config';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const mapRefs = useRef({});
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const fetchPosts = async (user = auth.currentUser) => {
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken(true);
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get(`${API_URL}/api/activity-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const postsWithProcessedData = response.data.data.map(post => {
          // Process route data
          let processedRoute = null;
          if (post.route) {
            processedRoute = parseGPX(post.route);
          }

          // Process stats data
          let processedStats = {
            duration: 0,
            distance: 0,
            elevationGain: 0,
            averageSpeed: 0
          };

          try {
            const stats = typeof post.stats === 'string' ? JSON.parse(post.stats) : post.stats;
            if (stats) {
              processedStats.duration = parseInt(stats.duration) || 0;
              processedStats.distance = parseFloat(stats.distance) * 1000 || 0;
              processedStats.elevationGain = parseFloat(stats.elevationGain) || 0;
              processedStats.averageSpeed = (parseFloat(stats.averageSpeed) / 3.6) || 0;
            }
          } catch (error) {
            console.error('Error processing stats for post:', post._id, error);
          }

          // Process likes data
          const likes = Array.isArray(post.likes) ? post.likes : [];
          const likedByCurrentUser = likes.includes(user.email);
          console.log(`Post ${post._id} - Likes:`, likes, 'Current user:', user.email, 'Liked:', likedByCurrentUser);

          return {
            ...post,
            route: processedRoute,
            ...processedStats,
            likes,
            likedByCurrentUser,
            likeCount: likes.length
          };
        });

        setPosts(postsWithProcessedData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    try {
      // Update UI optimistically
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id === postId) {
            const wasLiked = post.likedByCurrentUser;
            const newLikes = wasLiked
              ? post.likes.filter(email => email !== user.email)
              : [...post.likes, user.email];
            
            return {
              ...post,
              likes: newLikes,
              likedByCurrentUser: !wasLiked,
              likeCount: newLikes.length
            };
          }
          return post;
        })
      );

      // Make API call
      const response = await axios.put(`${API_URL}/api/activity-posts/like/${postId}`, {
        userEmail: user.email
      }, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        await fetchPosts(user);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      await fetchPosts(user);
    }
  };

  const parseGPX = (gpxData) => {
    try {
      // If it's already an array of coordinates, return it
      if (Array.isArray(gpxData)) {
        return gpxData;
      }

      // Handle string GPX data
      if (typeof gpxData === 'string') {
        console.log('Processing GPX string:', gpxData.substring(0, 100)); // Log first 100 chars for debugging

        // Extract all trkpt elements
        const trackPoints = [];
        const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
        let match;

        while ((match = trkptRegex.exec(gpxData)) !== null) {
          const lat = parseFloat(match[1]);
          const lon = parseFloat(match[2]);
          
          if (!isNaN(lat) && !isNaN(lon)) {
            trackPoints.push({
              latitude: lat,
              longitude: lon
            });
          }
        }

        console.log('Parsed track points:', trackPoints.length);
        return trackPoints.length > 0 ? trackPoints : null;
      }

      return null;
    } catch (error) {
      console.error('Error parsing GPX:', error);
      return null;
    }
  };

  const handleImageError = (error, type, url) => {
    console.error(`Error loading ${type} image:`, url, error.nativeEvent.error);
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

  useEffect(() => {
    let mounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!mounted) return;

      if (user) {
        setCurrentUserEmail(user.email);
        console.log('User logged in:', user.email);
        await fetchPosts(user);
      } else {
        setCurrentUserEmail(null);
        setPosts([]);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {item.userName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{item.userName || 'Anonymous'}</Text>
                {/* <Text style={styles.location}>{item.activityName}</Text> */}
              </View>
            </View>

            {/* Activity Details */}
            <Text style={styles.activityTitle}>{item.activityName}</Text>
            

            {/* Map and Images */}
            <ScrollView horizontal pagingEnabled style={styles.mediaScroller}>
              {item.route && Array.isArray(item.route) && item.route.length > 0 ? (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={ref => mapRefs.current[item._id] = ref}
                    provider={PROVIDER_GOOGLE}
                    style={styles.postMap}
                    initialRegion={{
                      latitude: item.route[0].latitude,
                      longitude: item.route[0].longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                  >
                    <Polyline
                      coordinates={item.route}
                      strokeColor="#FF4500"
                      strokeWidth={3}
                      strokeOpacity={0.8}
                    />
                    <Marker
                      coordinate={item.route[0]}
                      title="Start"
                      pinColor="green"
                    />
                    <Marker
                      coordinate={item.route[item.route.length - 1]}
                      title="End"
                      pinColor="red"
                    />
                  </MapView>
                  <TouchableOpacity 
                    style={styles.zoomButton}
                    onPress={() => fitToRoute(item._id, item.route)}
                  >
                    <FontAwesome name="compress" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}
              {item.images && Array.isArray(item.images) && item.images.map((imageUrl, index) => (
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
            <Text style={styles.activityDescription}>{item.description}</Text>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome name="clock-o" size={16} color="#666" />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="road" size={16} color="#666" />
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="arrow-up" size={16} color="#666" />
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>{formatElevation(item.elevationGain)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="flash" size={16} color="#666" />
                <Text style={styles.statLabel}>Avg Speed</Text>
                <Text style={styles.statValue}>{formatSpeed(item.averageSpeed)}</Text>
              </View>
            </View>

            {/* Like and Comment Buttons */}
            <View style={styles.interactionBar}>
              <TouchableOpacity 
                style={[
                  styles.interactionButton,
                  item.likedByCurrentUser && styles.likedButton
                ]} 
                onPress={() => handleLike(item._id)}
              >
                <FontAwesome 
                  name={item.likedByCurrentUser ? "heart" : "heart-o"} 
                  size={24} 
                  color={item.likedByCurrentUser ? "#FF4500" : "#666"} 
                />
                <Text style={[
                  styles.interactionText,
                  item.likedByCurrentUser && styles.likedText
                ]}>
                  {item.likeCount || 0} {item.likeCount === 1 ? 'Like' : 'Likes'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.interactionButton}>
                <FontAwesome name="comment-o" size={24} color="#666" />
                <Text style={styles.interactionText}>{item.comments?.length || 0} Comments</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              {item.comments?.map((comment, index) => (
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
                value={commentInputs[item._id] || ''}
                onChangeText={(text) => setCommentInputs({ ...commentInputs, [item._id]: text })}
                onSubmitEditing={() => handleComment(item._id)}
              />
              <TouchableOpacity 
                style={styles.commentButton}
                onPress={() => handleComment(item._id)}
              >
                <FontAwesome name="send" size={20} color="#FF4500" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  postContainer: {
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
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginVertical: 10,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  likedButton: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
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
    bottom: 120,
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
});

export default Feed;
