import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { parseString } from 'react-native-xml2js';

// Example local assets for "story" circles
import girlRunner from '../assets/images/girlRunner.png';
import hiker from '../assets/images/hiker.png';
import runner2 from '../assets/images/runner2.png';
import femaleCyclist from '../assets/images/female-cyclist.png';
import maleCyclist from '../assets/images/male-cyclist.png';

// Your Google Maps API key – ensure native configuration is set up accordingly
const GOOGLE_MAPS_API_KEY = 'AIzaSyDQttE3cSnfZPt_K2UB9HYg1UWhdncQuPs';
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


const stories = [
  { id: 1, name: 'Yonara', image: girlRunner },
  { id: 2, name: 'Shenul', image: hiker },
  { id: 3, name: 'Veneza', image: runner2 },
  { id: 4, name: 'Sehara', image: femaleCyclist },
  { id: 5, name: 'Manusha', image: maleCyclist },
];

// Helper to parse GPX route and return an array of coordinates
const parseGPX = async (gpxString) => {
  try {
    // Wrap parseString in a promise to allow async/await usage
    const result = await new Promise((resolve, reject) => {
      parseString(
        gpxString,
        { explicitArray: false, ignoreAttrs: false, mergeAttrs: true },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });
    // Access trackpoints
    const trkpts = result.gpx?.trk?.trkseg?.trkpt;
    let coords = [];
    if (Array.isArray(trkpts)) {
      coords = trkpts.map((pt) => ({
        latitude: parseFloat(pt.lat),
        longitude: parseFloat(pt.lon),
      }));
    } else if (trkpts) {
      coords.push({
        latitude: parseFloat(trkpts.lat),
        longitude: parseFloat(trkpts.lon),
      });
    }
    return coords;
  } catch (error) {
    console.error('Error parsing GPX:', error);
    return [];
  }
};

export default function Feed() {
  const [updatedPosts, setUpdatedPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Adjust your URL as needed
        const { data } = await axios.get('http://10.0.2.2:3000/api/posts');
        console.log('Fetched posts:', data);

        // For each post that has a GPX route, parse it
        const postsWithCoords = await Promise.all(
          data.map(async (post) => {
            if (post.route) {
              console.log(`Post ${post._id} has route data.`);
              const routeCoords = await parseGPX(post.route);
              if (routeCoords.length > 0) {
                routeCoords.forEach((coord) => {
                  console.log(
                    `Post ${post._id} - lat: ${coord.latitude}, long: ${coord.longitude}`
                  );
                });
              } else {
                console.log(`No coordinates parsed for post ${post._id}`);
              }
              return { ...post, routeCoords };
            } else {
              console.log(`Post ${post._id} has no route data.`);
              return { ...post, routeCoords: [] };
            }
          })
        );
        setUpdatedPosts(postsWithCoords);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // "Like" action (likes are stored as an array)
  const handleLike = (id) => {
    setUpdatedPosts((prev) =>
      prev.map((p) => {
        if (p._id === id) {
          // If post already has an array of likes, just push a new item
          if (Array.isArray(p.likes)) {
            return { ...p, likes: [...p.likes, 'like'] };
          } else {
            // else treat likes as a number
            return { ...p, likes: p.likes + 1 };
          }
        }
        return p;
      })
    );
  };

  // "Comment" action
  const handleComment = (id) => {
    if (!commentInputs[id]?.trim()) return;
    setUpdatedPosts((prev) =>
      prev.map((p) =>
        p._id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { text: commentInputs[id], createdAt: new Date() },
              ],
            }
          : p
      )
    );
    setCommentInputs((prev) => ({ ...prev, [id]: '' }));
  };

  // Open/close "story" modal
  const openStory = (story) => {
    setSelectedStory(story);
    setStoryModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
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
      {/* Stories at the top */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storyContainer}
      >
        {stories.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => openStory(s)}>
            <View style={styles.storyBorder}>
              <Image source={s.image} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story Modal */}
      <Modal visible={storyModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.storyModal}
          onPress={() => setStoryModalVisible(false)}
        >
          {selectedStory && (
            <Image source={selectedStory.image} style={styles.fullStoryImage} />
          )}
        </TouchableOpacity>
      </Modal>

      {/* Main Posts */}
      {updatedPosts.map((post) => {
        // Parse stats JSON if it exists
        let parsedStats = {};
        if (post.stats) {
          try {
            parsedStats = JSON.parse(post.stats);
          } catch (parseErr) {
            console.error(`Error parsing stats for post ${post._id}:`, parseErr);
          }
        }

        // Create one unified array containing the static map (if any) + post images
        let scrollImages = [];
        if (post.routeCoords && post.routeCoords.length > 0) {
          const { latitude, longitude } = post.routeCoords[0];
          // Build static map URL
          const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=14&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
          // Add to the images array as the first item
          scrollImages.push(staticMapUrl);
        }
        // If the post has images, append them
        if (post.images && post.images.length > 0) {
          scrollImages = scrollImages.concat(post.images);
        }

        return (
          <View key={post._id} style={styles.postCard}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {post.userEmail ? post.userEmail[0].toUpperCase() : 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>
                  {post.userEmail || 'Unknown User'}
                </Text>
                <Text style={styles.location}>
                  {post.activityType || 'No Activity Type'}
                </Text>
              </View>
            </View>

            {/* Horizontal scroller: first item is map if route exists, then images */}
            <View style={styles.whiteBackground}>
              {scrollImages.length > 0 ? (
                <ScrollView horizontal pagingEnabled style={styles.imageScroll}>
                  {scrollImages.map((itemUri, index) => (
                    <Image
                      key={index}
                      source={{ uri: itemUri }}
                      style={styles.postImage}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text>No image available</Text>
              )}
            </View>

            {/* Caption & Description */}
            <Text style={styles.caption}>{post.activityName}</Text>
            <Text style={styles.description}>{post.description}</Text>

            {/* Activity Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.stats}>
                🏁 Distance: {parsedStats.distance || 'N/A'}
              </Text>
              <Text style={styles.stats}>
                ⏱️ Duration: {parsedStats.duration || 'N/A'}
              </Text>
              <Text style={styles.stats}>
                Avg Speed: {parsedStats.averageSpeed || 'N/A'}
              </Text>
              <Text style={styles.stats}>
                Elevation Gain: {parsedStats.elevationGain || 'N/A'}
              </Text>
            </View>

            {/* Like and Comment Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleLike(post._id)}
                style={styles.button}
              >
                <FontAwesome name="heart" size={20} color="red" />
                <Text style={styles.buttonText}>
                  {Array.isArray(post.likes)
                    ? post.likes.length
                    : post.likes}{' '}
                  Likes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentButton}>
                <FontAwesome name="comment" size={20} />
                <Text style={styles.buttonText}>
                  {post.comments.length} Comments
                </Text>
              </TouchableOpacity>
            </View>

            {/* Existing Comments */}
            <View style={styles.commentsSection}>
              {post.comments.map((c, i) => (
                <Text key={i} style={styles.comment}>
                  {c.text}
                </Text>
              ))}
            </View>

            {/* Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentInputs[post._id] || ''}
              onChangeText={(text) =>
                setCommentInputs((prev) => ({ ...prev, [post._id]: text }))
              }
              onSubmitEditing={() => handleComment(post._id)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------
// Styles
// ---------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storyContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  storyBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storyName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  storyModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullStoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#555',
  },
  postCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  whiteBackground: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageScroll: {
    maxHeight: 320,
  },
  postImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginRight: 10,
  },
  caption: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  statsContainer: {
    marginVertical: 10,
  },
  stats: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 14,
  },
  commentsSection: {
    marginTop: 10,
  },
  comment: {
    fontSize: 14,
    marginBottom: 5,
  },
  commentInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 5,
  },
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