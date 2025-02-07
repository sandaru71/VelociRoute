import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Start from "./Start";
import Login from "./Login";



const Stack = createNativeStackNavigator();

const Index = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown:false,}}>
      <Stack.Screen name="Start" component={Start} />
      <Stack.Screen name="Login" component={Login} />

      
    </Stack.Navigator>
  );
  
};

export default Index;

const styles = StyleSheet.create({});
