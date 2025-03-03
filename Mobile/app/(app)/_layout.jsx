import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function AppLayout() {
  const { user } = useAuth();

  // If no user is signed in, redirect to the auth flow
  if (!user) {
    return <Redirect href="/start" />;
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