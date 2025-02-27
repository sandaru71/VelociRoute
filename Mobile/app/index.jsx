import { View, ActivityIndicator } from "react-native";
import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import ColorList from "@/components/ColorList";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = await AsyncStorage.getItem("userToken"); // Get token
      if (!storedUser) {
        router.replace("/login"); // Redirect to login if not logged in
      } else {
        setUser(storedUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <ActivityIndicator size="large" />; // Show loading indicator

  return (
    <View>
      {user ? <ColorList color="#0891b2" /> : null} {/* Only show if user is logged in */}
    </View>
  );
};

export default Home;
