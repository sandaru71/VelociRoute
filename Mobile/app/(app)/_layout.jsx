import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiEndpoint } from '../../config';

export default function AppLayout() {
  const { user } = useAuth();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [checkingUserStatus, setCheckingUserStatus] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        try {
          const response = await axios.get(getApiEndpoint(`users/${user.email}`));
          setIsFirstTimeUser(!response.data || !response.data.firstName);
        } catch (error) {
          if (error.response?.status === 404) {
            setIsFirstTimeUser(true);
          }
        }
        setCheckingUserStatus(false);
      }
    };

    checkUserProfile();
  }, [user]);

  // If no user is signed in, redirect to the auth flow
  if (!user) {
    return <Redirect href="/start" />;
  }

  // If checking user status, return null to prevent flash of content
  if (checkingUserStatus) {
    return null;
  }

  // If first time user, redirect to edit profile
  if (isFirstTimeUser) {
    return <Redirect href="/(app)/edit-profile" />;
  }

  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="post"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Save Activity',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
          }}
        />
      </Stack>
    </PaperProvider>
  );
}