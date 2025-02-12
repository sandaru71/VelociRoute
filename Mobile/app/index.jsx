import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const { width } = Dimensions.get('window'); // Get screen width

const DashboardScreen = () => {
  // Dropdown states
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [difficulty, setDifficulty] = useState(null);
  const [difficultyItems, setDifficultyItems] = useState([
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' }
  ]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>VelociRoute</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <DropDownPicker
          open={difficultyOpen}
          value={difficulty}
          items={difficultyItems}
          setOpen={setDifficultyOpen}
          setValue={setDifficulty}
          setItems={setDifficultyItems}
          placeholder="Difficulty Level"
          style={styles.dropdown}
          containerStyle={{ width: '90%', alignSelf: 'center' }}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>Activity Type</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>Distance</Text></TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>Elevation</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>Location</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
      </View>

      {/* Image Section */}
      <Image source={{ uri: 'https://your-image-url.com' }} style={styles.image} />

      {/* Route Details */}
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>ROUTE NAME</Text>
        <View style={styles.routeDetails}>
          <Text style={styles.detailText}>🚴 Activity: Cycling</Text>
          <Text style={styles.detailText}>⚡ Difficulty: Intermediate</Text>
          <Text style={styles.detailText}>📏 Distance: 10.00 km</Text>
          <Text style={styles.detailText}>⏳ Avg Time: hh mm</Text>
          <Text style={styles.detailText}>⛰ Elevation Gain: 500m</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.viewMapButton}><Text style={styles.buttonText}>View Map</Text></TouchableOpacity>
          <TouchableOpacity style={styles.startRideButton}><Text style={styles.buttonText}>Start Ride</Text></TouchableOpacity>
        </View>
      </View>

      {/* Pagination */}
      <View style={styles.pagination}>
        <TouchableOpacity><Text style={styles.paginationText}>{"<"}</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.paginationText}>{">"}</Text></TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fbc02d', alignItems: 'center' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  menuButton: { padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  menuText: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  // Filters
  filterContainer: { padding: 15 },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 5 },
  filterButton: { padding: 12, backgroundColor: '#fbc02d', borderRadius: 8, width: width * 0.4, alignItems: 'center' },
  filterText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  clearButton: { marginTop: 10, padding: 10, backgroundColor: '#ff5252', borderRadius: 8, alignItems: 'center' },
  clearText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Image
  image: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 10 },

  // Route Info
  routeInfo: { padding: 15, backgroundColor: '#fff' },
  routeTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  routeDetails: { marginBottom: 15 },
  detailText: { fontSize: 16, marginBottom: 5, textAlign: 'center' },

  // Buttons
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  viewMapButton: { padding: 12, backgroundColor: '#ddd', borderRadius: 8, width: width * 0.4, alignItems: 'center' },
  startRideButton: { padding: 12, backgroundColor: '#fbc02d', borderRadius: 8, width: width * 0.4, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold' },

  // Pagination
  pagination: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  paginationText: { fontSize: 20, fontWeight: 'bold' },

});

export default DashboardScreen;