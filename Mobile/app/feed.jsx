import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Correct import
import axios from 'axios';

// Importing images from assets
import map from '../assets/images/map.jpg';
import cyclist from '../assets/images/cyclist.jpg';
import femaleCyclist from '../assets/images/female-cyclist.png';
import maleCyclist from '../assets/images/male-cyclist.png';
import girlRunner from '../assets/images/girlRunner.png';
import hiker from '../assets/images/hiker.png';
import runner2 from '../assets/images/runner2.png';

const stories = [
  { id: 1, name: 'Yonara', image: girlRunner },
  { id: 2, name: 'Shenul', image: hiker },
  { id: 3, name: 'Veneza', image: runner2 },
  { id: 4, name: 'Sehara', image: femaleCyclist },
  { id: 5, name: 'Manusha', image: maleCyclist },
];

const Feed = () => {
  const [updatedPosts, setUpdatedPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/posts'); // Call the backend API
        setUpdatedPosts(response.data); // Update state with fetched data
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLike = (postId) => {
    setUpdatedPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  const handleComment = (postId) => {
    if (!commentInputs[postId]?.trim()) return;

    setUpdatedPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, { text: commentInputs[postId] }] }
          : post
      )
    );
    setCommentInputs((prevInputs) => ({ ...prevInputs, [postId]: '' }));
  };

  const openStory = (story) => {
    setSelectedStory(story);
    setStoryModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
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
      {updatedPosts.map((post) => (
        <View key={post._id} style={styles.postCard}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{post.user}</Text>
              <Text style={styles.location}>{post.location}</Text>
            </View>
          </View>

          {/* White Background Area with Map or Cyclist Image */}
          <View style={styles.whiteBackground}>
            <Image source={{ uri: post.postImage }} style={styles.postImage} />
          </View>

          <Text style={styles.caption}>{post.caption}</Text>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.stats}>🏁 Distance: {post.distance}</Text>
            <Text style={styles.stats}>⏱️ Time: {post.time}</Text>
            <Text style={styles.stats}>🏆 Achievement: {post.achievements}</Text>
          </View>

          {/* Like and Comment Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleLike(post._id)} style={styles.button}>
              <FontAwesome name="heart" size={20} color="red" /> {/* Correct usage */}
              <Text style={styles.buttonText}>{post.likes} Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentButton}>
              <FontAwesome name="comment" size={20} color="gray" /> {/* Correct usage */}
              <Text style={styles.buttonText}>{post.comments.length} Comments</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            {post.comments.map((comment, index) => (
              <Text key={index} style={styles.comment}>{comment.text}</Text>
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

  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  whiteBackground: { backgroundColor: '#fff', padding: 10, alignItems: 'center', borderRadius: 10, marginBottom: 10 },
  postImage: { width: '100%', height: 300, borderRadius: 10 },
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
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default Feed;