
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
            contentStyle: {
              backgroundColor: "#11101D",
            },
          }}
        >
          {/* Main bottom navigation */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          {/* Settings screen */}
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: "Settings",
              headerStyle: {
                backgroundColor: "#11101D",
              },
              headerTintColor: "#FFFFFF",
              headerBackVisible: true,
            }}
          />

          {/* Song Details screen */}
          <Stack.Screen
            name="song/[id]"
            options={{
              headerShown: true,
              title: "Song Details",
              headerStyle: {
                backgroundColor: "#11101D",
              },
              headerTintColor: "#FFFFFF",
              headerBackVisible: true,
            }}
          />

          {/* Music Player screen */}
          <Stack.Screen
            name="player/[id]"
            options={{
              headerShown: true,
              title: "Music Player",
              headerStyle: {
                backgroundColor: "#11101D",
              },
              headerTintColor: "#FFFFFF",
              headerBackVisible: true,
            }}
          />
        </Stack>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
