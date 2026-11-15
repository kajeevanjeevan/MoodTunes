
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { useImportedSongs } from "@/context/ImportedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export default function MusicPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    currentSong,
    currentSongId,
    playing,
    isLoaded,
    isChanging,
    duration,
    currentTime,
    error,
    hasAudio,
    selectSong,
    togglePlayback,
    nextSong,
    previousSong,
    seekTo,
  } = useMusicPlayer();

  const { importedSongs, isLoaded: libraryLoaded } =
    useImportedSongs();

  const { isFavorite, toggleFavorite } = useFavorites();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const seekingRef = useRef(false);
  const mountedRef = useRef(true);
  const seekRequestRef = useRef(0);

  const requestedId = Number(id);

  // Select the requested song only when the route changes.
  useEffect(() => {
    if (libraryLoaded && Number.isFinite(requestedId)) {
      selectSong(requestedId);
    }
  }, [requestedId, libraryLoaded, selectSong]);

  // Reset seek UI when the selected song changes.
  useEffect(() => {
    seekingRef.current = false;
    setIsSeeking(false);
    setSeekTime(0);
    seekRequestRef.current += 1;
  }, [currentSongId]);

  // Clean up only screen-related state.
  // Do NOT pause the shared audio player here.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      seekRequestRef.current += 1;
    };
  }, []);

  const canSeek =
    hasAudio &&
    isLoaded &&
    duration > 0 &&
    !isChanging;

  const displayedTime = isSeeking
    ? seekTime
    : currentTime;

  const handleSeekStart = () => {
    if (!canSeek) {
      return;
    }

    seekingRef.current = true;
    setSeekTime(currentTime);
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number) => {
    if (seekingRef.current) {
      setSeekTime(value);
    }
  };

  const handleSeekComplete = (value: number) => {
    if (!canSeek || !seekingRef.current) {
      seekingRef.current = false;
      setIsSeeking(false);
      return;
    }

    const safeTime = Math.max(
      0,
      Math.min(value, duration)
    );

    setSeekTime(safeTime);

    const requestId = ++seekRequestRef.current;

    void seekTo(safeTime).finally(() => {
      if (
        mountedRef.current &&
        requestId === seekRequestRef.current
      ) {
        seekingRef.current = false;
        setIsSeeking(false);
      }
    });
  };

  if (!libraryLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#C6A8FF"
        />
        <Text style={styles.message}>
          Loading music library...
        </Text>
      </View>
    );
  }

  if (!currentSong) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>
          Song not found
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isImported = importedSongs.some(
    (song) => song.id === currentSong.id
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          MOODTUNES PLAYER
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => toggleFavorite(currentSong.id)}
          accessibilityLabel="Toggle favorite"
        >
          <Ionicons
            name={
              isFavorite(currentSong.id)
                ? "heart"
                : "heart-outline"
            }
            size={23}
            color={
              isFavorite(currentSong.id)
                ? "#FB7185"
                : "#FFFFFF"
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.albumArt}>
        <Text style={styles.albumEmoji}>
          {currentSong.emoji}
        </Text>
      </View>

      <Text style={styles.title}>
        {currentSong.title}
      </Text>

      <Text style={styles.artist}>
        {currentSong.artist}
      </Text>

      <Text style={styles.mood}>
        {isImported
          ? "Imported MP3"
          : `${currentSong.mood} Mood`}
      </Text>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1}
          value={Math.min(
            Math.max(displayedTime, 0),
            duration > 0 ? duration : 1
          )}
          minimumTrackTintColor="#C6A8FF"
          maximumTrackTintColor="#40516A"
          thumbTintColor="#C6A8FF"
          disabled={!canSeek || isSeeking}
          onSlidingStart={handleSeekStart}
          onValueChange={handleSeekChange}
          onSlidingComplete={handleSeekComplete}
        />

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(displayedTime)}
          </Text>

          <Text style={styles.timeText}>
            {formatTime(duration)}
          </Text>
        </View>

        {isSeeking && (
          <View style={styles.seekingRow}>
            <ActivityIndicator
              size="small"
              color="#C6A8FF"
            />
            <Text style={styles.seekingText}>
              Seeking audio...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.skipButton,
            (isChanging || isSeeking) &&
              styles.disabledButton,
          ]}
          onPress={previousSong}
          disabled={isChanging || isSeeking}
          accessibilityLabel="Previous song"
        >
          <Ionicons
            name="play-skip-back"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playButton,
            (!hasAudio ||
              isChanging ||
              isSeeking ||
              !isLoaded) &&
              styles.disabledButton,
          ]}
          onPress={() => void togglePlayback()}
          disabled={
            !hasAudio ||
            isChanging ||
            isSeeking ||
            !isLoaded
          }
          accessibilityLabel={playing ? "Pause" : "Play"}
        >
          {isChanging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name={playing ? "pause" : "play"}
              size={26}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.skipButton,
            (isChanging || isSeeking) &&
              styles.disabledButton,
          ]}
          onPress={nextSong}
          disabled={isChanging || isSeeking}
          accessibilityLabel="Next song"
        >
          <Ionicons
            name="play-skip-forward"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {!hasAudio && (
        <Text style={styles.message}>
          Audio is not available for this song yet.
        </Text>
      )}

      {hasAudio && !isLoaded && (
        <Text style={styles.message}>
          Loading audio...
        </Text>
      )}

      {!!error && (
        <Text style={styles.errorText}>
          Audio error: {error}
        </Text>
      )}

      <Text style={styles.footer}>
        Listen offline with MoodTunes
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101827",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#101827",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 35,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 35,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#243247",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#C6A8FF",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  albumArt: {
    width: 220,
    height: 220,
    borderRadius: 22,
    backgroundColor: "#263B52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  albumEmoji: {
    fontSize: 90,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  artist: {
    color: "#B5C3D3",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  mood: {
    color: "#C6A8FF",
    fontSize: 13,
    marginTop: 12,
  },
  progressContainer: {
    width: "100%",
    marginTop: 40,
    marginBottom: 30,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  seekingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  seekingText: {
    color: "#C6A8FF",
    fontSize: 12,
  },
  controls: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 20,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#243247",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#7954B8",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#64748B",
  },
  message: {
    color: "#FBBF24",
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    textAlign: "center",
    marginTop: 15,
  },
  footer: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 45,
  },
  backButton: {
    padding: 14,
    backgroundColor: "#243247",
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
