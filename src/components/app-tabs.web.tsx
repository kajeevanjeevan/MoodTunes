
import type { TabTriggerSlotProps } from "expo-router/ui";

import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
} from "expo-router/ui";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type TabButtonProps = TabTriggerSlotProps & {
  children?: React.ReactNode;
};

function TabButton({
  ref: _ref,
  children,
  isFocused,
  ...props
}: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{
        selected: isFocused,
      }}
      style={[
        styles.tabButton,
        isFocused && styles.activeTab,
      ]}
    >
      <Text
        style={[
          styles.tabText,
          isFocused && styles.activeTabText,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />

      <TabList asChild>
        <View style={styles.tabBar}>
          <TabTrigger
            name="home"
            href="/"
            asChild
          >
            <TabButton>Home</TabButton>
          </TabTrigger>

          <TabTrigger
            name="library"
            href="/library"
            asChild
          >
            <TabButton>Library</TabButton>
          </TabTrigger>

          <TabTrigger
            name="playlists"
            href="/playlists"
            asChild
          >
            <TabButton>Playlists</TabButton>
          </TabTrigger>

          <TabTrigger
            name="favorites"
            href="/favorites"
            asChild
          >
            <TabButton>Favorites</TabButton>
          </TabTrigger>

          <TabTrigger
            name="explore"
            href="/explore"
            asChild
          >
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#211D30",
    borderTopWidth: 1,
    borderTopColor: "#39304F",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
  },

  activeTab: {
    backgroundColor: "#7954B8",
  },

  tabText: {
    color: "#BEB6D3",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
