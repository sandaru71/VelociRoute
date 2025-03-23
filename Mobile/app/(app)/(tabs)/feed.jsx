import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions, SafeAreaView, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../../config';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { auth } from '../../../firebase/config';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const activityIcons = {
  Running: 'running',
  Walking: 'walking',
  Cycling: 'bicycle',
  Hiking: 'hiking',
};

const ratingIcons = {
  Great: 'grin-beam',
  Good: 'smile',
  Average: 'meh',
  Poor: 'frown',
};

const difficultyIcons = {
  Easy: 'flag',
  Medium: 'flag-checkered',
  Hard: 'mountain',
};

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const mapRefs = useRef({});
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [userProfiles, setUserProfiles] = useState([]);
  const [showUserPosts, setShowUserPosts] = useState(false);
  const { showUserPosts: showUserPostsParam } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const shouldShowUserPosts = showUserPostsParam === 'true';
    setShowUserPosts(shouldShowUserPosts);
    if (auth.currentUser) {
      fetchPosts(auth.currentUser);
    }
  }, [showUserPostsParam]);

  const toggleUserPosts = async () => {
    const newValue = !showUserPosts;
    setShowUserPosts(newValue);
    if (auth.currentUser) {
      setLoading(true);
      try {
        await fetchPosts(auth.currentUser);
      } catch (error) {
        console.error('Error toggling posts:', error);
      } finally {
        setLoading(false);
      }
    }
    // Update URL without full navigation
    router.setParams({ showUserPosts: newValue.toString() });
  };

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

      let endpoint = `${API_URL}/api/activity-posts`;
      if (showUserPosts) {
        endpoint = `${endpoint}?userEmail=${encodeURIComponent(user.email)}`;
      }

      console.log('Fetching posts from:', endpoint);
      console.log('Show user posts:', showUserPosts);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        let postsWithProcessedData = response.data.data
          .filter(post => !showUserPosts || post.userEmail === user.email)
          .map(post => {
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

  const fetchUserProfiles = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const token = await user.getIdToken();

      // Get all unique email addresses from posts
      const uniqueEmails = [...new Set(posts.map(post => post.userEmail))];
      console.log('Fetching profiles for emails:', uniqueEmails);

      // Fetch profiles using the batch endpoint
      const response = await axios.get(`${API_URL}/api/user/profiles/batch`, {
        params: { emails: uniqueEmails.join(',') },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Profile response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        const profileMap = {};
        
        // Process each profile from the response
        response.data.forEach(profile => {
          if (profile && profile.email) {
            profileMap[profile.email] = {
              email: profile.email,
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              profilePhoto: profile.profilePhoto || null
            };
          }
        });

        console.log('Final profile map:', profileMap);
        setUserProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error fetching user profiles:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (posts && posts.length > 0) {
      fetchUserProfiles();
    }
  }, [posts]);

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

  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    try {
      // Split the URL at 'upload/'
      const [baseUrl, options] = url.split('upload/');
      if (!baseUrl || !options) return url;

      return `${baseUrl}upload/c_fill,g_face,w_80,h_80,q_auto/${options}`;
    } catch (error) {
      console.error('Error optimizing Cloudinary URL:', error);
      return url;
    }
  };

  const getProfileImage = (email) => {
    const profile = userProfiles[email];
    if (profile?.profilePhoto) {
      return {
        uri: optimizeCloudinaryUrl(profile.profilePhoto),
        headers: {
          'Cache-Control': 'max-age=86400'
        }
      };
    }
    return null;
  };

  const handleImageError = (error, email) => {
    console.error('Error loading profile image:', {
      error,
      email,
      apiUrl: API_URL
    });
  };

  const handleComment = async (postId) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    if (!commentInputs[postId]?.trim()) return;

    try {
      const token = await user.getIdToken();
      console.log('Adding comment to post:', postId, 'User:', user.email);
      
      const response = await axios.post(`${API_URL}/api/activity-posts/comment/${postId}`, {
        text: commentInputs[postId].trim(),
        userEmail: user.email
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('Comment added successfully');
        // Clear the comment input
        setCommentInputs(prev => ({
          ...prev,
          [postId]: ''
        }));
        
        // Refresh posts to show new comment
        await fetchPosts(user);
      } else {
        console.error('Failed to add comment:', response.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication error. Token:', await user.getIdToken());
        // Try to refresh token and retry
        try {
          const newToken = await user.getIdToken(true);
          const retryResponse = await axios.post(`${API_URL}/api/activity-posts/comment/${postId}`, {
            text: commentInputs[postId].trim(),
            userEmail: user.email
          }, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (retryResponse.data.success) {
            console.log('Comment added successfully after token refresh');
            setCommentInputs(prev => ({
              ...prev,
              [postId]: ''
            }));
            await fetchPosts(user);
            return;
          }
        } catch (retryError) {
          console.error('Error retrying comment after token refresh:', retryError.response?.data || retryError.message);
        }
      }
      console.error('Error adding comment:', error.response?.data || error.message);
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
    return `${Math.round(meters)} m`;
  };

  const getDisplayName = (email) => {
    const profile = userProfiles[email];
    if (profile && (profile.firstName || profile.lastName)) {
      const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      return name || email;
    }
    return email;
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
        <ActivityIndicator size="large" color="#FEBE15" />
        <Text style={styles.loadingText}>Loading posts...</Text>
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
  const getImageUrl = (url) => {
    if (!url) return null;
    // Replace .avif with .jpg in the Cloudinary URL
    return url.replace(/\.(avif|AVIF)$/, '.jpg');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Feed</Text>
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={() => {
              setLoading(true);
              fetchPosts(auth.currentUser);
            }}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color="#666"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, showUserPosts && styles.filterButtonActive]} 
          onPress={toggleUserPosts}
        >
          <MaterialIcons 
            name="person" 
            size={24} 
            color={showUserPosts ? "#FEBE15" : "black"} 
          />
          <Text style={[styles.filterButtonText, showUserPosts && styles.filterButtonTextActive]}>
            {showUserPosts ? "All Posts" : "My Posts"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={[styles.avatar, styles.defaultAvatar]}>
                {getProfileImage(item.userEmail) ? (
                  <Image 
                    source={getProfileImage(item.userEmail)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={(error) => handleImageError(error, item.userEmail)}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {(userProfiles[item.userEmail]?.firstName?.charAt(0) || item.userEmail.charAt(0)).toUpperCase()}
                  </Text>
                )}
              </View>  

              <View>
                <Text style={styles.username}>
                  {getDisplayName(item.userEmail)}
                </Text>
              </View>
            </View>

            {/* Activity Details */}
            <Text style={styles.activityTitle}>{item.activityName}</Text>
            
            {/* Activity Type, Rating, and Difficulty */}
            <View style={styles.activityDetailsContainer}>
              {item.activityType && activityIcons[item.activityType] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={activityIcons[item.activityType]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.activityType}</Text>
                </View>
              )}
              {item.rating && ratingIcons[item.rating] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={ratingIcons[item.rating]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.rating}</Text>
                </View>
              )}
              {item.difficulty && difficultyIcons[item.difficulty] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={difficultyIcons[item.difficulty]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.difficulty}</Text>
                </View>
              )}
            </View>

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
                    <FontAwesome5 name="compress" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}
              {item.images && Array.isArray(item.images) && item.images.map((imageUrl, index) => (
                typeof imageUrl === "string" && imageUrl.trim() !== '' ? (
                <Image 
                  key={index}
                  source={{ uri: getImageUrl(imageUrl) }}
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
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>{formatElevation(item.elevationGain)}</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="tachometer-alt" size={16} color="#666" />
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
                <FontAwesome5 
                  name={item.likedByCurrentUser ? "heart" : "heart"} 
                  solid={item.likedByCurrentUser}
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
                <FontAwesome5 name="comment" size={24} color="#666" />
                <Text style={styles.interactionText}>{item.comments?.length || 0} Comments</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              {item.comments?.map((comment, index) => (
                <View key={index} style={styles.commentContainer}>
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
                <FontAwesome5 name="paper-plane" size={20} color="#FEBE15" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
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
  loadingText: {
    fontSize: 16,
    color: 'black',
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
    overflow: 'hidden',
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  defaultAvatar: {
    backgroundColor: '#e1e1e1',
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
  activityDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#FFF3D3',
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  filterButtonTextActive: {
    color: '#FEBE15',
  },
});

export default Feed;
