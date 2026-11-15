
import { NativeTabs } from "expo-router/native-tabs";

import {
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import MiniMusicPlayer from "@/components/MiniMusicPlayer";
import { Colors } from "@/constants/theme";
import { useMusicPlayer } from "@/context/MusicPlayerContext";

export default function AppTabs() {
  const scheme = useColorScheme();

  const colors =
    Colors[scheme === "dark" ? "dark" : "light"];

  const insets = useSafeAreaInsets();

  const { currentSong } = useMusicPlayer();

  return (
    <View style={styles.container}>
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{
          selected: { color: colors.text },
        }}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>
            Home
          </NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/home.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Label>
            Library
          </NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="playlists">
          <NativeTabs.Trigger.Label>
            Playlists
          </NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="favorites">
          <NativeTabs.Trigger.Label>
            Favorites
          </NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>
            Explore
          </NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      </NativeTabs>

      {currentSong && (
        <View
          style={[
            styles.miniPlayerPosition,
            {
              bottom: insets.bottom + 55,
            },
          ]}
        >
          <MiniMusicPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11101D",
  },

  miniPlayerPosition: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
});
