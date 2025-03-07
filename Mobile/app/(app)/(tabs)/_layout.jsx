import { Tabs } from 'expo-router';
import TabBar from '../../../components/TabBar';
import { COLORS } from '../../../constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false
      }}
      tabBar={props => {
        // Hide tab bar for record screen and editProfile
        const routeName = props.state.routes[props.state.index].name;
        if (props.state.index === 2 || routeName === 'editProfile') {
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
      <Tabs.Screen
        name="editProfile"
        options={{
          href: null, // This prevents the tab from showing in the tab bar
          headerShown: true,
          headerTitle: "Edit Profile",
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackVisible: true,
          headerBackTitle: "Back",
        }}
      />
    </Tabs>
  );
}
