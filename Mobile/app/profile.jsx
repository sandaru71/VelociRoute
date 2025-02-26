import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

// Temporary constants until you set up your constants file
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
};

const FONTS = {
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  h4: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body4: {
    fontSize: 14,
  },
};

const API_URL = "http://10.0.2.2:5000"; // Use 10.0.2.2 for Android emulator, localhost for iOS

const Profile = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // For testing, we'll use a query parameter for email
      const response = await axios.get(`${API_URL}/api/users/profile?email=test@example.com`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user?.username) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4A90E2', '#50E3C2']}
          style={styles.emptyContainer}
        >
          <Text style={styles.emptyTitle}>Welcome to VelociRoute!</Text>
          <Text style={styles.emptySubtitle}>Complete your profile to get started</Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.gray} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={[styles.coverContainer, { backgroundColor: '#4A90E2' }]}>
          {user.backgroundImage ? (
            <View
              style={styles.coverImage}
            />
          ) : null}
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.profileImage, { backgroundColor: '#50E3C2' }]}>
            {user.profileImage ? (
              <View
                style={styles.profileImage}
              />
            ) : (
              <MaterialIcons name="person" size={60} color="#fff" />
            )}
          </View>
          <Text style={styles.userName}>{user.username}</Text>
          <Text style={styles.userSport}>{user.sport}</Text>

          {/* Location */}
          {user.location && (
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={24} color="black" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0 km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0 m</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Activity Calendar</Text>
          <Calendar
            markedDates={{}}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: COLORS.primary,
              dayTextColor: '#2d4150',
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  updateButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  updateButtonText: {
    color: "#4A90E2",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 12,
  },
  coverContainer: {
    width: "100%",
    height: 228,
    borderRadius: 15,
    overflow: "hidden",
  },
  coverImage: {
    height: "100%",
    width: "100%",
  },
  profileSection: {
    flex: 1,
    alignItems: "center",
  },
  profileImage: {
    height: 155,
    width: 155,
    borderRadius: 999,
    borderColor: COLORS.primary,
    borderWidth: 2,
    marginTop: -90,
  },
  userName: {
    ...FONTS.h3,
    color: COLORS.black,
    marginVertical: 8,
    fontWeight: "bold",
  },
  userSport: {
    color: COLORS.black,
    ...FONTS.body4,
    fontFamily: "Arial",
  },
  locationContainer: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "center",
  },
  locationText: {
    ...FONTS.body4,
    marginLeft: 4,
    fontFamily: "Arial",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...FONTS.h3,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  calendarContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: 10,
  },
});

export default Profile;
