import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL } from '../../config';
import { auth } from '../../firebase/config';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Record from './(tabs)/record';


const SaveActivityScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get route data and stats from params
  const routeData = params.routeData ? JSON.parse(params.routeData) : [];
  const stats = params.stats ? JSON.parse(params.stats) : {};

  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedActivityRating, setSelectedActivityRating] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [isActivityTypeModalVisible, setIsActivityTypeModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const activityTypes = ['Running', 'Walking', 'Cycling', 'Hiking'];
  const activityRatings = ['Great', 'Good', 'Average', 'Poor'];
  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  const activityIcons = {
    Running: 'running',
    Walking: 'walking',
    Cycling: 'bicycle',
    Hiking: 'hiking',
  };
  
  const ratingIcons = {
    Great: 'smile-beam',
    Good: 'smile',
    Average: 'meh',
    Poor: 'frown',
  };
  
  const difficultyIcons = {
    Easy: 'flag',
    Medium: 'flag-checkered',
    Hard: 'mountain',
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleActivityTypeModal = () => {
    setIsActivityTypeModalVisible(!isActivityTypeModalVisible);
  };

  const toggleRatingModal = () => {
    setIsRatingModalVisible(!isRatingModalVisible);
  };

  const toggleDifficultyModal = () => {
    setIsDifficultyModalVisible(!isDifficultyModalVisible);
  };

  const handleSelectActivityType = (activityType) => {
    setSelectedActivityType(activityType);
    toggleActivityTypeModal();
  };

  const handleSelectActivityRating = (rating) => {
    setSelectedActivityRating(rating);
    toggleRatingModal();
  };

  const handleSelectDifficulty = (difficulty) => {
    setSelectedDifficulty(difficulty);
    toggleDifficultyModal();
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImages(prevImages => [...prevImages, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error picking image');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSaveActivity = async () => {
    try {
      setIsLoading(true);

      if (!activityName || !selectedActivityType) {
        Alert.alert('Error', 'Activity name and type are required');
        return;
      }

      // Get current user's token
      const token = await auth.currentUser.getIdToken();
      if (!token) {
        Alert.alert('Error', 'Authentication error. Please try again.');
        return;
      }

      const formData = new FormData();
      formData.append('activityName', activityName);
      formData.append('description', description);
      formData.append('activityType', selectedActivityType);
      formData.append('rating', selectedActivityRating);
      formData.append('difficulty', selectedDifficulty);
      
      // Add route data and stats if available
      if (routeData) {
        formData.append('route', JSON.stringify(routeData));
      }
      if (stats) {
        formData.append('stats', JSON.stringify(stats));
      }

      // Append images
      selectedImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `image${index}.jpg`,
        });
      });

      const response = await axios.post(`${API_URL}/api/activities/save`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Activity saved successfully!');
        router.push('/(app)/(tabs)/index'); 
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
          options={{
            headerLeft: () => (
              <TouchableOpacity
                style={{ marginLeft: 0, marginRight: 10 }}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            ),
          }}
        />

      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
        
        {/* Activity Name */}
        <TextInput 
          style={styles.input} 
          placeholder="Morning Walk" 
          placeholderTextColor="grey" 
          value={activityName}
          onChangeText={(text) => setActivityName(text)}
        />

        {/* Map and Photo Section */}
        <View style={styles.mapPhotoContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>This is a sample map. You'll see your activity map after saving.</Text>
          </View>
          
          <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
            {selectedImages.length > 0 ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image 
                  source={{ uri: selectedImages[0].uri }} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={[styles.removeButton, { top: 5, right: 5 }]}
                  onPress={() => {
                    setSelectedImages([]);
                  }}
                >
                  <FontAwesome5 name="times-circle" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FontAwesome5 name="image" size={24} color="black" />
                <Text style={styles.photoText}>Add Photos/Video</Text>
              </>
            )}
          </TouchableOpacity>

          {selectedImages.length > 1 && (
            <FlatList
              data={selectedImages.slice(1)}
              horizontal
              style={styles.imageList}
              renderItem={({ item, index }) => (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index + 1)}
                  >
                    <FontAwesome5 name="times-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          )}
        </View>
        
        {/* Activity Description */}
        <TextInput
          style={[styles.input, styles.description]}
          placeholder="How did it go? Share more about your activity.
          "
          placeholderTextColor="grey"
          value={description}
          onChangeText={(text) => setDescription(text)}
        />

        {/* Time Taken */}
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Time Taken:</Text>
          <Text style={styles.statValue}>{formatTime(stats.duration || 0)}</Text>
        </View>

        {/* Distance */}
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Distance:</Text>
          <Text style={styles.statValue}>{stats.distance || '0'} km</Text>
        </View>

        {/* Average Speed */}
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Average Speed:</Text>
          <Text style={styles.statValue}>{stats.averageSpeed || '0'} km/h</Text>
        </View>

        {/* Elevation gain */}
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Elevation Gain:</Text>
          <Text style={styles.statValue}>{stats.elevationGain || '0'} m</Text>
        </View>

        {/* Activity Type */}
        <TouchableOpacity style={styles.dropdown} onPress={toggleActivityTypeModal}>
        {selectedActivityType && (
            <FontAwesome5
              name={activityIcons[selectedActivityType]}
              size={18}
              color="black"
              style={styles.iconAfterText}
            />
          )}
          <Text style={styles.dropdownText}>
            {selectedActivityType ? selectedActivityType : 'Select Activity Type'}
          </Text>
          
          <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
        </TouchableOpacity>

        {/* Activity Rating */}
        <TouchableOpacity style={styles.dropdown} onPress={toggleRatingModal}>
        {selectedActivityRating && (
            <FontAwesome5
              name={ratingIcons[selectedActivityRating]}
              size={18}
              color="black"
              style={styles.iconAfterText}
            />
          )}
          <Text style={styles.dropdownText}>
            {selectedActivityRating ? selectedActivityRating : 'Rate the activity'}
          </Text>
          
          <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
        </TouchableOpacity>

        {/* Difficulty Level */}
        <TouchableOpacity style={styles.dropdown} onPress={toggleDifficultyModal}>
        {selectedDifficulty && (
            <FontAwesome5
              name={difficultyIcons[selectedDifficulty]}
              size={18}
              color="black"
              style={styles.iconAfterText}
            />
          )}
          <Text style={styles.dropdownText}>
            {selectedDifficulty ? selectedDifficulty : 'Select Difficulty'}
          </Text>
          
          <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
        </TouchableOpacity>

        {/* Modal for Activity Type */}
        <Modal visible={isActivityTypeModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <FlatList
                data={activityTypes}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleSelectActivityType(item)}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.closeModalButton} onPress={toggleActivityTypeModal}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for Activity Rating */}
        <Modal visible={isRatingModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <FlatList
                data={activityRatings}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleSelectActivityRating(item)}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.closeModalButton} onPress={toggleRatingModal}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for Difficulty Level */}
        <Modal visible={isDifficultyModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <FlatList
                data={difficultyLevels}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleSelectDifficulty(item)}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.closeModalButton} onPress={toggleDifficultyModal}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Discard Button */}
        <TouchableOpacity
          style={styles.discardButton}
        >
          <Text style={styles.discardButtonText}>Discard Activity</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={handleSaveActivity}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Activity'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.postActivityButton}
        >
          <Text style={styles.postActivityText}>
            Post Activity
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  resumeText: {
    color: 'black',
    fontSize: 16,
  },
  saveText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#e8e8e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    marginTop: 20,
  },
  description: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  iconAfterText: {
    marginLeft: 10,
  },
  dropdownText: {
    color: 'grey',
    marginLeft: 10,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  mapPhotoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  mapPlaceholder: {
    width: '48%',
    height: 100,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapText: {
    color: 'grey',
    fontSize: 10,
    textAlign: 'center',
  },
  photoUpload: {
    width: '48%',
    height: 100,
    borderWidth: 3,
    borderColor: 'black',
    opacity: 0.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  photoText: {
    color: 'black',
    marginTop: 10,
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 10,
  },
  discardButton: {
    backgroundColor: '#FEBE15',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 10,
  },
  discardButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18  ,
    fontWeight: 'bold',
  },
  postActivityButton: {
    backgroundColor: '#FEBE15',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  postActivityText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalOptionText: {
    fontSize: 16,
    color: 'black',
  },
  closeModalButton: {
    backgroundColor: '#FEBE15',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  closeModalText: {
    color: 'white',
    fontSize: 14,
  },
  imageList: {
    marginTop: 10,
  },
  imageContainer: {
    marginRight: 10,
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  statContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default SaveActivityScreen;