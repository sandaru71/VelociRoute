import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { user } = useAuth();

  // If no user is signed in, redirect to the auth flow
  if (!user) {
    return <Redirect href="/start" />;
  }

  return (
    <Tabs tabBar={props => <TabBar {...props} />}>
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