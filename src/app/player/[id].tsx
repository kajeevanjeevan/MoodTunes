
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
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
import { useListeningHistory } from "@/context/ListeningHistoryContext";
import { audioSources } from "@/data/audio";
import { songs } from "@/data/songs";

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

  const initialIndex = songs.findIndex(
    (item) => item.id === Number(id)
  );

  const [songIndex, setSongIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const [isChanging, setIsChanging] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const changingRef = useRef(false);
  const seekingRef = useRef(false);
  const seekRequestRef = useRef(0);
  const mountedRef = useRef(true);

  // Listening history tracking
  const pendingPlayRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  const song = songs[songIndex];

  const { isFavorite, toggleFavorite } = useFavorites();
  const { recordPlay } = useListeningHistory();

  const initialSource =
    audioSources[
      songs[initialIndex >= 0 ? initialIndex : 0]?.id
    ] ?? null;

  const player = useAudioPlayer(initialSource, {
    updateInterval: 500,
  });

  const status = useAudioPlayerStatus(player);

  const audioSource = song
    ? audioSources[song.id] ?? null
    : null;

  const duration = status.duration || 0;
  const currentTime = status.currentTime || 0;

  const canSeek =
    !!audioSource &&
    status.isLoaded &&
    duration > 0 &&
    !isChanging;

  const displayedTime = isSeeking
    ? seekTime
    : currentTime;

  // Record a play only after playback actually starts
  useEffect(() => {
    if (status.playing && !wasPlayingRef.current) {
      const songId = pendingPlayRef.current;

      if (songId !== null) {
        pendingPlayRef.current = null;
        void recordPlay(songId);
      }
    }

    wasPlayingRef.current = status.playing;
  }, [status.playing, recordPlay]);

  // Clean up when leaving the player
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      seekRequestRef.current += 1;
      pendingPlayRef.current = null;
      player.pause();
    };
  }, [player]);

  // Change to next or previous song
  const changeSong = (direction: number) => {
    if (
      changingRef.current ||
      seekingRef.current ||
      !song ||
      songs.length === 0
    ) {
      return;
    }

    changingRef.current = true;
    setIsChanging(true);

    try {
      const nextIndex =
        (songIndex + direction + songs.length) %
        songs.length;

      const nextSong = songs[nextIndex];
      const nextSource =
        audioSources[nextSong.id] ?? null;

      // Cancel any pending play for the previous song
      pendingPlayRef.current = null;

      player.pause();
      player.replace(nextSource);

      setSongIndex(nextIndex);
      setSeekTime(0);
      setIsSeeking(false);
    } catch (error) {
      console.error("Cannot change song:", error);
    } finally {
      changingRef.current = false;
      setIsChanging(false);
    }
  };

  // Play or pause audio
  const handlePlayPause = async () => {
    if (
      !audioSource ||
      !song ||
      isChanging ||
      seekingRef.current ||
      !status.isLoaded
    ) {
      return;
    }

    try {
      if (status.playing) {
        pendingPlayRef.current = null;
        player.pause();
      } else {
        // Restart if the song has finished
        if (
          duration > 0 &&
          currentTime >= duration
        ) {
          await player.seekTo(0);
        }

        // Remember which song is about to start
        pendingPlayRef.current = song.id;

        player.play();
      }
    } catch (error) {
      pendingPlayRef.current = null;

      console.error(
        "Cannot play or pause audio:",
        error
      );
    }
  };

  // User starts dragging the seek bar
  const handleSeekStart = () => {
    if (!canSeek) {
      return;
    }

    seekingRef.current = true;
    setSeekTime(currentTime);
    setIsSeeking(true);
  };

  // Update selected time while dragging
  const handleSeekChange = (value: number) => {
    if (!seekingRef.current) {
      return;
    }

    setSeekTime(value);
  };

  // Jump to selected time
  const handleSeekComplete = (value: number) => {
    if (!canSeek || !seekingRef.current) {
      seekingRef.current = false;
      setIsSeeking(false);
      return;
    }

    const newTime = Math.max(
      0,
      Math.min(value, duration)
    );

    setSeekTime(newTime);

    const requestId = ++seekRequestRef.current;

    void player
      .seekTo(newTime)
      .catch((error) => {
        console.error(
          "Cannot seek audio:",
          error
        );
      })
      .finally(() => {
        if (
          mountedRef.current &&
          requestId === seekRequestRef.current
        ) {
          seekingRef.current = false;
          setIsSeeking(false);
        }
      });
  };

  if (!song) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            No songs available
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          MOODTUNES PLAYER
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => toggleFavorite(song.id)}
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
                : "#FFFFFF"
            }
          />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.albumArt}>
        <Text style={styles.albumEmoji}>
          {song.emoji}
        </Text>
      </View>

      {/* Song Details */}
      <Text style={styles.title}>
        {song.title}
      </Text>

      <Text style={styles.artist}>
        {song.artist}
      </Text>

      <Text style={styles.mood}>
        {song.mood} Mood
      </Text>

      {/* Draggable Seek Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={
            duration > 0 ? duration : 1
          }
          value={Math.min(
            Math.max(displayedTime, 0),
            duration > 0 ? duration : 1
          )}
          minimumTrackTintColor="#22C55E"
          maximumTrackTintColor="#40516A"
          thumbTintColor="#86EFAC"
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
              color="#86EFAC"
            />

            <Text style={styles.seekingText}>
              Seeking audio...
            </Text>
          </View>
        )}
      </View>

      {/* Music Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.skipButton,
            (isChanging || isSeeking) &&
              styles.disabledButton,
          ]}
          onPress={() => changeSong(-1)}
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
            (
              !audioSource ||
              isChanging ||
              isSeeking ||
              !status.isLoaded
            ) && styles.disabledButton,
          ]}
          onPress={handlePlayPause}
          disabled={
            !audioSource ||
            isChanging ||
            isSeeking ||
            !status.isLoaded
          }
          accessibilityLabel={
            status.playing ? "Pause" : "Play"
          }
        >
          {isChanging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name={
                status.playing ? "pause" : "play"
              }
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
          onPress={() => changeSong(1)}
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

      {/* Status Messages */}
      {isChanging && (
        <Text style={styles.message}>
          Changing song...
        </Text>
      )}

      {!audioSource && !isChanging && (
        <Text style={styles.message}>
          Audio is not available for this song yet.
        </Text>
      )}

      {status.error && (
        <Text style={styles.errorText}>
          Audio error: {status.error}
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
    color: "#86EFAC",
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
    color: "#86EFAC",
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
    color: "#86EFAC",
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
    backgroundColor: "#22C55E",
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

  backText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
