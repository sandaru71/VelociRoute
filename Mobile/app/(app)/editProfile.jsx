import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { API_URL } from '../../config';
import { Picker } from '@react-native-picker/picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth } from '../../firebase/config';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';
const Stack = createNativeStackNavigator();

// Get Cloudinary configuration from Expo environment variables
const CLOUDINARY_CLOUD_NAME = Constants.expoConfig.extra?.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb';
const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig.extra?.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

console.log('Cloudinary Config:', {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET
});

const ACTIVITY_OPTIONS = [
  { label: 'Cycling', value: 'Cycling' },
  { label: 'Running', value: 'Running' },
  { label: 'Hiking', value: 'Hiking' },
  { label: 'Walking', value: 'Walking' },
];

const EditProfile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({
    profile: false,
    cover: false
  });
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const activityRef = useRef(null);
  const locationRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    preferredActivity: 'Cycling',
    location: '',
    profilePhoto: null,
    coverPhoto: null,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsInitialLoading(true);
      console.log('Fetching profile data for edit...');
      
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const token = await user.getIdToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Current user:', { email: user.email, uid: user.uid });

      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
 
      console.log('Response:', response.data);

      if (response.data) {
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          preferredActivity: response.data.preferredActivity || 'Cycling',
          location: response.data.location || '',
          profilePhoto: response.data.profilePhoto || null,
          coverPhoto: response.data.coverPhoto || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const token = await user.getIdToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Upload images to our backend server first
      let profilePhotoUrl = formData.profilePhoto;
      let coverPhotoUrl = formData.coverPhoto;

      // Only upload to our backend server if it's a local file (not already a URL)
      if (profilePhotoUrl && !profilePhotoUrl.startsWith('http')) {
        try {
          console.log('Uploading profile photo to server...');
          profilePhotoUrl = await uploadToServer(profilePhotoUrl);
          console.log('Profile photo uploaded:', profilePhotoUrl);
        } catch (error) {
          console.error('Failed to upload profile photo:', error);
          Alert.alert('Error', 'Failed to upload profile photo');
          return;
        }
      }

      if (coverPhotoUrl && !coverPhotoUrl.startsWith('http')) {
        try {
          console.log('Uploading cover photo to server...');
          coverPhotoUrl = await uploadToServer(coverPhotoUrl);
          console.log('Cover photo uploaded:', coverPhotoUrl);
        } catch (error) {
          console.error('Failed to upload cover photo:', error);
          Alert.alert('Error', 'Failed to upload cover photo');
          return;
        }
      }

      // Prepare data with server URLs
      const updatedData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        preferredActivity: formData.preferredActivity,
        location: formData.location,
        profilePhoto: profilePhotoUrl,
        coverPhoto: coverPhotoUrl,
      };

      console.log('Saving profile with data:', updatedData);
      console.log('API URL:', API_URL);

      const response = await axios.put(`${API_URL}/api/user/profile`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', response.data);

      if (response.data) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Error updating profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    return true;
  };

  const uploadToServer = async (uri) => {
    try {
      console.log('Starting image upload for:', uri);

      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        throw new Error('Authentication error');
      }

      const token = await user.getIdToken();
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication error');
      }

      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            // Get base64 data and format it correctly
            const base64Raw = reader.result;
            const base64Data = base64Raw.split(',')[1]; // Remove the data URL prefix
            console.log('Image converted to base64, uploading to server...');

            // Upload to our backend server
            const uploadResponse = await axios.post(`${API_URL}/api/user/upload-image`, {
              image: base64Data,
              imageType: blob.type
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('Upload response:', uploadResponse.data);

            if (!uploadResponse.data.url) {
              throw new Error('No URL received from server');
            }

            resolve(uploadResponse.data.url);
          } catch (error) {
            console.error('Error in upload process:', error);
            reject(error);
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const pickImage = async (type) => {
    try {
      setIsLoading(true);
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker with specific options for each type
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
        base64: true // Request base64 data directly
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log(`Selected ${type} image:`, {
          uri: selectedImage.uri,
          width: selectedImage.width,
          height: selectedImage.height,
          type: selectedImage.type || 'image/jpeg'
        });

        try {
          // Upload to our backend server
          console.log(`Uploading ${type} photo to server...`);
          const serverUrl = await uploadToServer(selectedImage.uri);
          console.log(`${type} photo uploaded:`, serverUrl);

          // Update form data with the server URL
          setFormData(prev => ({
            ...prev,
            [type === 'profile' ? 'profilePhoto' : 'coverPhoto']: serverUrl
          }));
        } catch (error) {
          console.error(`Failed to upload ${type} photo:`, error);
          Alert.alert('Upload Error', `Failed to upload ${type} photo. Please try again.`);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  return (
    <View style={styles.container}>
      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView style={{flex: 1}}>
          {/* <View style={styles.mainContent}> */}
            
            {/* Cover Photo Section */}
            <View style={styles.coverPhotoContainer}>
              {imageLoading.cover && (
                <View style={[styles.imageLoadingOverlay, styles.coverLoadingOverlay]}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
              <Image
                source={
                  formData.coverPhoto
                    ? { uri: formData.coverPhoto }
                    : require('../../assets/galle face green.png')
                }
                style={styles.coverPhoto}
                onLoadStart={() => setImageLoading(prev => ({ ...prev, cover: true }))}
                onLoadEnd={() => setImageLoading(prev => ({ ...prev, cover: false }))}
                onError={(e) => {
                  console.error('Error loading cover photo:', e.nativeEvent.error);
                  setImageLoading(prev => ({ ...prev, cover: false }));
                }}
              />
              {/* Cover Edit button */}
              <TouchableOpacity
                style={styles.coverEditButton}
                onPress={() => pickImage('cover')}
                activeOpacity={0.9}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="edit" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Photo Section */}
            <View style={styles.profilePhotoContainer}>
                {imageLoading.profile && (
                  <View style={[styles.imageLoadingOverlay, styles.profileLoadingOverlay]}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
                <Image
                  source={
                    formData.profilePhoto
                      ? { uri: formData.profilePhoto }
                      : require('../../assets/galle face green.png')
                  }
                  style={styles.profilePhoto}
                  onLoadStart={() => setImageLoading(prev => ({ ...prev, profile: true }))}
                  onLoadEnd={() => setImageLoading(prev => ({ ...prev, profile: false }))}
                  onError={(e) => {
                    console.error('Error loading profile photo:', e.nativeEvent.error);
                    setImageLoading(prev => ({ ...prev, profile: false }));
                  }}
                />
                
                {/* Profile photo Edit button */}
                <TouchableOpacity
                  style={styles.profileEditButton}
                  onPress={() => pickImage('profile')}
                  activeOpacity={0.9}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <TextInput
                  ref={firstNameRef}
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#999999"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />

                <TextInput  
                  ref={lastNameRef}
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#999999"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                  returnKeyType="next"
                />

                {/* Preferred Activity Picker */}
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.preferredActivity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredActivity: value }))}
                    style={styles.picker}
                  >
                    {ACTIVITY_OPTIONS.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </View>

                <TextInput
                  ref={locationRef}
                  style={styles.input}
                  placeholder="Location"
                  placeholderTextColor="#999999"
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  returnKeyType="done"
                />
              </View>

              {/* Save Changes Button */}
              <View style={styles.buttonSection}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#4A90E2" />
                ) : (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                )}
              </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    marginTop: -40,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    zIndex: 1, 
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E1E1E1',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'visible', // <-- IMPORTANT: allow edit icon outside bounds
    marginTop: -60,
    marginLeft: 20,
    position: 'relative',
    zIndex: 2,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadIconContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    alignItems: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#333333',
    minHeight: 48,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    marginBottom:16,
    overflow: 'hidden',
    zIndex: 1,
  },
  picker: {
    height: 48,
  },
  locationContainer: {
    marginBottom: 0,
    // zIndex: 1,
  },
  placesContainer: {
    flex: 0,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#333333',
    minHeight: 48,
  },
  locationListView: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonSection: {
    padding: 20,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  editLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  editLocationText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  profileLoadingOverlay: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  coverLoadingOverlay: {
    width: '100%',
    height: '100%',
  },
  coverEditButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker for better contrast
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
  profileEditButton: {
    position: 'absolute',
    bottom: -5, // <-- Move to bottom corner of the circle
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
});

export default EditProfile;
