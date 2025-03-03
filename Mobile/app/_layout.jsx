import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <Stack 
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f5f5f5',
            },
            headerShadowVisible: false,
            headerShown: false
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </AuthProvider>
  );
}