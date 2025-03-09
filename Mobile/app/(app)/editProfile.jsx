import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Stack } from "expo-router";
import { COLORS, FONTS, SIZES } from "../../constants";
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiEndpoint } from '../../config';

const { width } = Dimensions.get('window');

const EditProfile = () => {
  const router = useRouter();
  const auth = getAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    sport: "",
    location: "",
    profileImage: null,
    profileThumbnail: null,
    coverImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const response = await axios.get(getApiEndpoint(`users/${auth.currentUser.email}`));
          const userData = response.data;
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            sport: userData.sport || "",
            location: userData.location || "",
            profileImage: userData.profileImage || null,
            profileThumbnail: userData.profileThumbnail || null,
            coverImage: userData.coverImage || null,
          });
          setIsFirstTimeUser(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 404) {
          setIsFirstTimeUser(true);
        } else {
          Alert.alert('Error', 'Failed to load profile data. Please try again.');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const ext = match?.[1] ?? 'jpg';

        formData.append('image', {
          uri,
          name: `${type}_${Date.now()}.${ext}`,
          type: `image/${ext}`,
        });

        setLoading(true);
        try {
          const response = await axios.post(getApiEndpoint('upload'), formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });

          if (type === 'profile') {
            setFormData(prev => ({
              ...prev,
              profileImage: response.data.url,
              profileThumbnail: response.data.thumbnail,
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              coverImage: response.data.url,
            }));
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to update your profile');
        return;
      }

      // Validate required fields
      const requiredFields = {
        firstName: 'First Name',
        lastName: 'Last Name',
        sport: 'Preferred Activity',
        location: 'Location'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !formData[key])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        Alert.alert(
          'Required Fields',
          `Please fill in the following fields:\n${missingFields.join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);

      const userData = {
        ...formData,
        email: auth.currentUser.email,
        updatedAt: new Date(),
      };

      await axios.put(getApiEndpoint(`users/${auth.currentUser.email}`), userData);

      Alert.alert(
        isFirstTimeUser ? 'Welcome!' : 'Success',
        isFirstTimeUser ? 'Your profile has been created successfully!' : 'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.push("/(app)/(tabs)/profile") }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.body3, marginTop: 10, color: COLORS.gray }}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: isFirstTimeUser ? "Complete Your Profile" : "Edit Profile",
          headerTitleStyle: {
            ...FONTS.h3,
            color: COLORS.black,
          },
          headerLeft: () => (
            !isFirstTimeUser && (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={"black"} />
              </TouchableOpacity>
            )
          ),
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerShadowVisible: true,
        }}
      />
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image Section */}
        <View style={{ width: "100%", marginBottom: 20 }}>
          {formData.coverImage ? (
            <Image
              source={{ uri: formData.coverImage }}
              style={{
                width: "100%",
                height: 228,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 228,
                backgroundColor: COLORS.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => pickImage('cover')}
                style={{
                  padding: 12,
                  backgroundColor: COLORS.white,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="add-photo-alternate" size={24} color={COLORS.primary} />
                <Text style={{ ...FONTS.body4, color: COLORS.primary, marginLeft: 8 }}>Add Cover Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Image Section */}
        <View style={{ alignItems: 'center', marginTop: -50, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => pickImage('profile')}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: COLORS.white,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: COLORS.white,
              overflow: 'hidden',
            }}
          >
            {formData.profileImage ? (
              <Image
                source={{ uri: formData.profileThumbnail || formData.profileImage }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ 
                alignItems: 'center',
                backgroundColor: COLORS.lightGray,
                width: '100%',
                height: '100%',
                justifyContent: 'center'
              }}>
                <MaterialIcons name="person-add" size={40} color={COLORS.primary} />
              </View>
            )}
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 35,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}>
              <Ionicons name="camera" size={16} color="white" />
              <Text style={{ ...FONTS.body5, color: 'white', marginLeft: 4 }}>
                {formData.profileImage ? 'Change' : 'Add'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={{ 
          padding: 20,
          marginHorizontal: 16,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <Text style={{ 
            ...FONTS.h3, 
            color: COLORS.black, 
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Personal Information
          </Text>

          <CustomInput
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            placeholder="Enter your first name"
            icon="person"
            required={true}
          />

          <CustomInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            placeholder="Enter your last name"
            icon="person-outline"
            required={true}
          />

          <CustomInput
            label="Sport"
            value={formData.sport}
            onChangeText={(text) => setFormData(prev => ({ ...prev, sport: text }))}
            placeholder="Enter your preferred sport"
            icon="directions-run"
            required={true}
          />

          <CustomInput
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Enter your location"
            icon="location-on"
            required={true}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? COLORS.gray : COLORS.primary,
              padding: 16,
              borderRadius: 12,
              marginTop: 24,
              alignItems: "center",
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text style={{ ...FONTS.h4, color: COLORS.white }}>Saving...</Text>
              </>
            ) : (
              <Text style={{ ...FONTS.h4, color: COLORS.white }}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CustomInput = ({ label, value, onChangeText, placeholder, icon, required = true }) => {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        ...FONTS.h4,
        color: COLORS.black,
        marginBottom: 8,
        fontWeight: '600'
      }}>
        {label} {required && <Text style={{ color: COLORS.primary }}>*</Text>}
      </Text>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
      }}>
        <MaterialIcons name={icon} size={24} color={COLORS.primary} style={{ marginRight: 12 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          style={{
            flex: 1,
            ...FONTS.body3,
            color: COLORS.black,
            fontWeight: '500'
          }}
        />
      </View>
    </View>
  );
};

export default EditProfile;
