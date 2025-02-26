import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import axios from "axios";

const Profile = () => {
  const userEmail = "user@example.com"; // Replace with actual user email (from Firebase Auth)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/profile/${userEmail}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {profile.profileImage ? (
        <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
      ) : (
        <Text>No Profile Image</Text>
      )}
      <Text style={styles.name}>{profile.name || "No Name"}</Text>
      <Text style={styles.email}>{profile.email}</Text>
      <Text style={styles.sport}>{profile.sport || "No Sport Selected"}</Text>
      <Text style={styles.location}>{profile.location || "No Location"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  email: {
    fontSize: 16,
    color: "gray",
  },
  sport: {
    fontSize: 18,
    marginTop: 10,
  },
  location: {
    fontSize: 18,
  },
});

export default Profile;
