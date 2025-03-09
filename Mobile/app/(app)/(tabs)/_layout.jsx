import { Tabs } from 'expo-router';
import TabBar from '../../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false
      }}
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
          headerShown: true // Show header for record screen
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
