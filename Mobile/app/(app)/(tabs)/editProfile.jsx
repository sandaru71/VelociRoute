import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { COLORS, FONTS, SIZES } from "../../../constants";
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const API_URL = 'http://10.0.2.2:3000';

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const response = await axios.get(`${API_URL}/api/users/${auth.currentUser.email}`);
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
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
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
          const response = await axios.post(`${API_URL}/api/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
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
              coverImage: response.data.cover || response.data.url,
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

      if (!formData.firstName || !formData.lastName || !formData.sport || !formData.location) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);

      const userData = {
        ...formData,
        email: auth.currentUser.email,
        updatedAt: new Date(),
      };

      await axios.put(`${API_URL}/api/users/${auth.currentUser.email}`, userData);

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.push("/(app)/(tabs)/profile")
        }
      ]);
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
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image Section */}
        <View style={{ width: "100%", height: 200, backgroundColor: COLORS.lightGray }}>
          {formData.coverImage ? (
            <Image
              source={{ uri: formData.coverImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, '#00b4d8', '#48cae4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", height: "100%", justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 20,
                borderRadius: 20,
                alignItems: 'center'
              }}>
                <MaterialIcons name="add-photo-alternate" size={40} color="white" />
                <Text style={{ ...FONTS.body3, color: 'white', marginTop: 8, textAlign: 'center' }}>Add Cover Photo</Text>
              </View>
            </LinearGradient>
          )}
          <TouchableOpacity
            onPress={() => pickImage('cover')}
            style={{
              position: 'absolute',
              right: 20,
              bottom: 20,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <Ionicons name="camera" size={20} color={COLORS.primary} />
            <Text style={{ ...FONTS.body4, color: COLORS.primary, marginLeft: 8, fontWeight: '600' }}>
              {formData.coverImage ? 'Change Cover' : 'Add Cover'}
            </Text>
          </TouchableOpacity>
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
            icon={<MaterialIcons name="person" size={22} color={COLORS.primary} />}
          />

          <CustomInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            placeholder="Enter your last name"
            icon={<MaterialIcons name="person-outline" size={22} color={COLORS.primary} />}
          />

          <CustomInput
            label="Sport"
            value={formData.sport}
            onChangeText={(text) => setFormData(prev => ({ ...prev, sport: text }))}
            placeholder="Enter your preferred sport"
            icon={<FontAwesome5 name="running" size={20} color={COLORS.primary} />}
          />

          <CustomInput
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Enter your location"
            icon={<MaterialIcons name="location-on" size={22} color={COLORS.primary} />}
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
              <>
                <MaterialIcons name="check" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={{ ...FONTS.h4, color: COLORS.white }}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CustomInput = ({ label, value, onChangeText, placeholder, icon, required = true }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{ 
      ...FONTS.body4, 
      marginBottom: 8, 
      color: COLORS.gray,
      fontWeight: '600',
      paddingLeft: 4,
    }}>
      {label}{required && <Text style={{ color: COLORS.primary }}>*</Text>}
    </Text>
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <BlurView intensity={80} tint="light" style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
      }}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={{
            ...FONTS.body3,
            color: COLORS.black,
            flex: 1,
            marginLeft: 12,
            height: 24,
          }}
          placeholderTextColor={COLORS.gray}
        />
      </BlurView>
    </View>
  </View>
);

export default EditProfile;
