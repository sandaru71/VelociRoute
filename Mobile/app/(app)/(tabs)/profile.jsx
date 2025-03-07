import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, FONTS, SIZES } from "../../../constants";
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://10.0.2.2:3000';

const Profile = () => {
  const router = useRouter();
  const auth = getAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      if (auth.currentUser) {
        const response = await axios.get(`${API_URL}/api/users/${auth.currentUser.email}`);
        setUserData(response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [auth.currentUser]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  if (loading) {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cover Image Section */}
        <View style={{ width: "100%", height: 200, backgroundColor: COLORS.lightGray }}>
          {userData?.coverImage ? (
            <Image
              source={{ uri: userData.coverImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, '#00b4d8', '#48cae4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </View>

        {/* Profile Info Section */}
        <View style={{ alignItems: 'center', marginTop: -50 }}>
          <View style={{
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
          }}>
            {userData?.profileImage ? (
              <Image
                source={{ uri: userData.profileThumbnail || userData.profileImage }}
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
                <MaterialIcons name="person" size={40} color={COLORS.primary} />
              </View>
            )}
          </View>

          <Text style={{ 
            ...FONTS.h2, 
            color: COLORS.black, 
            marginTop: 16,
            textAlign: 'center'
          }}>
            {userData?.firstName} {userData?.lastName}
          </Text>

          {userData?.sport && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginTop: 8,
              backgroundColor: 'rgba(0,0,0,0.05)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20
            }}>
              <FontAwesome5 name="running" size={16} color={COLORS.primary} />
              <Text style={{ 
                ...FONTS.body3, 
                color: COLORS.gray, 
                marginLeft: 8
              }}>
                {userData.sport}
              </Text>
            </View>
          )}

          {userData?.location && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginTop: 8
            }}>
              <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
              <Text style={{ 
                ...FONTS.body3, 
                color: COLORS.gray, 
                marginLeft: 4
              }}>
                {userData.location}
              </Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={{ 
            flexDirection: 'row', 
            marginTop: 24,
            width: '100%',
            paddingHorizontal: 32,
            justifyContent: 'space-around'
          }}>
            <StatItem 
              label="Activities"
              value={userData?.activities || 0}
              icon="directions-bike"
            />
            <StatItem 
              label="Followers"
              value={userData?.followers || 0}
              icon="people"
            />
            <StatItem 
              label="Following"
              value={userData?.following || 0}
              icon="person-add"
            />
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={() => router.push("/(app)/(tabs)/editProfile")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 32,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <MaterialIcons name="edit" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ ...FONTS.h4, color: COLORS.white }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({ label, value, icon }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{
      backgroundColor: COLORS.lightGray,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8
    }}>
      <MaterialIcons name={icon} size={24} color={COLORS.primary} />
    </View>
    <Text style={{ ...FONTS.h3, color: COLORS.black }}>{value}</Text>
    <Text style={{ ...FONTS.body4, color: COLORS.gray }}>{label}</Text>
  </View>
);

export default Profile;
