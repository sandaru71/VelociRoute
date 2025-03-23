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
      
      console.log('Fetching profile data from:', `${API_URL}/api/user/profile`);

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/(auth)/start');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#FEBE15" />
          <Text style={{ marginTop: 12, fontSize: 16, color: '#FEBE15' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <>
    <Stack.Screen 
      options={{
        headerTitle: "Profile",
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 10 }}>
            <TouchableOpacity onPress={fetchProfileData}>
              <Ionicons name="reload" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        ),
      }}
    />
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar backgroundColor="#808080" />

      <ScrollView contentContainerStyle={{ padding: 0, paddingBottom: 120 }}>
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
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16, marginBottom: 40 }}>
          <View style={{ position: 'relative', marginTop: -77.5 }}>
            {imageLoading.profile && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 77.5, zIndex: 1 }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <Image
              source={profileData.profilePhoto ? { uri: profileData.profilePhoto } : {uri: 'https://res.cloudinary.com/dq1hjlghb/image/upload/v1742609235/Default_Profile_picture_naanpb.jpg'}}
              style={{ height: 155, width: 155, borderRadius: 77.5, borderColor: '#FEBE15', borderWidth: 3 }}
              onLoadStart={() => setImageLoading(prev => ({ ...prev, profile: true }))}
              onLoadEnd={() => setImageLoading(prev => ({ ...prev, profile: false }))}
              onError={() => setImageLoading(prev => ({ ...prev, profile: false }))}
            />
          </View>

          <Text style={{ fontSize: 24, color: '#000000', marginVertical: 8, fontWeight: 'bold', textAlign: 'center' }}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          
          <Text style={{ color: '#666666', fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>
            {profileData.preferredActivity || 'Add your preferred activity'}
          </Text>

          {/* Location */}
          <View style={{ flexDirection: 'row', marginVertical: 8, alignItems: 'center' }}>
            <MaterialIcons name="location-on" size={24} color="#FEBE15" />
            <Text style={{ fontSize: 16, marginLeft: 8, color: '#666666', fontWeight: 'bold' }}>
              {profileData.location || 'Add your location'}
            </Text>
          </View>

          {/* Edit Profile and Delete Account Buttons Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', paddingHorizontal: 16, marginVertical: 16, gap: 16 }}>
            {/* Edit Profile Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 25,
                borderColor: '#FEBE15',
                borderWidth: 3,
                elevation: 5,
                flex: 1
              }}
              onPress={handleEditProfile}
            >
              <MaterialIcons name="edit" size={20} color="#000000" />
              <Text style={{ fontSize: 16, color: '#000000', fontWeight: 'bold', marginLeft: 8, textAlign: 'center' }}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 25,
                borderColor: 'red',
                borderWidth: 3,
                elevation: 5,
                flex: 1
              }}
              onPress={deleteAccount}
            >
              <MaterialIcons name="delete" size={20} color="#FF0000" />
              <Text style={{ fontSize: 16, color: '#000000', fontWeight: 'bold', marginLeft: 8, textAlign: 'center' }}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          {/* View saved activities Button */}
          <TouchableOpacity
            style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginVertical: 16,borderColor:'#FEBE15',borderWidth: 3, elevation: 5}}
            onPress={() => router.push('../savedActivities')}
          >
            <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold', marginLeft: 8,textAlign: 'center' }}>Saved Activities</Text>
          </TouchableOpacity>

          {/* View Planned Routes Button */}
          <TouchableOpacity
            style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginVertical: 16,borderColor:'#FEBE15',borderWidth: 3, elevation: 5}}
            onPress={() => router.push('../saved_routes')}
          >
            <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold', marginLeft: 8,textAlign: 'center' }}>Planned Routes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

export default Profile;
