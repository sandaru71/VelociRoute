import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/'); // Redirect to the main app when logged in
    }
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}