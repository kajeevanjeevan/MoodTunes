
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AnimatedEqualizer from "@/components/AnimatedEqualizer";
import { useImportedSongs } from "@/context/ImportedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { songs } from "@/data/songs";

type Playlist = {
  id: string;
  name: string;
  emoji: string;
  songIds: number[];
};

const STORAGE_KEY = "@moodtunes_playlists";

const initialPlaylists: Playlist[] = [
  {
    id: "1",
    name: "Happy Vibes",
    emoji: "😊",
    songIds: [],
  },
  {
    id: "2",
    name: "Relax & Chill",
    emoji: "🌿",
    songIds: [],
  },
  {
    id: "3",
    name: "Study Focus",
    emoji: "📚",
    songIds: [],
  },
];

export default function PlaylistsScreen() {
  const {
    importedSongs,
    isLoaded: importsLoaded,
  } = useImportedSongs();

  const {
    selectSong,
    currentSongId,
    playing,
  } = useMusicPlayer();

  const allSongs = [...songs, ...importedSongs];

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);

  const [editingPlaylistId, setEditingPlaylistId] =
    useState<string | null>(null);

  const [playlistName, setPlaylistName] = useState("");

  const [addSongsVisible, setAddSongsVisible] =
    useState(false);

  const [selectedSongIds, setSelectedSongIds] =
    useState<number[]>([]);

  const [songSearch, setSongSearch] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Playlist | null>(null);

  const savingRef = useRef(false);

  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId
  );

  // Load saved playlists.
  useEffect(() => {
    let active = true;

    const loadPlaylists = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_KEY
        );

        let loaded: Playlist[] = initialPlaylists;

        if (saved !== null) {
          const parsed: unknown = JSON.parse(saved);

          if (!Array.isArray(parsed)) {
            throw new Error("Invalid playlist data.");
          }

          loaded = parsed
            .filter(
              (item) =>
                item !== null &&
                typeof item === "object"
            )
            .map((item): Playlist => {
              const rawIds: unknown[] = Array.isArray(
                item.songIds
              )
                ? item.songIds
                : [];

              const validIds = rawIds.filter(
                (id): id is number =>
                  typeof id === "number" &&
                  Number.isFinite(id)
              );

              return {
                id: String(item.id ?? ""),
                name: String(
                  item.name ?? "Untitled Playlist"
                ),
                emoji: String(item.emoji ?? "🎵"),
                songIds: Array.from(new Set(validIds)),
              };
            });
        }

        if (active) {
          setPlaylists(loaded);
        }
      } catch (error) {
        console.error(
          "Failed to load playlists:",
          error
        );
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

  // Save playlists permanently.
  const savePlaylists = async (
    updated: Playlist[]
  ): Promise<boolean> => {
    if (
      savingRef.current ||
      isLoading ||
      !importsLoaded
    ) {
      return false;
    }

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
      console.error(
        "Failed to save playlists:",
        error
      );
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // Open Create Playlist form.
  const openCreateForm = () => {
    setEditingPlaylistId(null);
    setPlaylistName("");
    setFormVisible(true);
  };

  // Open Rename Playlist form.
  const openRenameForm = (playlist: Playlist) => {
    setEditingPlaylistId(playlist.id);
    setPlaylistName(playlist.name);
    setFormVisible(true);
  };

  const closeForm = () => {
    if (savingRef.current) return;

    setFormVisible(false);
    setEditingPlaylistId(null);
    setPlaylistName("");
  };

  // Create or rename a playlist.
  const savePlaylistForm = async () => {
    if (savingRef.current) return;

    const name = playlistName.trim();

    if (!name) return;

    const duplicate = playlists.some(
      (playlist) =>
        playlist.name.toLowerCase() ===
          name.toLowerCase() &&
        playlist.id !== editingPlaylistId
    );

    if (duplicate) return;

    let updated: Playlist[];

    if (editingPlaylistId !== null) {
      updated = playlists.map((playlist) =>
        playlist.id === editingPlaylistId
          ? { ...playlist, name }
          : playlist
      );
    } else {
      const newPlaylist: Playlist = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name,
        emoji: "🎵",
        songIds: [],
      };

      updated = [...playlists, newPlaylist];
    }

    const success = await savePlaylists(updated);

    if (success) {
      setFormVisible(false);
      setEditingPlaylistId(null);
      setPlaylistName("");
    }
  };

  // Open Add Songs modal.
  const openAddSongs = () => {
    if (!selectedPlaylist) return;

    setSelectedSongIds([
      ...selectedPlaylist.songIds,
    ]);

    setSongSearch("");
    setAddSongsVisible(true);
  };

  // Select or deselect a song.
  const toggleSongSelection = (id: number) => {
    setSelectedSongIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  // Save selected songs.
  const saveSelectedSongs = async () => {
    if (!selectedPlaylist || savingRef.current) return;

    const updated = playlists.map((playlist) =>
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

  // Remove a song from playlist only.
  const removeSong = async (id: number) => {
    if (!selectedPlaylist || savingRef.current) return;

    const updated = playlists.map((playlist) =>
      playlist.id === selectedPlaylist.id
        ? {
            ...playlist,
            songIds: playlist.songIds.filter(
              (songId) => songId !== id
            ),
          }
        : playlist
    );

    await savePlaylists(updated);
  };

  // Delete playlist without deleting MP3 files.
  const confirmDeletePlaylist = async () => {
    if (!deleteTarget || savingRef.current) return;

    const updated = playlists.filter(
      (playlist) => playlist.id !== deleteTarget.id
    );

    const success = await savePlaylists(updated);

    if (success) {
      setSelectedPlaylistId(null);
      setAddSongsVisible(false);
      setDeleteTarget(null);
    }
  };

  // Open shared Music Player.
  const openPlayer = (id: number) => {
    selectSong(id);

    router.push({
      pathname: "/player/[id]",
      params: {
        id: String(id),
      },
    });
  };

  const availableSongIds = new Set(
    allSongs.map((song) => song.id)
  );

  const filteredSelectionSongs = allSongs.filter(
    (song) => {
      const query = songSearch.trim().toLowerCase();

      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }
  );

  // Add Songs modal.
  const renderSongSelector = () => (
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
            Choose built-in or imported songs.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Search songs or artists..."
            placeholderTextColor="#9D96B2"
            value={songSearch}
            onChangeText={setSongSearch}
          />

          <ScrollView style={styles.songSelectionList}>
            {filteredSelectionSongs.length === 0 ? (
              <Text style={styles.emptyText}>
                No matching songs found.
              </Text>
            ) : (
              filteredSelectionSongs.map((song) => {
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
                        {song.artist} • {song.mood}
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
              })
            )}
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
              onPress={() =>
                void saveSelectedSongs()
              }
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
  );

  // Create / Rename modal.
  const renderPlaylistForm = () => {
    const duplicate = playlists.some(
      (playlist) =>
        playlist.name.toLowerCase() ===
          playlistName.trim().toLowerCase() &&
        playlist.id !== editingPlaylistId
    );

    return (
      <Modal
        visible={formVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingPlaylistId
                ? "Rename Playlist"
                : "Create Playlist"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter playlist name"
              placeholderTextColor="#9D96B2"
              value={playlistName}
              onChangeText={setPlaylistName}
              maxLength={40}
            />

            {duplicate && (
              <Text style={styles.errorText}>
                A playlist with this name already exists.
              </Text>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeForm}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  (!playlistName.trim() ||
                    duplicate ||
                    isSaving) &&
                    styles.disabled,
                ]}
                onPress={() =>
                  void savePlaylistForm()
                }
                disabled={
                  !playlistName.trim() ||
                  duplicate ||
                  isSaving
                }
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {editingPlaylistId
                      ? "Save"
                      : "Create"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Delete confirmation modal.
  const renderDeleteConfirmation = () => (
    <Modal
      visible={deleteTarget !== null}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isSaving) {
          setDeleteTarget(null);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            Delete Playlist?
          </Text>

          <Text style={styles.modalSubtitle}>
            Delete "{deleteTarget?.name}"?
            {"\n\n"}
            Your songs and imported MP3 files will
            not be deleted.
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setDeleteTarget(null)
              }
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteConfirmButton}
              onPress={() =>
                void confirmDeletePlaylist()
              }
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Individual playlist screen.
  if (selectedPlaylist) {
    const playlistSongs = selectedPlaylist.songIds
      .map((id) =>
        allSongs.find((song) => song.id === id)
      )
      .filter(
        (song): song is (typeof allSongs)[number] =>
          song !== undefined
      );

    return (
      <View style={styles.container}>
        <Pressable
          style={styles.backRow}
          onPress={() =>
            setSelectedPlaylistId(null)
          }
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
              {playlistSongs.length} songs
            </Text>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() =>
              openRenameForm(selectedPlaylist)
            }
            disabled={isSaving}
            accessibilityLabel="Rename playlist"
          >
            <Ionicons
              name="create-outline"
              size={22}
              color="#C6A8FF"
            />
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              setDeleteTarget(selectedPlaylist)
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
          disabled={isSaving || !importsLoaded}
        >
          <Text style={styles.createButtonText}>
            + Add Songs
          </Text>
        </Pressable>

        <FlatList
          data={playlistSongs}
          keyExtractor={(item) =>
            String(item.id)
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No available songs yet.
              {"\n"}
              Tap Add Songs to get started.
            </Text>
          }
          renderItem={({ item }) => {
            // Animate only the song currently playing.
            const isCurrentlyPlaying =
              currentSongId === item.id && playing;

            return (
              <View
                style={[
                  styles.songCard,
                  isCurrentlyPlaying &&
                    styles.activeSongCard,
                ]}
              >
                <Pressable
                  style={styles.songOpenArea}
                  onPress={() =>
                    openPlayer(item.id)
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

                  {/* Only ONE indicator is displayed */}
                  {isCurrentlyPlaying ? (
                    <AnimatedEqualizer />
                  ) : (
                    <Ionicons
                      name="play-circle-outline"
                      size={25}
                      color="#C6A8FF"
                    />
                  )}
                </Pressable>

                <Pressable
                  style={styles.removeButton}
                  onPress={() =>
                    void removeSong(item.id)
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
            );
          }}
        />

        {renderSongSelector()}
        {renderPlaylistForm()}
        {renderDeleteConfirmation()}
      </View>
    );
  }

  // Main playlists screen.
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
        onPress={openCreateForm}
        disabled={
          isLoading ||
          isSaving ||
          !importsLoaded
        }
      >
        <Text style={styles.createButtonText}>
          + Create Playlist
        </Text>
      </Pressable>

      {isLoading || !importsLoaded ? (
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
          renderItem={({ item }) => {
            const count = item.songIds.filter(
              (id) => availableSongIds.has(id)
            ).length;

            return (
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
                    {count} songs
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#C6A8FF"
                />
              </Pressable>
            );
          }}
        />
      )}

      {renderPlaylistForm()}
      {renderDeleteConfirmation()}
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#F7F3FF",
  },

  subtitle: {
    color: "#BEB6D3",
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "bold",
  },

  songCount: {
    color: "#BEB6D3",
    marginTop: 5,
    fontSize: 13,
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

  iconButton: {
    backgroundColor: "#332A44",
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
  },

  deleteButton: {
    backgroundColor: "#392333",
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
  },

  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },

  // Purple highlight for the currently playing song.
  activeSongCard: {
    backgroundColor: "#35264F",
    borderWidth: 1,
    borderColor: "#9869E3",
  },

  songOpenArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  songEmoji: {
    fontSize: 26,
    marginRight: 14,
  },

  removeButton: {
    padding: 8,
    marginLeft: 5,
  },

  emptyText: {
    color: "#BEB6D3",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    lineHeight: 22,
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
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#29253B",
    borderRadius: 20,
    padding: 22,
    maxHeight: "85%",
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
    lineHeight: 22,
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
    flexGrow: 0,
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
    justifyContent: "center",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#7954B8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteConfirmButton: {
    flex: 1,
    backgroundColor: "#9F304C",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  errorText: {
    color: "#FB7185",
    fontSize: 13,
    marginBottom: 15,
  },

  disabled: {
    opacity: 0.5,
  },
});
