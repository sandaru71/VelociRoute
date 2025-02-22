import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Image } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SaveActivityScreen = () => {
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedActivityRating, setSelectedActivityRating] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [isActivityTypeModalVisible, setIsActivityTypeModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.resumeText}>Resume</Text>
        <Text style={styles.saveText}>Save Activity</Text>
      </View>

      {/* Activity Name */}
      <TextInput style={styles.input} placeholder="Morning Walk" placeholderTextColor="grey" />

      {/* Map and Photo Section */}
      <View style={styles.mapPhotoContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>This is a sample map. You'll see your activity map after saving.</Text>
        </View>
        <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          ) : (
            <>
              <FontAwesome5 name="image" size={24} color="black" />
              <Text style={styles.photoText}>Add Photos/Video</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Activity Description */}
      <TextInput
        style={[styles.input, styles.description]}
        placeholder="How did it go? Share more about your activity. Use @ to tag someone."
        placeholderTextColor="grey"
        multiline
      />

      {/* Activity Type */}
      <TouchableOpacity style={styles.dropdown} onPress={toggleActivityTypeModal}>
        <FontAwesome5 name="running" size={18} color="black" />
        <Text style={styles.dropdownText}>
          {selectedActivityType ? selectedActivityType : 'Select Activity Type'}
        </Text>
        {selectedActivityType && (
          <FontAwesome5
            name={activityIcons[selectedActivityType]}
            size={18}
            color="blue"
            style={styles.iconAfterText}
          />
        )}
        <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
      </TouchableOpacity>

      {/* Activity Rating */}
      <TouchableOpacity style={styles.dropdown} onPress={toggleRatingModal}>
        <FontAwesome5 name="smile" size={18} color="black" />
        <Text style={styles.dropdownText}>
          {selectedActivityRating ? selectedActivityRating : 'Rate the activity'}
        </Text>
        {selectedActivityRating && (
          <FontAwesome5
            name={ratingIcons[selectedActivityRating]}
            size={18}
            color="gold"
            style={styles.iconAfterText}
          />
        )}
        <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
      </TouchableOpacity>

      {/* Difficulty Level */}
      <TouchableOpacity style={styles.dropdown} onPress={toggleDifficultyModal}>
        <FontAwesome5 name="trophy" size={18} color="black" />
        <Text style={styles.dropdownText}>
          {selectedDifficulty ? selectedDifficulty : 'Select Difficulty'}
        </Text>
        {selectedDifficulty && (
          <FontAwesome5
            name={difficultyIcons[selectedDifficulty]}
            size={18}
            color="red"
            style={styles.iconAfterText}
          />
        )}
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
                  <FontAwesome5 
                    name={activityIcons[item]} 
                    size={18} 
                    color="black" 
                    style={styles.modalIcon}
                  />
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
                  <FontAwesome5 
                    name={ratingIcons[item]} 
                    size={18} 
                    color="gold" 
                    style={styles.modalIcon}
                  />
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
                  <FontAwesome5 
                    name={difficultyIcons[item]} 
                    size={18} 
                    color="red" 
                    style={styles.modalIcon}
                  />
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

      {/* Save Activity Button */}
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Activity</Text>
      </TouchableOpacity>
    </View>
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
    overflow: 'hidden',
  },
  photoText: {
    color: 'black',
    marginTop: 10,
    fontSize: 12,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#FEBE15',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: 10,
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
});

export default SaveActivityScreen;
