
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

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

const moods = [
  "All",
  "Happy",
  "Sad",
  "Calm",
  "Energetic",
  "Focus",
];

export default function LibraryScreen() {
  const { mood } = useLocalSearchParams<{
    mood?: string;
  }>();

  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");

  const { toggleFavorite, isFavorite } = useFavorites();

  // Apply mood selected from Home screen
  useEffect(() => {
    if (
      typeof mood === "string" &&
      moods.includes(mood)
    ) {
      setSelectedMood(mood);
    } else {
      setSelectedMood("All");
    }
  }, [mood]);

  // Filter songs by search and mood
  const filteredSongs = songs.filter((song) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      song.title.toLowerCase().includes(searchText) ||
      song.artist.toLowerCase().includes(searchText);

    const matchesMood =
      selectedMood === "All" ||
      song.mood === selectedMood;

    return matchesSearch && matchesMood;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedMood("All");
    router.setParams({ mood: undefined });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>
          Music Library 🎶
        </Text>

        <Text style={styles.subtitle}>
          Discover music that matches your mood
        </Text>

        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#9D96B2"
          value={search}
          onChangeText={setSearch}
        />

        {/* Mood Filter */}
        <Text style={styles.filterLabel}>
          Filter by Mood
        </Text>

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {moods.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  selectedMood === item &&
                    styles.activeFilter,
                ]}
                onPress={() => {
                  setSelectedMood(item);

                  router.setParams({
                    mood:
                      item === "All"
                        ? undefined
                        : item,
                  });
                }}
              >
                <Text style={styles.filterText}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Clear Filters */}
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearFilters}
        >
          <Text style={styles.clearButtonText}>
            Clear All Filters
          </Text>
        </TouchableOpacity>

        {/* Song Count */}
        <Text style={styles.sectionTitle}>
          Songs ({filteredSongs.length})
        </Text>

        {/* Song List */}
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
              {/* Song Details */}
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
                    Mood: {song.mood}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity
                onPress={() =>
                  toggleFavorite(song.id)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite(song.id)
                    ? `Remove ${song.title} from favorites`
                    : `Add ${song.title} to favorites`
                }
              >
                <Text style={styles.heart}>
                  {isFavorite(song.id)
                    ? "❤️"
                    : "🤍"}
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

  filterLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  filterContainer: {
    height: 48,
    marginBottom: 20,
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

  clearButton: {
    alignSelf: "flex-start",
    marginBottom: 25,
    paddingVertical: 8,
  },

  clearButtonText: {
    color: "#B69AF0",
    fontWeight: "600",
    fontSize: 14,
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
