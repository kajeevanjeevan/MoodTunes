
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { songs } from "@/data/songs";

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteSongs = songs.filter((song) =>
    favorites.includes(song.id)
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          My Favorites ❤️
        </Text>

        <Text style={styles.subtitle}>
          Your favorite offline songs
        </Text>

        <Text style={styles.sectionTitle}>
          Favorite Songs ({favoriteSongs.length})
        </Text>

        {favoriteSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🤍</Text>

            <Text style={styles.emptyTitle}>
              No favorite songs yet
            </Text>

            <Text style={styles.emptyDescription}>
              Open Music Library and tap the heart
              beside a song to add it here.
            </Text>
          </View>
        ) : (
          favoriteSongs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              <Text style={styles.songEmoji}>
                {song.emoji}
              </Text>

              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>
                  {song.title}
                </Text>

                <Text style={styles.songArtist}>
                  {song.artist}
                </Text>

                <Text style={styles.songMeta}>
                  {song.genre} • {song.mood}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(song.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  `Remove ${song.title} from favorites`
                }
              >
                <Text style={styles.heart}>❤️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 50,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#BEB6D3",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 30,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },

  songCard: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  songEmoji: {
    fontSize: 30,
    marginRight: 14,
  },

  songInfo: {
    flex: 1,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  songArtist: {
    color: "#BEB6D3",
    marginTop: 4,
  },

  songMeta: {
    color: "#928BA6",
    fontSize: 12,
    marginTop: 4,
  },

  heart: {
    fontSize: 26,
    padding: 6,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 65,
    paddingHorizontal: 20,
  },

  emptyEmoji: {
    fontSize: 55,
    marginBottom: 18,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
  },

  emptyDescription: {
    color: "#BEB6D3",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
