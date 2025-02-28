import { Tabs, Redirect } from 'expo-router';
import TabBar from '../../components/TabBar';
import { useAuth } from '../../contexts/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();

  // If not authenticated, redirect to welcome
  if (!user) {
    return <Redirect href="/auth/welcome" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen 
        name="planner"
        options={{
          title: "Planner",
        }}
      />
      <Tabs.Screen 
        name="record"
        options={{
          title: "Record",
        }}
      />
      <Tabs.Screen 
        name="feed"
        options={{
          title: "Feed",
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
}