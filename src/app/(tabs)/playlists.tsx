
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Playlist = {
  id: string;
  name: string;
  emoji: string;
  songCount: number;
};

const initialPlaylists: Playlist[] = [
  { id: "1", name: "Happy Vibes", emoji: "😊", songCount: 0 },
  { id: "2", name: "Relax & Chill", emoji: "🌿", songCount: 0 },
  { id: "3", name: "Study Focus", emoji: "📚", songCount: 0 },
];

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const createPlaylist = () => {
    const name = newName.trim();

    if (!name) {
      Alert.alert("Missing name", "Please enter a playlist name.");
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      emoji: "🎵",
      songCount: 0,
    };

    setPlaylists((previous) => [...previous, newPlaylist]);
    setNewName("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Playlists 🎼</Text>
      <Text style={styles.subtitle}>
        Organize music for every mood
      </Text>

      <Pressable
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>
          + Create Playlist
        </Text>
      </Pressable>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.playlistCard}>
            <Text style={styles.playlistEmoji}>
              {item.emoji}
            </Text>

            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>
                {item.name}
              </Text>
              <Text style={styles.songCount}>
                {item.songCount} songs
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
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
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={createPlaylist}
              >
                <Text style={styles.buttonText}>
                  Create
                </Text>
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
  arrow: {
    color: "#C6A8FF",
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#29253B",
    padding: 22,
    borderRadius: 20,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#11101D",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
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
