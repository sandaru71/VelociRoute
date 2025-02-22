
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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

const posts = [
  {
    id: 1,
    user: 'Sehara Fernando',
    avatar: femaleCyclist,
    caption: 'Morning ride 🚴‍♂️💨!',
    location: 'Colombo, Sri Lanka',
    likes: 15,
    comments: ['Great ride! 🚴‍♂️', 'Keep pushing!'],
    distance: '25 km',
    time: '1h 10m',
    achievements: 'Fastest ride this week!',
    postImage: map,
  },
  {
    id: 2,
    user: 'Manusha Perera',
    avatar: maleCyclist,
    caption: 'Evening run 🏃‍♀️🌇!',
    location: 'Colombo, Sri Lanka',
    likes: 20,
    comments: ['You are killing it! 🔥', 'Nice pace!'],
    distance: '10 km',
    time: '50 min',
    achievements: 'New personal best!',
    postImage: cyclist,
  },
];

const Feed = () => {
  const [updatedPosts, setUpdatedPosts] = useState(posts);
  const [commentInputs, setCommentInputs] = useState({});
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

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
          ? { ...post, comments: [...post.comments, commentInputs[postId]] }
          : post
      )
    );
    setCommentInputs((prevInputs) => ({ ...prevInputs, [postId]: '' }));
  };

  const openStory = (story) => {
    setSelectedStory(story);
    setStoryModalVisible(true);
  };

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
        <View key={post.id} style={styles.postCard}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Image source={post.avatar} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{post.user}</Text>
              <Text style={styles.location}>{post.location}</Text>
            </View>
          </View>

          {/* White Background Area with Map or Cyclist Image */}
          <View style={styles.whiteBackground}>
            <Image source={post.postImage} style={styles.postImage} />
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
            <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.button}>
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
              <Text key={index} style={styles.comment}>{comment}</Text>
            ))}
          </View>

          {/* Add Comment */}
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentInputs[post.id] || ''}
            onChangeText={(text) => setCommentInputs({ ...commentInputs, [post.id]: text })}
            onSubmitEditing={() => handleComment(post.id)}
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
});

export default Feed;
