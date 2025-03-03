import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import TabBar from '../components/TabBar'

const _layout = () => {
  return (
    <Tabs
        tabBar={props => {
            // Hide tab bar for record screen
            if (props.state.index === 2) { // index 2 is the record screen
                return null;
            }
            return <TabBar {...props} />;
        }}
    >
        <Tabs.Screen
            name="index"
            options={{
                title: "Home"
            }}
        />
        <Tabs.Screen
            name="planner"
            options={{
                title: "Planner"
            }}
        />
        <Tabs.Screen
            name="record"
            options={{
                title: "Record",
                headerShown: true
            }}
        />
        <Tabs.Screen
            name="feed"
            options={{
                title: "Feed"
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile"
            }}
        />
    </Tabs>
  )
}

export default _layout