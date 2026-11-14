
import {
  DarkTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import { FavoritesProvider } from "@/context/FavoritesContext";
import { ListeningHistoryProvider } from "@/context/ListeningHistoryContext";

// MoodTunes dark purple theme
const MoodTunesTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#11101D",
    card: "#11101D",
    border: "#29253B",
    text: "#FFFFFF",
    primary: "#C6A8FF",
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={MoodTunesTheme}>
      <FavoritesProvider>
        <ListeningHistoryProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: {
                backgroundColor: "#11101D",
              },
            }}
          >
            {/* Main bottom tabs */}
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
        </ListeningHistoryProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
