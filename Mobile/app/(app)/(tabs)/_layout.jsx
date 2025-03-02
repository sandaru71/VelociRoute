import { Tabs } from 'expo-router';
import TabBar from '../../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false
      }}
      tabBar={props => <TabBar {...props} />}
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
          title: "Record"
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
  );
}
