import { View, ActivityIndicator } from "react-native";
import "react-native-get-random-values";
import React from "react";
import { useAuth } from '../../contexts/AuthContext';
import ColorList from "../../components/ColorList";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <ColorList color="#0891b2" />
    </View>
  );
}