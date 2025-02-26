import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-chart-kit';

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded stats for demo
  const stats = {
    totalDistance: '1,234 km',
    totalTime: '120 hours',
    totalActivities: '45',
    elevationGain: '5,678 m',
  };

  // Hardcoded chart data for demo
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43],
    }],
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // TODO: Replace with actual user email from auth
      const response = await fetch('http://localhost:3000/api/profile?email=test@example.com');
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const EmptyProfile = () => (
    <LinearGradient
      colors={['rgba(74, 144, 226, 0.9)', 'rgba(99, 179, 237, 0.9)']}
      style={styles.emptyContainer}
    >
      <Text style={styles.emptyTitle}>Complete Your Profile</Text>
      <Text style={styles.emptySubtitle}>Add your details to get started</Text>
      <TouchableOpacity
        style={styles.updateButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.updateButtonText}>Update Profile</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userData?.username) {
    return <EmptyProfile />;
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4a90e2', '#63b3ed']}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <Image
            source={userData.profileImage ? { uri: userData.profileImage } : require('../../assets/default-avatar.png')}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.username}>@{userData.username}</Text>
          <Text style={styles.location}>{userData.location}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>245</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12.4K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Stats</Text>
        <View style={styles.statsGrid}>
          {Object.entries(stats).map(([key, value]) => (
            <View key={key} style={styles.statBox}>
              <Text style={styles.statBoxValue}>{value}</Text>
              <Text style={styles.statBoxLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Calendar</Text>
        <Calendar
          markedDates={{
            '2025-02-26': { marked: true, dotColor: '#4a90e2' },
            '2025-02-24': { marked: true, dotColor: '#4a90e2' },
            '2025-02-20': { marked: true, dotColor: '#4a90e2' },
          }}
          theme={{
            todayTextColor: '#4a90e2',
            selectedDayBackgroundColor: '#4a90e2',
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Trends</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 5,
  },
  statBoxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  updateButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  updateButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfilePage;