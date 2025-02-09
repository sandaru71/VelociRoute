import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'


// Post data structure
interface Post {
  id: number;
  user: string;
  avatar: string;
  photo: string;
  caption: string;
  location?: string;
  likes: number;
  comments: string[];
}

const posts: Post[] = [
  {
    id: 1,
    user: 'Jessica Taylor',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    photo: 'https://source.unsplash.com/600x400/?nature,water',
    caption: 'Morning vibes 🌄🏞️!',
    location: 'California, USA',
    likes: 10,
    comments: ['Beautiful view! 😍', 'Looks amazing!'],
  },
  {
    id: 2,
    user: 'Oren Smith',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    photo: 'https://source.unsplash.com/600x400/?city,night',
    caption: 'City lights 🌆✨',
    location: 'New York, USA',
    likes: 8,
    comments: ['Wow! The city looks stunning.'],
  },
];

const feed = () => {
  const [updatedPosts, setUpdatedPosts] = useState(posts);

  // Handle likes
  const handleLike = (postId: number) => {
    const newPosts = updatedPosts.map((post) => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    setUpdatedPosts(newPosts);
  };

  // Handle comments
  const handleComment = (postId: number, newComment: string) => {
    if (newComment.trim() === '') return;

    const newPosts = updatedPosts.map((post) => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    setUpdatedPosts(newPosts);
  };

  return (
    <ScrollView style={styles.container}>
      {updatedPosts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{post.user}</Text>
              {post.location && <Text style={styles.location}>{post.location}</Text>}
            </View>
          </View>

          {/* Post Image */}
          <Image source={{ uri: post.photo }} style={styles.postImage} />

          {/* Caption */}
          <Text style={styles.caption}>{post.caption}</Text>

          {/* Like & Comment Section */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.likeButton}>
              <FontAwesome name="heart" size={20} color="red" />
              <Text> {post.likes} Likes</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            {post.comments.map((comment, index) => (
              <Text key={index} style={styles.comment}>
                🗨️ {comment}
              </Text>
            ))}
          </View>

          {/* Add Comment */}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            onSubmitEditing={(event) => handleComment(post.id, event.nativeEvent.text)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  postCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  location: { fontSize: 12, color: '#888' },
  postImage: { width: '100%', height: 200, borderRadius: 10 },
  caption: { fontSize: 14, color: '#333', marginVertical: 5 },
  actions: { flexDirection: 'row', marginTop: 5 },
  likeButton: { flexDirection: 'row', alignItems: 'center' },
  commentsSection: { marginTop: 10 },
  comment: { fontSize: 12, color: '#555', marginBottom: 2 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    fontSize: 12,
  },
});

export default feed;
