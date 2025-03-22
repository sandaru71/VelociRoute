import React from 'react';
import { Tabs } from 'expo-router'; 
import TabBar from '../components/TabBar'; // your custom tab bar

export default function Layout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="planner"
        options={{ title: 'Planner' }}
      />

      {/* ADD THIS for Feed */}
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed' }}
      />

      <Tabs.Screen
        name="record"
        options={{ title: 'Record' }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}
