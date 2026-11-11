
import {
  DarkTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import { FavoritesProvider } from "@/context/FavoritesContext";

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <FavoritesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />

          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: "Settings",
              headerStyle: {
                backgroundColor: "#11101D",
              },
              headerTintColor: "#FFFFFF",
            }}
          />

          <Stack.Screen name="song/[id]" />

          <Stack.Screen name="player/[id]" />
        </Stack>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
