import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { API_URL } from '../../../config';
import { useRouter, useFocusEffect, Stack } from "expo-router";
import { auth } from '../../../firebase/config';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert } from "react-native";
import { signOut } from "firebase/auth";
import axios from "axios";

const Profile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({
    profile: false,
    cover: false
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    preferredActivity: '',
    location: '',
    profilePhoto: null,
    coverPhoto: null,
  });
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }
      
      const token = await user.getIdToken();
      if (!token) {
        console.error('Failure to retrieve token.');
        return;
      }
      
      console.log('Fetching profile data from:', `${API_URL}/user/profile`);

      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Profile response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data:', data);
        setProfileData(data);
        
        // Check if this is a first-time user (no profile data set)
        if (!data.firstName && !data.lastName && !data.preferredActivity && !data.location) {
          router.push('editProfile');
        }
      } else if (response.status === 404) {
        // User profile not found, treat as first-time user
        router.push('editProfile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If there's an error fetching profile, might be first-time user
      router.push('editProfile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('editProfile');
  };

  const deleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No authenticated user found.");
        return;
      }
  
      // Show confirmation alert before deleting
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete your account? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await user.delete();
                Alert.alert("Success", "Your account has been deleted.");
                
                // Redirect to login screen
                router.push("/login");
              } catch (error) {
                if (error.code === "auth/requires-recent-login") {
                  Alert.alert(
                    "Re-authentication Required",
                    "Please log in again to delete your account."
                  );
                  await signOut(auth);
                  router.push("/login"); // Redirect to login for re-authentication
                } else {
                  console.error("Error deleting account:", error);
                  Alert.alert("Error", "Failed to delete account. Try again later.");
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 12, fontSize: 16, color: '#4A90E2' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <Stack.Screen 
      options={{
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 15 }}
            onPress={() => router.push('/(app)/(tabs)/')}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={fetchProfileData}
          >
            <Ionicons name="refresh" size={24} color="black" />
          </TouchableOpacity>
        )
      }}
    />
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar backgroundColor="#808080" />

      <ScrollView contentContainerStyle={{ padding: 0 }}>
        {/* Cover Image */}
        <View style={{ width: '100%', height: 228 }}>
          {imageLoading.cover && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
          <Image
            source={profileData.coverPhoto ? { uri: profileData.coverPhoto } : {uri: 'https://res.cloudinary.com/dq1hjlghb/image/upload/v1742610922/Default_cover_photo_j4tvqs.png'}}
            style={{ height: '100%', width: '100%', resizeMode: 'cover' }}
            onLoadStart={() => setImageLoading(prev => ({ ...prev, cover: true }))}
            onLoadEnd={() => setImageLoading(prev => ({ ...prev, cover: false }))}
            onError={() => setImageLoading(prev => ({ ...prev, cover: false }))}
          />
        </View>

        {/* Profile Section */}
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ position: 'relative', marginTop: -77.5 }}>
            {imageLoading.profile && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 77.5, zIndex: 1 }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <Image
              source={profileData.profilePhoto ? { uri: profileData.profilePhoto } : {uri: 'https://res.cloudinary.com/dq1hjlghb/image/upload/v1742609235/Default_Profile_picture_naanpb.jpg'}}
              style={{ height: 155, width: 155, borderRadius: 77.5, borderColor: '#4A90E2', borderWidth: 3 }}
              onLoadStart={() => setImageLoading(prev => ({ ...prev, profile: true }))}
              onLoadEnd={() => setImageLoading(prev => ({ ...prev, profile: false }))}
              onError={() => setImageLoading(prev => ({ ...prev, profile: false }))}
            />
          </View>

          <Text style={{ fontSize: 24, color: '#000000', marginVertical: 8, fontWeight: 'bold', textAlign: 'center' }}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          
          <Text style={{ color: '#4A90E2', fontSize: 16, marginBottom: 8 }}>
            {profileData.preferredActivity || 'Add your preferred activity'}
          </Text>

          {/* Location */}
          <View style={{ flexDirection: 'row', marginVertical: 8, alignItems: 'center' }}>
            <MaterialIcons name="location-on" size={24} color="#4A90E2" />
            <Text style={{ fontSize: 16, marginLeft: 8, color: '#666666' }}>
              {profileData.location || 'Add your location'}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={{ flexDirection: 'row', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E1E1E1', marginVertical: 16, width: '100%', justifyContent: 'center' }}>
            {/* Activities */}
            <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
              <Text style={{ fontSize: 24, color: '#4A90E2', fontWeight: 'bold' }}>5</Text>
              <Text style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>Activities</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A90E2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginVertical: 16 }}
            onPress={handleEditProfile}
          >
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 }}>Edit Profile</Text>
          </TouchableOpacity>

          {/*Delete button */}
          <TouchableOpacity
            style={{backgroundColor: "red", padding: 12, borderRadius: 8, marginTop: 16, marginHorizontal: 16, alignItems: 'center' }}
            onPress={deleteAccount}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}> Delete Account</Text>
          </TouchableOpacity>


          {/* View My Posts Button */}
          <TouchableOpacity
            style={{ backgroundColor: '#4A90E2', padding: 12, borderRadius: 8, marginTop: 16, marginHorizontal: 16, alignItems: 'center' }}
            onPress={() => router.push({ pathname: '/(app)/(tabs)/feed', params: { showUserPosts: 'true' } })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>View My Posts</Text>
          </TouchableOpacity>

          {/* View saved activities Button */}
          <TouchableOpacity
            style={{ backgroundColor: '#4A90E2', padding: 12, borderRadius: 8, marginTop: 16, marginHorizontal: 16, alignItems: 'center' }}
            onPress={() => router.push('../savedActivities')}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Saved Activities</Text>
          </TouchableOpacity>

          {/* View My Posts Button */}
          <TouchableOpacity
            style={{ backgroundColor: '#4A90E2', padding: 12, borderRadius: 8, marginTop: 16, marginHorizontal: 16, alignItems: 'center' }}
            onPress={() => router.push({ pathname: '/(app)/(tabs)/feed', params: { showUserPosts: 'true' } })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Planned Routes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

export default Profile;
