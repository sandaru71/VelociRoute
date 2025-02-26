import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary } from "../utils/cloudinary"; // We'll create this utility next

const EditProfile = ({ navigation }) => {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const userEmail = "user@example.com"; // Replace with actual user email

  // Function to handle image selection
  const selectImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.cancelled) {
      setProfileImage(result.uri);
    }
  };

  // Function to handle profile update
  const handleUpdateProfile = async () => {
    try {
      const imageUrl = profileImage ? await uploadImageToCloudinary(profileImage) : null;

      const response = await axios.put(`http://localhost:5000/api/users/profile/${userEmail}`, {
        name,
        sport,
        location,
        profileImage: imageUrl,
      });

      Alert.alert("Profile updated successfully!", response.data);
      navigation.goBack(); // Navigate back after updating
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Failed to update profile.");
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Select Profile Image" onPress={selectImage} />
      {profileImage && <Image source={{ uri: profileImage }} style={styles.profileImage} />}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Sport"
        value={sport}
        onChangeText={setSport}
        style={styles.input}
      />
      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />
      <Button title="Update Profile" onPress={handleUpdateProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
});

export default EditProfile;
