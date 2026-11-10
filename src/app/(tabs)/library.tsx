
import { router } from "expo-router";
import { useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { songs } from "@/data/songs";

const genres = [
  "All",
  "Pop",
  "Ambient",
  "Electronic",
  "Instrumental",
];

export default function LibraryScreen() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const { toggleFavorite, isFavorite } = useFavorites();

  const filteredSongs = songs.filter((song) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      song.title.toLowerCase().includes(searchText) ||
      song.artist.toLowerCase().includes(searchText);

    const matchesGenre =
      selectedGenre === "All" ||
      song.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          Music Library 🎶
        </Text>

        <Text style={styles.subtitle}>
          Explore your offline music
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#9D96B2"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.filterButton,
                  selectedGenre === genre &&
                    styles.activeFilter,
                ]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={styles.filterText}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>
          Songs ({filteredSongs.length})
        </Text>

        {filteredSongs.length === 0 ? (
          <Text style={styles.emptyText}>
            No songs found.
          </Text>
        ) : (
          filteredSongs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              <TouchableOpacity
                style={styles.songInfoButton}
                onPress={() =>
                  router.push({
                    pathname: "/song/[id]",
                    params: {
                      id: String(song.id),
                    },
                  })
                }
              >
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
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleFavorite(song.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite(song.id)
                    ? `Remove ${song.title} from favorites`
                    : `Add ${song.title} to favorites`
                }
              >
                <Text style={styles.heart}>
                  {isFavorite(song.id) ? "❤️" : "🤍"}
                </Text>
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

  mainScroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 50,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 15,
    color: "#BEB6D3",
    marginTop: 8,
    marginBottom: 24,
  },

  searchInput: {
    backgroundColor: "#211D30",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  filterContainer: {
    height: 48,
    marginBottom: 25,
  },

  filterContent: {
    alignItems: "center",
    gap: 10,
  },

  filterButton: {
    backgroundColor: "#211D30",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  activeFilter: {
    backgroundColor: "#7954B8",
  },

  filterText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  songCard: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 85,
  },

  songInfoButton: {
    flex: 1,
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
    marginTop: 4,
    fontSize: 12,
  },

  heart: {
    fontSize: 26,
    padding: 6,
  },

  emptyText: {
    color: "#BEB6D3",
    textAlign: "center",
    marginTop: 25,
  },
});
