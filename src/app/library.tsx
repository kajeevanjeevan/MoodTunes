
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Temporary sample song data
const songs = [
  {
    id: 1,
    title: "Sunny Morning",
    artist: "MoodTunes Studio",
    genre: "Pop",
    mood: "Happy",
    emoji: "☀️",
  },
  {
    id: 2,
    title: "Quiet Rain",
    artist: "MoodTunes Studio",
    genre: "Ambient",
    mood: "Sad",
    emoji: "🌧️",
  },
  {
    id: 3,
    title: "Peaceful Garden",
    artist: "MoodTunes Studio",
    genre: "Ambient",
    mood: "Calm",
    emoji: "🌿",
  },
  {
    id: 4,
    title: "Electric Pulse",
    artist: "MoodTunes Studio",
    genre: "Electronic",
    mood: "Energetic",
    emoji: "⚡",
  },
  {
    id: 5,
    title: "Deep Focus",
    artist: "MoodTunes Studio",
    genre: "Instrumental",
    mood: "Focus",
    emoji: "🧠",
  },
];

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

  // Search and filter songs
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
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          Music Library 🎶
        </Text>

        <Text style={styles.subtitle}>
          Explore your offline music
        </Text>

        {/* Search box */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#9D96B2"
          value={search}
          onChangeText={setSearch}
        />

        {/* Genre filters */}
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

        {/* Song count */}
        <Text style={styles.sectionTitle}>
          Songs ({filteredSongs.length})
        </Text>

        {/* Temporary debugging message */}
        <Text style={styles.debugText}>
          Total songs: {songs.length} | Visible songs:{" "}
          {filteredSongs.length}
        </Text>

        {/* Song list */}
        {filteredSongs.length === 0 ? (
          <Text style={styles.emptyText}>
            No songs found.
          </Text>
        ) : (
          filteredSongs.map((song) => (
            <View
              key={song.id}
              style={styles.songCard}
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

              <Text style={styles.musicIcon}>
                ♫
              </Text>
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
    color: "#F7F3FF",
  },

  subtitle: {
    fontSize: 15,
    color: "#BEB6D3",
    marginTop: 8,
    marginBottom: 25,
  },

  searchInput: {
    backgroundColor: "#29253B",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 14,
    fontSize: 15,
    marginBottom: 20,
  },

  filterContainer: {
    height: 48,
    marginBottom: 25,
  },

  filterContent: {
    alignItems: "center",
    paddingRight: 10,
  },

  filterButton: {
    backgroundColor: "#29253B",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 20,
    marginRight: 10,
  },

  activeFilter: {
    backgroundColor: "#7954B8",
  },

  filterText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },

  debugText: {
    color: "yellow",
    fontSize: 15,
    marginBottom: 15,
  },

  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#211D30",
    padding: 14,
    borderRadius: 15,
    marginBottom: 12,
    minHeight: 85,
  },

  songEmoji: {
    fontSize: 32,
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
    fontSize: 13,
  },

  songMeta: {
    color: "#A38DCE",
    marginTop: 5,
    fontSize: 12,
  },

  musicIcon: {
    color: "#C6A8FF",
    fontSize: 24,
  },

  emptyText: {
    color: "#BEB6D3",
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
});
