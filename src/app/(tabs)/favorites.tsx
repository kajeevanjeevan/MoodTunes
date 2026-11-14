
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { songs } from "@/data/songs";

export default function FavoritesScreen() {
  const {
    favorites,
    toggleFavorite,
    clearFavorites,
  } = useFavorites();

  const [showConfirm, setShowConfirm] = useState(false);

  const favoriteSongs = songs.filter((song) =>
    favorites.includes(song.id)
  );

  const handleClearAll = () => {
    if (favoriteSongs.length === 0) {
      return;
    }

    // Native confirmation on Android
    if (Platform.OS !== "web") {
      Alert.alert(
        "Clear All Favorites",
        "Are you sure you want to remove all songs from Favorites?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear All",
            style: "destructive",
            onPress: clearFavorites,
          },
        ]
      );
    } else {
      // Custom confirmation for web
      setShowConfirm(true);
    }
  };

  const confirmClearAll = () => {
    clearFavorites();
    setShowConfirm(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <Text style={styles.heading}>
          My Favorites
        </Text>

        <Text style={styles.subtitle}>
          Your favorite offline songs
        </Text>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Favorite Songs ({favoriteSongs.length})
          </Text>

          {favoriteSongs.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel="Clear all favorites"
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#FB7185"
              />

              <Text style={styles.clearText}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Favorites List */}
        {favoriteSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="heart-outline"
              size={56}
              color="#C6A8FF"
            />

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
            <View
              key={song.id}
              style={styles.songCard}
            >
              <View style={styles.songIcon}>
                <Ionicons
                  name="musical-note-outline"
                  size={22}
                  color="#C6A8FF"
                />
              </View>

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
                style={styles.heartButton}
                onPress={() => toggleFavorite(song.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  `Remove ${song.title} from favorites`
                }
              >
                <Ionicons
                  name="heart"
                  size={23}
                  color="#FB7185"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Web Confirmation Dialog */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Clear All Favorites?
            </Text>

            <Text style={styles.modalDescription}>
              This will remove every song from your
              Favorites list. Your music files will
              not be deleted.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmClearAll}
              >
                <Text style={styles.confirmText}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },

  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#392333",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  clearText: {
    color: "#FB7185",
    fontSize: 13,
    fontWeight: "600",
  },

  songCard: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  songIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#332A44",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
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
    fontSize: 13,
    marginTop: 4,
  },

  songMeta: {
    color: "#928BA6",
    fontSize: 12,
    marginTop: 4,
  },

  heartButton: {
    padding: 8,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 65,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 10,
  },

  emptyDescription: {
    color: "#BEB6D3",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#211D30",
    padding: 24,
    borderRadius: 20,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  modalDescription: {
    color: "#BEB6D3",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#353044",
  },

  cancelText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#9F304C",
  },

  confirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
