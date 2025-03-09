import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { COLORS, FONTS, SIZES } from "../../../constants";
import { useRouter } from "expo-router";
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { getApiEndpoint } from '../../../config';

const Profile = () => {
  const router = useRouter();
  const auth = getAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const response = await axios.get(getApiEndpoint(`users/${auth.currentUser.email}`));
          setUserData(response.data);
          
          // Redirect to edit profile if first time user (no profile data)
          if (!response.data || !response.data.firstName) {
            router.push("/(app)/editProfile");
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 404) {
          // User not found in database, redirect to edit profile
          router.push("/(app)/editProfile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.body3, marginTop: 10, color: COLORS.gray }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.white,
      }}
    >
      <StatusBar backgroundColor={COLORS.gray} />

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Cover Image */}
        <View style={{ width: "100%" }}>
          {userData?.coverImage ? (
            <Image
              source={{ uri: userData.coverImage }}
              resizeMode="cover"
              style={{
                height: 228,
                width: "100%",
              }}
            />
          ) : (
            <View
              style={{
                height: 228,
                width: "100%",
                backgroundColor: COLORS.primary + '20', // Using primary color with 20% opacity
              }}
            />
          )}
        </View>

        {/* Profile Section */}
        <View style={{ flex: 1, alignItems: "center" }}>
          {userData?.profileImage ? (
            <Image
              source={{ uri: userData.profileThumbnail || userData.profileImage }}
              resizeMode="cover"
              style={{
                height: 155,
                width: 155,
                borderRadius: 999,
                borderColor: COLORS.primary,
                borderWidth: 2,
                marginTop: -90,
              }}
            />
          ) : (
            <View style={{
              height: 155,
              width: 155,
              borderRadius: 999,
              borderColor: COLORS.primary,
              borderWidth: 2,
              marginTop: -90,
              backgroundColor: COLORS.lightGray,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialIcons name="person" size={80} color={COLORS.primary} />
            </View>
          )}

          <Text
            style={{
              ...FONTS.h3,
              color: COLORS.black,
              marginVertical: 8,
              fontWeight: "bold",
            }}
          >
            {userData ? `${userData.firstName} ${userData.lastName}` : 'Update Profile'}
          </Text>
          <Text
            style={{
              color: COLORS.black,
              ...FONTS.body4,
              fontFamily: 'Arial'
            }}
          >
            {userData?.sport || 'Add your sport'}
          </Text>

          {/* Edit Profile Button */}
          {/* <TouchableOpacity
            onPress={() => router.push("/(app)/editProfile")}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              marginTop: 10,
            }}
          >
            <Text style={{ color: COLORS.white, ...FONTS.body4 }}>Edit Profile</Text>
          </TouchableOpacity> */}

          {/* Location */}
          <View
            style={{
              flexDirection: "row",
              marginVertical: 6,
              alignItems: "center",
            }}
          >
            <MaterialIcons name="location-on" size={24} color="black" />
            <Text
              style={{
                ...FONTS.body4,
                marginLeft: 4,
                fontFamily: 'Arial'
              }}
            >
              {userData?.location || 'Add your location'}
            </Text>
          </View>

          {/* Stats Section */}
          <View
            style={{
              flex: 1,
              paddingVertical: 8,
              flexDirection: "row",
            }}
          >
            {/* Followers */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                {userData?.followers?.length || 0}
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight: 'bold',
                }}
              >
                Followers
              </Text>
            </View>

            {/* Followings */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                {userData?.following?.length || 0}
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight: 'bold',
                }}
              >
                Following
              </Text>
            </View>

            {/* Activities */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                {userData?.activities?.length || 0}
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight: 'bold',
                }}
              >
                Activities
              </Text>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/(app)/editProfile")}
              style={{
                width: 124,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.white,
                  fontWeight: "bold",
                }}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <View style={{ width: '100%', marginTop: 20 }}>
            <Calendar
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.black,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.black,
                textDisabledColor: COLORS.gray,
                dotColor: COLORS.primary,
                selectedDotColor: COLORS.white,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.black,
                textDayFontFamily: 'Arial',
                textMonthFontFamily: 'Arial',
                textDayHeaderFontFamily: 'Arial',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16
              }}
              markedDates={userData?.activities?.reduce((acc, activity) => {
                const date = new Date(activity.date).toISOString().split('T')[0];
                acc[date] = { marked: true };
                return acc;
              }, {}) || {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
