import {
  DarkTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import { FavoritesProvider } from "@/context/FavoritesContext";
import { ImportedSongsProvider } from "@/context/ImportedSongsContext";
import { ListeningHistoryProvider } from "@/context/ListeningHistoryContext";
import { MusicPlayerProvider } from "@/context/MusicPlayerContext";

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
          <ImportedSongsProvider>
            <MusicPlayerProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  contentStyle: {
                    backgroundColor: "#11101D",
                  },
                }}
              >
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />

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
            </MusicPlayerProvider>
          </ImportedSongsProvider>
        </ListeningHistoryProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
