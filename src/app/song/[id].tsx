
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { songs } from "@/data/songs";

export default function SongDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { isFavorite, toggleFavorite } = useFavorites();

  const song = songs.find(
    (item) => item.id === Number(id)
  );

  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Song not found!
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/library")}
        >
          <Text style={styles.backText}>
            ← Back to Library
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.heading}>
          Song Details 🎵
        </Text>

        <View style={styles.albumCard}>
          <Text style={styles.albumEmoji}>
            {song.emoji}
          </Text>

          <Text style={styles.songTitle}>
            {song.title}
          </Text>

          <Text style={styles.artist}>
            {song.artist}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Genre</Text>
            <Text style={styles.value}>
              {song.genre}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mood</Text>
            <Text style={styles.value}>
              {song.mood}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Song ID</Text>
            <Text style={styles.value}>
              {song.id}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(song.id)}
        >
          <Text style={styles.buttonText}>
            {isFavorite(song.id)
              ? "❤️ Remove from Favorites"
              : "🤍 Add to Favorites"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.playerPlaceholder}
  onPress={() =>
    router.push({
      pathname: "/player/[id]",
      params: { id: String(song.id) },
    })
  }
>
  <Text style={styles.buttonText}>
    ▶ Open Music Player
  </Text>
</TouchableOpacity>

        <Text style={styles.note}>
          Offline audio playback will be added
          in Screen 6.
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
    paddingTop: 40,
    paddingBottom: 60,
  },

  backButton: {
    marginBottom: 25,
  },

  backText: {
    color: "#C6A8FF",
    fontSize: 16,
    fontWeight: "600",
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
  },

  albumCard: {
    backgroundColor: "#29233E",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    marginBottom: 25,
  },

  albumEmoji: {
    fontSize: 75,
    marginBottom: 20,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },

  artist: {
    color: "#BEB6D3",
    fontSize: 16,
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  label: {
    color: "#BEB6D3",
    fontSize: 15,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  favoriteButton: {
    backgroundColor: "#522743",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 15,
  },

  playerPlaceholder: {
    backgroundColor: "#7954B8",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  note: {
    color: "#928BA6",
    textAlign: "center",
    marginTop: 15,
  },

  errorText: {
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
    marginTop: 70,
    marginBottom: 20,
  },
});
