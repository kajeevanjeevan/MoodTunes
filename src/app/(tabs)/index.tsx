
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const moods = [
  {
    id: 1,
    name: "Happy",
    emoji: "😊",
    color: "#49321D",
  },
  {
    id: 2,
    name: "Sad",
    emoji: "🌧️",
    color: "#243654",
  },
  {
    id: 3,
    name: "Calm",
    emoji: "🌿",
    color: "#23443D",
  },
  {
    id: 4,
    name: "Energetic",
    emoji: "⚡",
    color: "#522743",
  },
  {
    id: 5,
    name: "Focus",
    emoji: "🧠",
    color: "#373052",
  },
];

export default function HomeScreen() {
  // Open Settings screen
  const openSettings = () => {
    router.push("/settings");
  };

  // Open Library with selected mood
  const openMoodSongs = (moodName: string) => {
    router.push({
      pathname: "/library",
      params: {
        mood: moodName,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            MoodTunes 🎵
          </Text>

          {/* Settings icon */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
          >
            <Ionicons
              name="settings-outline"
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          How are you feeling today?
        </Text>

        {/* Mood Section */}
        <Text style={styles.sectionTitle}>
          Choose Your Mood
        </Text>

        {/* Mood Cards */}
        <View style={styles.grid}>
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodCard,
                { backgroundColor: mood.color },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                openMoodSongs(mood.name)
              }
              accessibilityRole="button"
              accessibilityLabel={`Show ${mood.name} songs`}
            >
              <Text style={styles.emoji}>
                {mood.emoji}
              </Text>

              <Text style={styles.moodName}>
                {mood.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Open Music Library */}
        <TouchableOpacity
          style={styles.navigationButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push("/library")
          }
        >
          <Text style={styles.navigationButtonText}>
            Open Music Library 🎶
          </Text>
        </TouchableOpacity>

        {/* Open Playlists */}
        <TouchableOpacity
          style={styles.navigationButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push("/playlists")
          }
        >
          <Text style={styles.navigationButtonText}>
            Open My Playlists 🎼
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Your mood. Your music. Your moment.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11101D",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#F7F3FF",
    flexShrink: 1,
  },

  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#29233D",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },

  subtitle: {
    fontSize: 16,
    color: "#BEB6D3",
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  moodCard: {
    width: "48%",
    height: 145,
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    justifyContent: "space-between",
  },

  emoji: {
    fontSize: 35,
  },

  moodName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  navigationButton: {
    backgroundColor: "#7954B8",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  navigationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  footer: {
    marginTop: 30,
    textAlign: "center",
    color: "#928BA6",
    fontSize: 13,
  },
});
