
import { audioSources } from "@/data/audio";
import { songs } from "@/data/songs";
import { Ionicons } from "@expo/vector-icons";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function SettingsScreen() {
  const offlineSongs = songs.filter(
    (song) => audioSources[song.id] != null
  ).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="settings-outline"
          size={32}
          color="#A78BFA"
        />
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Customize your MoodTunes experience
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          App Information
        </Text>
        <Text style={styles.label}>
          Application: MoodTunes
        </Text>
        <Text style={styles.label}>
          Version: 1.0.0
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Appearance
        </Text>
        <Text style={styles.label}>
          Theme: Dark
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Offline Music
        </Text>
        <Text style={styles.label}>
          Total Songs: {songs.length}
        </Text>
        <Text style={styles.label}>
          Available Offline: {offlineSongs}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          About MoodTunes
        </Text>
        <Text style={styles.description}>
          MoodTunes is an offline music application
          that helps users discover songs based on
          their mood. Users can explore music,
          create playlists, and save favorites.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101827",
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },
  subtitle: {
    color: "#AAB4C5",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1C2638",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    color: "#A78BFA",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 10,
  },
  description: {
    color: "#C5CDDA",
    fontSize: 14,
    lineHeight: 23,
  },
});
