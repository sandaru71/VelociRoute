import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "../../../constants";
import { useRouter } from "expo-router";
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { getApiEndpoint } from '../../../config';

const { width } = Dimensions.get('window');

const Profile = () => {
  const router = useRouter();
  const auth = getAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('activities');
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const response = await axios.get(getApiEndpoint(`users/${auth.currentUser.email}`));
          setUserData(response.data);
          
          if (!response.data || !response.data.firstName) {
            router.push("/(app)/edit-profile");
          } else {
            fetchUserActivities();
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 404) {
          router.push("/(app)/edit-profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  const fetchUserActivities = async () => {
    setActivitiesLoading(true);
    try {
      const response = await axios.get(getApiEndpoint(`users/${auth.currentUser.email}/activities`));
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const ActivityCard = ({ activity }) => (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 15,
      padding: 15,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <MaterialIcons name={activity.type === 'cycling' ? 'directions-bike' : 'directions-run'} size={24} color={COLORS.primary} />
        <Text style={{ ...FONTS.h4, marginLeft: 10, color: COLORS.black }}>{activity.title}</Text>
      </View>
      
      {activity.image && (
        <Image 
          source={{ uri: activity.image }}
          style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }}
          resizeMode="cover"
        />
      )}
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="timer" size={20} color={COLORS.gray} />
          <Text style={{ ...FONTS.body4, marginLeft: 5, color: COLORS.gray }}>{activity.duration}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="straighten" size={20} color={COLORS.gray} />
          <Text style={{ ...FONTS.body4, marginLeft: 5, color: COLORS.gray }}>{activity.distance} km</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="speed" size={20} color={COLORS.gray} />
          <Text style={{ ...FONTS.body4, marginLeft: 5, color: COLORS.gray }}>{activity.pace} km/h</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.body3, marginTop: 10, color: COLORS.gray }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar backgroundColor={COLORS.gray} />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Cover Image */}
        <View style={{ width: "100%", height: 228 }}>
          {userData?.coverImage ? (
            <Image
              source={{ uri: userData.coverImage }}
              resizeMode="cover"
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <View style={{ height: "100%", width: "100%", backgroundColor: COLORS.primary + '20' }} />
          )}
        </View>

        {/* Profile Section */}
        <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
          {userData?.profileImage ? (
            <Image
              source={{ uri: userData.profileThumbnail || userData.profileImage }}
              resizeMode="cover"
              style={{
                height: 155,
                width: 155,
                borderRadius: 999,
                borderColor: COLORS.white,
                borderWidth: 4,
                marginTop: -77,
              }}
            />
          ) : (
            <View style={{
              height: 155,
              width: 155,
              borderRadius: 999,
              borderColor: COLORS.white,
              borderWidth: 4,
              marginTop: -77,
              backgroundColor: COLORS.lightGray,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialIcons name="person" size={80} color={COLORS.primary} />
            </View>
          )}

          <Text style={{ ...FONTS.h2, color: COLORS.black, marginTop: 12 }}>
            {userData ? `${userData.firstName} ${userData.lastName}` : 'Update Profile'}
          </Text>
          
          <Text style={{ ...FONTS.body3, color: COLORS.gray, marginTop: 4 }}>
            {userData?.sport || 'Add your sport'}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(app)/edit-profile")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 8,
              borderRadius: 20,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="edit" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, ...FONTS.body4 }}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", marginTop: 16, alignItems: "center" }}>
            <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
            <Text style={{ ...FONTS.body4, marginLeft: 4, color: COLORS.gray }}>
              {userData?.location || 'Add your location'}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={{
            flexDirection: "row",
            marginTop: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: COLORS.lightGray,
            width: '100%',
            justifyContent: 'space-around'
          }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...FONTS.h3, color: COLORS.black }}>{userData?.followers?.length || 0}</Text>
              <Text style={{ ...FONTS.body4, color: COLORS.gray }}>Followers</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...FONTS.h3, color: COLORS.black }}>{userData?.following?.length || 0}</Text>
              <Text style={{ ...FONTS.body4, color: COLORS.gray }}>Following</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...FONTS.h3, color: COLORS.black }}>{activities.length}</Text>
              <Text style={{ ...FONTS.body4, color: COLORS.gray }}>Activities</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={{
            flexDirection: 'row',
            width: '100%',
            marginTop: 20,
            borderBottomWidth: 1,
            borderColor: COLORS.lightGray,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === 'activities' ? COLORS.primary : 'transparent'
              }}
              onPress={() => setActiveTab('activities')}
            >
              <Text style={{
                ...FONTS.body3,
                color: activeTab === 'activities' ? COLORS.primary : COLORS.gray,
                fontWeight: activeTab === 'activities' ? 'bold' : 'normal'
              }}>Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === 'routes' ? COLORS.primary : 'transparent'
              }}
              onPress={() => setActiveTab('routes')}
            >
              <Text style={{
                ...FONTS.body3,
                color: activeTab === 'routes' ? COLORS.primary : COLORS.gray,
                fontWeight: activeTab === 'routes' ? 'bold' : 'normal'
              }}>Routes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities/Routes Content */}
        <View style={{ padding: 16 }}>
          {activeTab === 'activities' ? (
            activitiesLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : activities.length > 0 ? (
              activities.map((activity, index) => (
                <ActivityCard key={index} activity={activity} />
              ))
            ) : (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <MaterialIcons name="directions-run" size={48} color={COLORS.gray} />
                <Text style={{ ...FONTS.body3, color: COLORS.gray, marginTop: 12 }}>No activities posted yet</Text>
              </View>
            )
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <MaterialIcons name="map" size={48} color={COLORS.gray} />
              <Text style={{ ...FONTS.body3, color: COLORS.gray, marginTop: 12 }}>Routes coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
