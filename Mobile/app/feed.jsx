import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import Avatar from './components/Avatar';

// Import your API base URL from config
const API_URL = 'http://192.168.18.4:3000/api';  // Using your local IP address and port

// Importing images from assets
import map from '../assets/images/map.jpg';
import cyclist from '../assets/images/cyclist.jpg';
import femaleCyclist from '../assets/images/female-cyclist.png';
import maleCyclist from '../assets/images/male-cyclist.png';
import girlRunner from '../assets/images/girlRunner.png';
import hiker from '../assets/images/hiker.png';
import runner2 from '../assets/images/runner2.png';
// import defaultAvatar from './assets/images/default-avatar.png';

const stories = [
  { id: 1, name: 'Yonara', image: girlRunner },
  { id: 2, name: 'Shenul', image: hiker },
  { id: 3, name: 'Veneza', image: runner2 },
  { id: 4, name: 'Sehara', image: femaleCyclist },
  { id: 5, name: 'Manusha', image: maleCyclist },
];

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      console.log('Posts data:', response.data); // Debug log
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image error handling function
  const handleImageError = (error, type, url) => {
    console.error(`Error loading ${type} image:`, url, error.nativeEvent.error);
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.put(`${API_URL}/posts/${postId}/like`);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? response.data : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!commentInputs[postId]?.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comment`, {
        user: 'Current User', // Replace with actual user name
        text: commentInputs[postId]
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? response.data : post
        )
      );
      setCommentInputs(prevInputs => ({ ...prevInputs, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const openStory = (story) => {
    setSelectedStory(story);
    setStoryModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Story Section */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storyContainer}>
        {stories.map((story) => (
          <TouchableOpacity key={story.id} onPress={() => openStory(story)}>
            <View style={styles.storyBorder}>
              <Image source={story.image} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName}>{story.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story Modal (Full Screen) */}
      <Modal visible={storyModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.storyModal} onPress={() => setStoryModalVisible(false)}>
          {selectedStory && <Image source={selectedStory.image} style={styles.fullStoryImage} />}
        </TouchableOpacity>
      </Modal>

      {/* Posts Section */}
      {posts.map((post) => (
        <View key={post._id} style={styles.postCard}>
          {/* User Info */}
          <View style={styles.userInfo}>
            {post.avatar ? (
              <Image 
                source={{ uri: post.avatar }}
                style={styles.avatar}
                onError={() => console.log('Avatar load error for:', post.user)}
              />
            ) : (
              <Avatar name={post.user} size={40} />
            )}
            <View>
              <Text style={styles.username}>{post.user}</Text>
              <Text style={styles.location}>{post.location}</Text>
            </View>
          </View>

          {/* Map and Images */}
          <ScrollView horizontal pagingEnabled style={styles.mediaScroller}>
            {post.mapUrl && (
              <Image 
                source={{ uri: post.mapUrl }}
                onError={(error) => handleImageError(error, 'map', post.mapUrl)}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
            {post.images && post.images.map((imageUrl, index) => (
              <Image 
                key={index}
                source={{ uri: imageUrl }}
                onError={(error) => handleImageError(error, 'activity', imageUrl)}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <Text style={styles.caption}>{post.caption}</Text>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.stats}>🏁 Distance: {post.distance}</Text>
            <Text style={styles.stats}>⏱️ Time: {post.time}</Text>
            {post.achievements && (
              <Text style={styles.stats}>🏆 Achievement: {post.achievements}</Text>
            )}
          </View>

          {/* Like and Comment Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleLike(post._id)} style={styles.button}>
              <FontAwesome name="heart" size={20} color="red" />
              <Text style={styles.buttonText}>{post.likes} Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentButton}>
              <FontAwesome name="comment" size={20} color="gray" />
              <Text style={styles.buttonText}>{post.comments.length} Comments</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            {post.comments.map((comment, index) => (
              <Text key={index} style={styles.comment}>
                <Text style={styles.commentUser}>{comment.user}: </Text>
                {comment.text}
              </Text>
            ))}
          </View>

          {/* Add Comment */}
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentInputs[post._id] || ''}
            onChangeText={(text) => setCommentInputs({ ...commentInputs, [post._id]: text })}
            onSubmitEditing={() => handleComment(post._id)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  /* Story Section */
  storyContainer: { flexDirection: 'row', padding: 10 },
  storyBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FF4500', // Instagram-like orange border
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  storyImage: { width: 60, height: 60, borderRadius: 30 },
  storyName: { fontSize: 12, textAlign: 'center', marginTop: 5 },

  /* Story Modal */
  storyModal: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  fullStoryImage: { width: '100%', height: '100%', resizeMode: 'contain' },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0' // Placeholder background while loading
  },
  postCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  whiteBackground: { backgroundColor: '#fff', padding: 10, alignItems: 'center', borderRadius: 10, marginBottom: 10 },
  postImage: {
    width: Dimensions.get('window').width,
    height: 300,
    backgroundColor: '#f0f0f0' // Placeholder background while loading
  },
  statsContainer: { marginVertical: 10 },
  stats: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  button: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { marginLeft: 5, fontSize: 14 },
  commentsSection: { marginTop: 10 },
  comment: { fontSize: 14, marginBottom: 5 },
  commentInput: { borderBottomWidth: 1, borderColor: '#ccc', padding: 5, marginTop: 5 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mediaScroller: {
    height: 300,
  },
  commentUser: {
    fontWeight: 'bold'
  }
});

export default Feed;
