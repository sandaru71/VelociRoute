import { View, Text } from 'react-native';
import React from 'react';
import { Tabs, TabsProps } from 'expo-router';
import TabBar from '@/components/TabBar';

const _layout: React.FC = () => {
  return (
    <Tabs
      tabBar={(props: TabsProps['tabBar']) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
};

export default _layout;
