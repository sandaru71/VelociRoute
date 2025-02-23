import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { COLORS, FONTS, SIZES } from "../constants";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://your-server-ip:5000/api/users/user123")
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar backgroundColor={COLORS.gray} />
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Cover Image */}
        <View style={{ width: "100%" }}>
          <Image
            source={{ uri: user.backgroundImage }}
            resizeMode="cover"
            style={{ height: 228, width: "100%" }}
          />
        </View>

        {/* Profile Section */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Image
            source={{ uri: user.profileImage }}
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
          <Text style={{ ...FONTS.h3, color: COLORS.black, marginVertical: 8, fontWeight: "bold" }}>
            {user.name}
          </Text>
          <Text style={{ color: COLORS.black, ...FONTS.body4, fontFamily: "Arial" }}>
            {user.sport}
          </Text>

          {/* Location */}
          <View style={{ flexDirection: "row", marginVertical: 6, alignItems: "center" }}>
            <MaterialIcons name="location-on" size={24} color="black" />
            <Text style={{ ...FONTS.body4, marginLeft: 4, fontFamily: "Arial" }}>
              {user.location}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
