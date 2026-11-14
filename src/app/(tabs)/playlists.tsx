
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { songs } from "@/data/songs";

type Playlist = {
  id: string;
  name: string;
  emoji: string;
  songIds: number[];
};

const STORAGE_KEY = "@moodtunes_playlists";

const initialPlaylists: Playlist[] = [
  { id: "1", name: "Happy Vibes", emoji: "😊", songIds: [] },
  { id: "2", name: "Relax & Chill", emoji: "🌿", songIds: [] },
  { id: "3", name: "Study Focus", emoji: "📚", songIds: [] },
];

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [createVisible, setCreateVisible] = useState(false);
  const [addSongsVisible, setAddSongsVisible] = useState(false);

  const [newName, setNewName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<string | null>(null);
  const [selectedSongIds, setSelectedSongIds] =
    useState<number[]>([]);

  const savingRef = useRef(false);

  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId
  );

  // Load playlists from AsyncStorage
  useEffect(() => {
    let active = true;

    const loadPlaylists = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        let loaded: Playlist[] = initialPlaylists;

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (!Array.isArray(parsed)) {
            throw new Error("Invalid playlist data");
          }

          loaded = parsed.map((item): Playlist => {
            const rawSongIds: unknown[] = Array.isArray(
              item?.songIds
            )
              ? item.songIds
              : [];

            const validSongIds: number[] =
              rawSongIds.filter(
                (id): id is number =>
                  typeof id === "number" &&
                  songs.some((song) => song.id === id)
              );

            return {
              id: String(item?.id ?? ""),
              name: String(
                item?.name ?? "Untitled Playlist"
              ),
              emoji: String(item?.emoji ?? "🎵"),
              songIds: Array.from(
                new Set<number>(validSongIds)
              ),
            };
          });
        }

        if (active) {
          setPlaylists(loaded);
        }
      } catch (error) {
        console.error("Failed to load playlists:", error);

        if (active) {
          Alert.alert(
            "Loading error",
            "Could not load saved playlists."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadPlaylists();

    return () => {
      active = false;
    };
  }, []);

  // Save playlists permanently
  const savePlaylists = async (
    updated: Playlist[]
  ): Promise<boolean> => {
    if (savingRef.current) return false;

    savingRef.current = true;
    setIsSaving(true);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setPlaylists(updated);
      return true;
    } catch (error) {
      console.error("Failed to save playlists:", error);

      Alert.alert(
        "Save failed",
        "Could not save your changes. Please try again."
      );

      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // Create a new playlist
  const createPlaylist = async () => {
    if (savingRef.current) return;

    const name = newName.trim();

    if (!name) {
      Alert.alert(
        "Missing name",
        "Please enter a playlist name."
      );
      return;
    }

    const exists = playlists.some(
      (playlist) =>
        playlist.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (exists) {
      Alert.alert(
        "Duplicate playlist",
        "A playlist with this name already exists."
      );
      return;
    }

    const newPlaylist: Playlist = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name,
      emoji: "🎵",
      songIds: [],
    };

    const success = await savePlaylists([
      ...playlists,
      newPlaylist,
    ]);

    if (success) {
      setNewName("");
      setCreateVisible(false);
    }
  };

  // Open Add Songs modal
  const openAddSongs = () => {
    if (!selectedPlaylist) return;

    setSelectedSongIds([...selectedPlaylist.songIds]);
    setAddSongsVisible(true);
  };

  // Select or deselect a song
  const toggleSongSelection = (songId: number) => {
    setSelectedSongIds((previous) =>
      previous.includes(songId)
        ? previous.filter((id) => id !== songId)
        : [...previous, songId]
    );
  };

  // Save selected songs
  const saveSelectedSongs = async () => {
    if (!selectedPlaylist || savingRef.current) return;

    const updated: Playlist[] = playlists.map(
      (playlist) =>
        playlist.id === selectedPlaylist.id
          ? {
              ...playlist,
              songIds: [...selectedSongIds],
            }
          : playlist
    );

    const success = await savePlaylists(updated);

    if (success) {
      setAddSongsVisible(false);
    }
  };

  // Remove a song from playlist
  const removeSong = async (songId: number) => {
    if (!selectedPlaylist || savingRef.current) return;

    const updated: Playlist[] = playlists.map(
      (playlist) =>
        playlist.id === selectedPlaylist.id
          ? {
              ...playlist,
              songIds: playlist.songIds.filter(
                (id) => id !== songId
              ),
            }
          : playlist
    );

    await savePlaylists(updated);
  };

  // Delete playlist with confirmation
  const deletePlaylist = (playlist: Playlist) => {
    if (savingRef.current) return;

    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (savingRef.current) return;

            const updated: Playlist[] =
              playlists.filter(
                (item) => item.id !== playlist.id
              );

            const success = await savePlaylists(updated);

            if (success) {
              setSelectedPlaylistId(null);
              setAddSongsVisible(false);
            }
          },
        },
      ]
    );
  };

  // Open Song Details
  const openSongDetails = (songId: number) => {
    router.push({
      pathname: "/song/[id]",
      params: {
        id: String(songId),
      },
    });
  };

  // Selected playlist screen
  if (selectedPlaylist) {
    const playlistSongs = songs.filter((song) =>
      selectedPlaylist.songIds.includes(song.id)
    );

    return (
      <View style={styles.container}>
        <Pressable
          style={styles.backRow}
          onPress={() => setSelectedPlaylistId(null)}
          accessibilityLabel="Back to playlists"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#C6A8FF"
          />
          <Text style={styles.backText}>
            My Playlists
          </Text>
        </Pressable>

        <View style={styles.titleRow}>
          <View style={styles.titleInfo}>
            <Text style={styles.heading}>
              {selectedPlaylist.emoji}{" "}
              {selectedPlaylist.name}
            </Text>

            <Text style={styles.subtitle}>
              {playlistSongs.length} songs in this playlist
            </Text>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              deletePlaylist(selectedPlaylist)
            }
            disabled={isSaving}
            accessibilityLabel="Delete playlist"
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#FB7185"
            />
          </Pressable>
        </View>

        <Pressable
          style={styles.createButton}
          onPress={openAddSongs}
          disabled={isSaving}
        >
          <Text style={styles.createButtonText}>
            + Add Songs
          </Text>
        </Pressable>

        <FlatList
          data={playlistSongs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No songs yet. Tap Add Songs to get started.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.songCard}>
              <Pressable
                style={styles.songOpenArea}
                onPress={() =>
                  openSongDetails(item.id)
                }
              >
                <Text style={styles.songEmoji}>
                  {item.emoji}
                </Text>

                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>
                    {item.title}
                  </Text>

                  <Text style={styles.songCount}>
                    {item.artist} • {item.mood}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#C6A8FF"
                />
              </Pressable>

              <Pressable
                style={styles.removeButton}
                onPress={() =>
                  removeSong(item.id)
                }
                disabled={isSaving}
                accessibilityLabel={`Remove ${item.title}`}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={25}
                  color="#FB7185"
                />
              </Pressable>
            </View>
          )}
        />

        {/* Add Songs Modal */}
        <Modal
          visible={addSongsVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!isSaving) {
              setAddSongsVisible(false);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Add Songs
              </Text>

              <Text style={styles.modalSubtitle}>
                Select songs for {selectedPlaylist.name}
              </Text>

              <ScrollView style={styles.songSelectionList}>
                {songs.map((song) => {
                  const selected =
                    selectedSongIds.includes(song.id);

                  return (
                    <Pressable
                      key={song.id}
                      style={styles.selectSongRow}
                      onPress={() =>
                        toggleSongSelection(song.id)
                      }
                      disabled={isSaving}
                    >
                      <Text style={styles.songEmoji}>
                        {song.emoji}
                      </Text>

                      <View style={styles.playlistInfo}>
                        <Text style={styles.playlistName}>
                          {song.title}
                        </Text>

                        <Text style={styles.songCount}>
                          {song.artist}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          selected
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={25}
                        color="#C6A8FF"
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() =>
                    setAddSongsVisible(false)
                  }
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.saveButton}
                  onPress={saveSelectedSongs}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Save Songs
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Main Playlists screen
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        My Playlists 🎼
      </Text>

      <Text style={styles.subtitle}>
        Organize music for every mood
      </Text>

      <Pressable
        style={styles.createButton}
        onPress={() => setCreateVisible(true)}
        disabled={isLoading || isSaving}
      >
        <Text style={styles.createButtonText}>
          + Create Playlist
        </Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#C6A8FF"
          />
          <Text style={styles.loadingText}>
            Loading playlists...
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No playlists yet. Create your first playlist!
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.playlistCard}
              onPress={() =>
                setSelectedPlaylistId(item.id)
              }
            >
              <Text style={styles.playlistEmoji}>
                {item.emoji}
              </Text>

              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName}>
                  {item.name}
                </Text>

                <Text style={styles.songCount}>
                  {item.songIds.length} songs
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#C6A8FF"
              />
            </Pressable>
          )}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={createVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSaving) {
            setCreateVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Create Playlist
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter playlist name"
              placeholderTextColor="#9D96B2"
              value={newName}
              onChangeText={setNewName}
              maxLength={40}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setCreateVisible(false);
                  setNewName("");
                }}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={createPlaylist}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    Create
                  </Text>
                )}
              </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7F3FF",
  },
  subtitle: {
    color: "#BEB6D3",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  titleInfo: {
    flex: 1,
  },
  createButton: {
    backgroundColor: "#7954B8",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 35,
  },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  playlistEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  songCount: {
    color: "#BEB6D3",
    marginTop: 5,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  backText: {
    color: "#C6A8FF",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#392333",
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  songOpenArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  songEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  removeButton: {
    padding: 8,
    marginLeft: 5,
  },
  emptyText: {
    color: "#BEB6D3",
    textAlign: "center",
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#BEB6D3",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#29253B",
    borderRadius: 20,
    padding: 22,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalSubtitle: {
    color: "#BEB6D3",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#11101D",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  songSelectionList: {
    marginBottom: 20,
  },
  selectSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#403A55",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#4A4657",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#7954B8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
