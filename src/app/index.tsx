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
  { id: 1, name: "Happy", emoji: "😊", color: "#49321D" },
  { id: 2, name: "Sad", emoji: "🌧️", color: "#243654" },
  { id: 3, name: "Calm", emoji: "🌿", color: "#23443D" },
  { id: 4, name: "Energetic", emoji: "⚡", color: "#522743" },
  { id: 5, name: "Focus", emoji: "🧠", color: "#373052" },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>MoodTunes 🎵</Text>

        <Text style={styles.subtitle}>
          How are you feeling today?
        </Text>

        <Text style={styles.sectionTitle}>
          Choose Your Mood
        </Text>

        <View style={styles.grid}>
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodCard,
                { backgroundColor: mood.color },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                // Mood filtering will be implemented later.
              }}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={styles.moodName}>{mood.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
  style={styles.libraryButton}
  onPress={() => router.push("/library")}
>
  <Text style={styles.libraryButtonText}>
    Open Music Library 🎶
  </Text>
</TouchableOpacity>

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
  content: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#F7F3FF",
    marginBottom: 10,
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
  footer: {
    marginTop: 30,
    textAlign: "center",
    color: "#928BA6",
    fontSize: 13,
  },

  libraryButton: {
  backgroundColor: "#7954B8",
  padding: 16,
  borderRadius: 14,
  alignItems: "center",
  marginTop: 20,
},

libraryButtonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "bold",
},
});
