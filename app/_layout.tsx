import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/[id]"
          options={{
            headerShown: true,
            headerTitle: '경기 상세',
            headerBackTitle: '뒤로',
            headerStyle: { backgroundColor: '#1D3557' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '700' },
          }}
        />
      </Stack>
    </>
  );
}
