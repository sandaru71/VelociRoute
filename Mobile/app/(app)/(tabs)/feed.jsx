import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { API_URL } from '../../../config';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts from:', `${API_URL}/api/activity-posts`);
      const response = await axios.get(`${API_URL}/api/activity-posts`);
      console.log('Posts response:', response.data);
      if (response.data.success) {
        setPosts(response.data.data);
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
    <ScrollView style={styles.container}>
      {posts.map((post) => (
        <View key={post._id} style={styles.postCard}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {post.userName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{post.userName || 'Anonymous'}</Text>
              <Text style={styles.location}>{post.activityName}</Text>
            </View>
          </View>

          {/* Activity Details */}
          <Text style={styles.activityTitle}>{post.activityName}</Text>
          <Text style={styles.activityDescription}>{post.description}</Text>

          {/* Map and Images */}
          <ScrollView horizontal pagingEnabled style={styles.mediaScroller}>
            {post.route && typeof post.route === 'string' && (
              <Image 
                source={{ uri: post.route }}
                style={styles.postImage}
                resizeMode="cover"
                onError={(error) => handleImageError(error, 'map', post.route)}
              />
            )}
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

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.stats}>🏃‍♂️ Distance: {post.distance || 'N/A'}</Text>
            <Text style={styles.stats}>⏱️ Time: {post.time || 'N/A'}</Text>
            <Text style={styles.stats}>📈 Elevation: {post.elevationGain || 'N/A'}</Text>
            <Text style={styles.stats}>⚡ Avg Speed: {post.averageSpeed || 'N/A'}</Text>
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
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  stats: {
    fontSize: 14,
    color: '#444',
    marginVertical: 3,
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
});

export default Feed;
