import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This hides the default header globally */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
