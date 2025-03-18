import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { API_URL } from '../../../config';
import { useRouter, useFocusEffect } from "expo-router";
import { auth } from '../../../firebase/config';

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
  const [activeTab, setActiveTab] = useState('posts');

  // Fetch profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [])
  );

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
          router.push('/editProfile');
        }
      } else if (response.status === 404) {
        // User profile not found, treat as first-time user
        router.push('/editProfile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If there's an error fetching profile, might be first-time user
      router.push('/editProfile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/editProfile');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyStateText}>No posts yet</Text>
          </View>
        );
      case 'saved':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyStateText}>No saved routes</Text>
          </View>
        );
      case 'planned':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyStateText}>No planned routes</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#808080" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {imageLoading.cover && (
            <View style={styles.coverLoadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
          <Image
            source={profileData.coverPhoto ? { uri: profileData.coverPhoto } : require('../../../assets/galle face green.png')}
            style={styles.coverImage}
            onLoadStart={() => setImageLoading(prev => ({ ...prev, cover: true }))}
            onLoadEnd={() => setImageLoading(prev => ({ ...prev, cover: false }))}
            onError={() => setImageLoading(prev => ({ ...prev, cover: false }))}
          />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {imageLoading.profile && (
              <View style={styles.profileLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <Image
              source={profileData.profilePhoto ? { uri: profileData.profilePhoto } : require('../../../assets/galle face green.png')}
              style={styles.profileImage}
              onLoadStart={() => setImageLoading(prev => ({ ...prev, profile: true }))}
              onLoadEnd={() => setImageLoading(prev => ({ ...prev, profile: false }))}
              onError={() => setImageLoading(prev => ({ ...prev, profile: false }))}
            />
          </View>

          <Text style={styles.userName}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          
          <Text style={styles.activityText}>
            {profileData.preferredActivity || 'Add your preferred activity'}
          </Text>

          {/* Location */}
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={24} color="#4A90E2" />
            <Text style={styles.locationText}>
              {profileData.location || 'Add your location'}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {/* Activities */}
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Tabs Section */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <MaterialIcons 
                name="article" 
                size={24} 
                color={activeTab === 'posts' ? '#4A90E2' : '#666666'} 
              />
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
              onPress={() => setActiveTab('saved')}
            >
              <MaterialIcons 
                name="bookmark" 
                size={24} 
                color={activeTab === 'saved' ? '#4A90E2' : '#666666'} 
              />
              <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
                Saved
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'planned' && styles.activeTab]}
              onPress={() => setActiveTab('planned')}
            >
              <MaterialIcons 
                name="map" 
                size={24} 
                color={activeTab === 'planned' ? '#4A90E2' : '#666666'} 
              />
              <Text style={[styles.tabText, activeTab === 'planned' && styles.activeTabText]}>
                Planned
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 0,
  },
  coverContainer: {
    width: '100%',
    height: 228,
  },
  coverImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  profileSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -77.5,
  },
  profileImage: {
    height: 155,
    width: 155,
    borderRadius: 77.5,
    borderColor: '#4A90E2',
    borderWidth: 3,
  },
  userName: {
    fontSize: 24,
    color: '#000000',
    marginVertical: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activityText: {
    color: '#4A90E2',
    fontSize: 16,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E1E1E1',
    marginVertical: 16,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 24,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginVertical: 16,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tabContent: {
    width: '100%',
    minHeight: 200,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A90E2',
  },
  coverLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 77.5,
    zIndex: 1,
  },
};

export default Profile;
