import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"; // For icons

const Planner = () => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={24} color="#A0A0A0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Where are you going to?"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* Sample points on the map */}
        <View style={[styles.mapPoint, { top: "40%", left: "30%" }]} />
        <View style={[styles.mapPoint, { top: "50%", left: "50%" }]} />
        <View style={[styles.mapPoint, { top: "60%", left: "20%" }]} />
        <View style={[styles.mapPoint, { top: "70%", left: "60%" }]} />
        <View style={[styles.currentLocation, { top: "50%", left: "40%" }]} />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <MaterialIcons name="navigation" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {/* Bookmark Button */}
        <TouchableOpacity style={styles.bookmarkButton}>
          <FontAwesome name="bookmark" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Start Button */}
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 10,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  mapContainer: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  mapPoint: {
    position: "absolute",
    width: 15,
    height: 15,
    backgroundColor: "#D3D3D3",
    borderRadius: 7.5,
  },
  currentLocation: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  floatingButton: {
    position: "absolute",
    bottom: 150,
    right: 20,
    backgroundColor: "#FFA500",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bottomButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    position: "absolute",
    bottom: 20,
    width: width - 40,
    alignSelf: "center",
  },
  bookmarkButton: {
    backgroundColor: "#FFD700",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  startButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Planner;
