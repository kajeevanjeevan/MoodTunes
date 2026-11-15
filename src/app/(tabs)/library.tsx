
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import {
  useImportedSongs,
  type ImportedSong,
} from "@/context/ImportedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { songs } from "@/data/songs";

const moods = [
  "All",
  "Happy",
  "Sad",
  "Calm",
  "Energetic",
  "Focus",
];

const songMoods = moods.filter((mood) => mood !== "All");

type PendingFile = {
  name: string;
  uri: string;
};

export default function LibraryScreen() {
  const { mood } = useLocalSearchParams<{
    mood?: string;
  }>();

  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");

  const [isImporting, setIsImporting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedSong, setSelectedSong] =
    useState<ImportedSong | null>(null);

  const [showRemoveConfirm, setShowRemoveConfirm] =
    useState(false);

  // New: MP3 information form.
  const [pendingFile, setPendingFile] =
    useState<PendingFile | null>(null);

  const [editingSong, setEditingSong] =
    useState<ImportedSong | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formArtist, setFormArtist] = useState("");
  const [formMood, setFormMood] = useState("Happy");

  const { toggleFavorite, isFavorite } = useFavorites();

  const {
    importedSongs,
    isLoaded,
    addImportedSong,
    updateImportedSong,
    removeImportedSong,
  } = useImportedSongs();

  const { selectSong, stopAndClearSong } = useMusicPlayer();

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

  const searchText = search.trim().toLowerCase();

  const matchesFilters = (song: {
    title: string;
    artist: string;
    mood: string;
  }) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchText) ||
      song.artist.toLowerCase().includes(searchText);

    const matchesMood =
      selectedMood === "All" ||
      song.mood === selectedMood;

    return matchesSearch && matchesMood;
  };

  const filteredBuiltInSongs = songs.filter(matchesFilters);

  const filteredImportedSongs =
    importedSongs.filter(matchesFilters);

  const clearFilters = () => {
    setSearch("");
    setSelectedMood("All");
    router.setParams({ mood: undefined });
  };

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  // Keep working direct playback navigation.
  const openPlayer = (songId: number) => {
    selectSong(songId);

    router.push({
      pathname: "/player/[id]",
      params: { id: String(songId) },
    });
  };

  const resetSongForm = () => {
    setPendingFile(null);
    setEditingSong(null);
    setFormTitle("");
    setFormArtist("");
    setFormMood("Happy");
  };

  const closeSongForm = () => {
    if (isSaving || isImporting) return;
    resetSongForm();
  };

  // STEP A: Choose MP3 from phone.
  const handleImportSong = async () => {
    if (
      isImporting ||
      isSaving ||
      isRemoving ||
      !isLoaded
    ) {
      return;
    }

    if (Platform.OS === "web") {
      showMessage(
        "Import on Mobile",
        "Please use MoodTunes on your phone to import MP3 files."
      );
      return;
    }

    setIsImporting(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/mpeg",
        copyToCacheDirectory: false,
        multiple: false,
      });

      if (result.canceled) return;

      const selectedFile = result.assets[0];

      if (!selectedFile) {
        throw new Error(
          "No file was returned by the file picker."
        );
      }

      if (!selectedFile.name.toLowerCase().endsWith(".mp3")) {
        showMessage(
          "Unsupported File",
          "Please select an MP3 audio file."
        );
        return;
      }

      const suggestedTitle =
        selectedFile.name
          .replace(/\.mp3$/i, "")
          .replace(/[_-]+/g, " ")
          .trim() || "Imported Song";

      setFormTitle(suggestedTitle);
      setFormArtist("");
      setFormMood("Happy");
      setEditingSong(null);

      setPendingFile({
        name: selectedFile.name,
        uri: selectedFile.uri,
      });
    } catch (error) {
      console.error("MP3 selection failed:", error);

      showMessage(
        "Import Failed",
        error instanceof Error
          ? error.message
          : String(error)
      );
    } finally {
      setIsImporting(false);
    }
  };

  // STEP B: Copy the MP3 and save its information.
  const saveNewImportedSong = async () => {
    if (
      !pendingFile ||
      !isLoaded ||
      isSaving ||
      isRemoving
    ) {
      return;
    }

    const title = formTitle.trim();

    if (!title) {
      showMessage(
        "Title Required",
        "Please enter a song title."
      );
      return;
    }

    const artist =
      formArtist.trim() || "Unknown Artist";

    const selectedMoodValue = formMood;

    setIsSaving(true);

    let copiedFile: File | null = null;
    let importStep = "Preparing music folder";

    try {
      const musicDirectory = new Directory(
        Paths.document,
        "moodtunes-music"
      );

      musicDirectory.create({
        idempotent: true,
        intermediates: true,
      });

      importStep = "Generating song ID";

      const existingIds = [
        ...songs.map((song) => song.id),
        ...importedSongs.map((song) => song.id),
      ];

      let newId = Math.max(
        Date.now(),
        ...existingIds.map((id) => id + 1)
      );

      while (existingIds.includes(newId)) {
        newId++;
      }

      importStep = "Preparing destination file";

      const destinationFile = new File(
        musicDirectory,
        `song-${newId}.mp3`
      );

      if (destinationFile.exists) {
        throw new Error(
          "A song with this ID already exists."
        );
      }

      importStep = "Copying MP3 into app storage";

      // Preserve the Android file-copy method
      // that already works in your project.
      await FileSystemLegacy.copyAsync({
        from: pendingFile.uri,
        to: destinationFile.uri,
      });

      copiedFile = destinationFile;

      if (!destinationFile.exists) {
        throw new Error(
          "The MP3 file was not saved successfully."
        );
      }

      const newSong: ImportedSong = {
        id: newId,
        title,
        artist,
        genre: "Other",
        mood: selectedMoodValue,
        emoji: "🎵",
        uri: destinationFile.uri,
      };

      importStep = "Saving song information";

      await addImportedSong(newSong);

      copiedFile = null;
      resetSongForm();

      showMessage(
        "Import Successful",
        `"${title}" was imported with the "${selectedMoodValue}" mood.`
      );
    } catch (error) {
      console.error(
        "Failed to import song:",
        importStep,
        error
      );

      if (copiedFile?.exists) {
        try {
          copiedFile.delete();
        } catch (cleanupError) {
          console.error(
            "Cannot clean up copied MP3:",
            cleanupError
          );
        }
      }

      showMessage(
        "Import Failed",
        `Step: ${importStep}\n\nError: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openSongMenu = (song: ImportedSong) => {
    if (isRemoving || isSaving) return;
    setSelectedSong(song);
  };

  const closeSongMenu = () => {
    if (isRemoving) return;

    setSelectedSong(null);
    setShowRemoveConfirm(false);
  };

  // Open editor for an existing imported song.
  const openEditSong = () => {
    if (!selectedSong) return;

    const song = selectedSong;

    setFormTitle(song.title);
    setFormArtist(
      song.artist === "Unknown Artist"
        ? ""
        : song.artist
    );
    setFormMood(
      songMoods.includes(song.mood)
        ? song.mood
        : "Happy"
    );

    setPendingFile(null);
    setEditingSong(song);
    setSelectedSong(null);
  };

  const saveEditedSong = async () => {
    if (!editingSong || isSaving) return;

    const title = formTitle.trim();

    if (!title) {
      showMessage(
        "Title Required",
        "Please enter a song title."
      );
      return;
    }

    setIsSaving(true);

    try {
      await updateImportedSong(editingSong.id, {
        title,
        artist:
          formArtist.trim() || "Unknown Artist",
        mood: formMood,
      });

      resetSongForm();

      showMessage(
        "Song Updated",
        "Song information was saved successfully."
      );
    } catch (error) {
      console.error("Failed to edit song:", error);

      showMessage(
        "Update Failed",
        error instanceof Error
          ? error.message
          : String(error)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmRemoveSong = async () => {
    if (!selectedSong || isRemoving) return;

    const songToRemove = selectedSong;

    setIsRemoving(true);

    try {
      stopAndClearSong(songToRemove.id);

      await removeImportedSong(songToRemove.id);

      if (isFavorite(songToRemove.id)) {
        toggleFavorite(songToRemove.id);
      }

      setShowRemoveConfirm(false);
      setSelectedSong(null);

      showMessage(
        "Song Removed",
        `"${songToRemove.title}" was removed from MoodTunes. Your original phone MP3 was not deleted.`
      );
    } catch (error) {
      console.error(
        "Failed to remove song:",
        error
      );

      if (
        !importedSongs.some(
          (song) => song.id === songToRemove.id
        )
      ) {
        setShowRemoveConfirm(false);
        setSelectedSong(null);
      }

      showMessage(
        "Removal Issue",
        error instanceof Error
          ? error.message
          : String(error)
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const songFormVisible =
    pendingFile !== null || editingSong !== null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.heading}>
              Music Library
            </Text>
            <Text style={styles.subtitle}>
              Your offline music collection
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.importButton,
              (isImporting ||
                isSaving ||
                !isLoaded ||
                isRemoving) &&
                styles.disabledButton,
            ]}
            onPress={() => void handleImportSong()}
            disabled={
              isImporting ||
              isSaving ||
              !isLoaded ||
              isRemoving
            }
          >
            {isImporting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="add"
                size={18}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.importText}>
              {isImporting ? "Importing" : "Import"}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#9D96B2"
          value={search}
          onChangeText={setSearch}
        />

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

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearFilters}
        >
          <Text style={styles.clearButtonText}>
            Clear All Filters
          </Text>
        </TouchableOpacity>

        {/* BUILT-IN SONGS */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name="disc-outline"
            size={21}
            color="#C6A8FF"
          />
          <Text style={styles.sectionTitle}>
            Built-in Songs ({filteredBuiltInSongs.length})
          </Text>
        </View>

        {filteredBuiltInSongs.length === 0 ? (
          <Text style={styles.emptyText}>
            No built-in songs match your filters.
          </Text>
        ) : (
          filteredBuiltInSongs.map((song) => (
            <View
              key={song.id}
              style={styles.songCard}
            >
              <TouchableOpacity
                style={styles.songInfoButton}
                onPress={() => openPlayer(song.id)}
                accessibilityLabel={`Play ${song.title}`}
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
                    Mood: {song.mood}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heartButton}
                onPress={() =>
                  toggleFavorite(song.id)
                }
                accessibilityLabel="Toggle favorite"
              >
                <Ionicons
                  name={
                    isFavorite(song.id)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={23}
                  color={
                    isFavorite(song.id)
                      ? "#FB7185"
                      : "#BEB6D3"
                  }
                />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* IMPORTED SONGS */}
        <View style={styles.importedSection}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="folder-open-outline"
              size={21}
              color="#C6A8FF"
            />

            <Text style={styles.sectionTitle}>
              My Imported Songs ({filteredImportedSongs.length})
            </Text>
          </View>

          {!isLoaded ? (
            <ActivityIndicator
              color="#C6A8FF"
              style={styles.loading}
            />
          ) : filteredImportedSongs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="folder-open-outline"
                size={42}
                color="#C6A8FF"
              />

              <Text style={styles.emptyTitle}>
                {importedSongs.length === 0
                  ? "No imported songs yet"
                  : "No matching imported songs"}
              </Text>

              <Text style={styles.emptyDescription}>
                {importedSongs.length === 0
                  ? "Tap Import to add MP3 files from your phone."
                  : "Try another search or clear your mood filter."}
              </Text>
            </View>
          ) : (
            filteredImportedSongs.map((song) => (
              <View
                key={song.id}
                style={styles.songCard}
              >
                <TouchableOpacity
                  style={styles.songInfoButton}
                  onPress={() => openPlayer(song.id)}
                  accessibilityLabel={`Play ${song.title}`}
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
                      Mood: {song.mood}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() =>
                    toggleFavorite(song.id)
                  }
                  accessibilityLabel="Toggle favorite"
                >
                  <Ionicons
                    name={
                      isFavorite(song.id)
                        ? "heart"
                        : "heart-outline"
                    }
                    size={23}
                    color={
                      isFavorite(song.id)
                        ? "#FB7185"
                        : "#BEB6D3"
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => openSongMenu(song)}
                  accessibilityLabel={`Options for ${song.title}`}
                  disabled={isRemoving}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={21}
                    color="#BEB6D3"
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ADD / EDIT SONG FORM */}
      <Modal
        visible={songFormVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSongForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>
                {editingSong
                  ? "Edit Song Information"
                  : "Import Song"}
              </Text>

              <Text style={styles.modalDescription}>
                {editingSong
                  ? "Update the song details below."
                  : `Selected MP3: ${
                      pendingFile?.name ?? ""
                    }`}
              </Text>

              <Text style={styles.formLabel}>
                Song Title *
              </Text>

              <TextInput
                style={styles.formInput}
                placeholder="Song title"
                placeholderTextColor="#9D96B2"
                value={formTitle}
                onChangeText={setFormTitle}
                maxLength={150}
              />

              <Text style={styles.formLabel}>
                Artist Name (Optional)
              </Text>

              <TextInput
                style={styles.formInput}
                placeholder="Unknown Artist"
                placeholderTextColor="#9D96B2"
                value={formArtist}
                onChangeText={setFormArtist}
                maxLength={150}
              />

              <Text style={styles.formLabel}>
                Choose Mood
              </Text>

              <View style={styles.moodChoices}>
                {songMoods.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.moodChoice,
                      formMood === item &&
                        styles.selectedMoodChoice,
                    ]}
                    onPress={() => setFormMood(item)}
                  >
                    <Text style={styles.moodChoiceText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelAction}
                  onPress={closeSongForm}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isSaving && styles.disabledButton,
                  ]}
                  onPress={() =>
                    void (editingSong
                      ? saveEditedSong()
                      : saveNewImportedSong())
                  }
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.confirmText}>
                      {editingSong
                        ? "Save Changes"
                        : "Import MP3"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SONG OPTIONS */}
      <Modal
        visible={
          selectedSong !== null &&
          !showRemoveConfirm
        }
        transparent
        animationType="fade"
        onRequestClose={closeSongMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Song Options
            </Text>

            <Text style={styles.modalDescription}>
              {selectedSong?.title}
            </Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                const id = selectedSong?.id;
                closeSongMenu();

                if (id !== undefined) {
                  openPlayer(id);
                }
              }}
            >
              <Ionicons
                name="play-circle-outline"
                size={21}
                color="#C6A8FF"
              />
              <Text style={styles.optionText}>
                Play Song
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={openEditSong}
            >
              <Ionicons
                name="create-outline"
                size={21}
                color="#C6A8FF"
              />
              <Text style={styles.optionText}>
                Edit Song Information
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                setShowRemoveConfirm(true)
              }
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color="#FB7185"
              />
              <Text style={styles.removeText}>
                Remove Song
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeSongMenu}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REMOVE CONFIRMATION */}
      <Modal
        visible={showRemoveConfirm}
        transparent
        animationType="fade"
        onRequestClose={closeSongMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Remove Imported Song?
            </Text>

            <Text style={styles.modalDescription}>
              Remove "{selectedSong?.title}" from MoodTunes?
              {"\n\n"}
              The imported copy will be deleted, but the
              original MP3 on your phone will remain.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelAction}
                onPress={closeSongMenu}
                disabled={isRemoving}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isRemoving && styles.disabledButton,
                ]}
                onPress={() =>
                  void confirmRemoveSong()
                }
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.confirmText}>
                    Remove
                  </Text>
                )}
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
  mainScroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 50,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  headerInfo: {
    flex: 1,
  },
  heading: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#BEB6D3",
    marginTop: 8,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#7954B8",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  importText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  songCard: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 12,
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
    marginTop: 4,
    fontSize: 13,
  },
  songMeta: {
    color: "#928BA6",
    marginTop: 4,
    fontSize: 12,
  },
  heartButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  importedSection: {
    marginTop: 28,
  },
  emptyContainer: {
    backgroundColor: "#211D30",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 14,
  },
  emptyDescription: {
    color: "#BEB6D3",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  emptyText: {
    color: "#BEB6D3",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  loading: {
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "85%",
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
    marginBottom: 22,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  removeText: {
    color: "#FB7185",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#353044",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  cancelText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  cancelAction: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#353044",
    justifyContent: "center",
  },
  confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#9F304C",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  formLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#332A44",
    color: "#FFFFFF",
    padding: 13,
    borderRadius: 10,
    marginBottom: 18,
    fontSize: 15,
  },
  moodChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 15,
  },
  moodChoice: {
    backgroundColor: "#332A44",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectedMoodChoice: {
    backgroundColor: "#7954B8",
  },
  moodChoiceText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#7954B8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
