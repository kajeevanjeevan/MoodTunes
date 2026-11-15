import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { useImportedSongs } from "@/context/ImportedSongsContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
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
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
    queue,
    removeFromQueue,
    clearQueue,
    allSongs,
    playbackMode,
    activePlaylistName,
    sleepTimerRemainingSeconds,
    sleepTimerEndTime,
    startSleepTimer,
    cancelSleepTimer,
  } = useMusicPlayer();

  const { importedSongs, isLoaded: libraryLoaded } = useImportedSongs();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [timerExpanded, setTimerExpanded] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [timerInputError, setTimerInputError] = useState("");
  const seekingRef = useRef(false);
  const mountedRef = useRef(true);
  const seekRequestRef = useRef(0);
  const requestedId = Number(id);

  // Library/Playlist screens have already selected the track and playback mode.
  // Only select from the URL if the player has no active song yet.
  useEffect(() => {
    if (
      libraryLoaded &&
      id !== undefined &&
      Number.isFinite(requestedId) &&
      currentSongId === null
    ) {
      selectSong(requestedId);
    }
  }, [id, requestedId, libraryLoaded, currentSongId, selectSong]);

  useEffect(() => {
    seekingRef.current = false;
    setIsSeeking(false);
    setSeekTime(0);
    seekRequestRef.current += 1;
  }, [currentSongId]);

  // Shared audio must continue playing when this screen is closed.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      seekRequestRef.current += 1;
    };
  }, []);

  const canSeek = hasAudio && isLoaded && duration > 0 && !isChanging;
  const displayedTime = isSeeking ? seekTime : currentTime;

  const handleSeekStart = () => {
    if (!canSeek) return;
    seekingRef.current = true;
    setSeekTime(currentTime);
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number) => {
    if (seekingRef.current) setSeekTime(value);
  };

  const handleSeekComplete = (value: number) => {
    if (!canSeek || !seekingRef.current) {
      seekingRef.current = false;
      setIsSeeking(false);
      return;
    }
    const safeTime = Math.max(0, Math.min(value, duration));
    setSeekTime(safeTime);
    const requestId = ++seekRequestRef.current;
    void seekTo(safeTime).finally(() => {
      if (mountedRef.current && requestId === seekRequestRef.current) {
        seekingRef.current = false;
        setIsSeeking(false);
      }
    });
  };

  const handleCustomTimer = () => {
    const minutes = Number(customMinutes.trim());
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      setTimerInputError("Enter a whole number from 1 to 240 minutes.");
      return;
    }
    setTimerInputError("");
    startSleepTimer(minutes);
    setTimerExpanded(false);
  };

  if (!libraryLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C6A8FF" />
        <Text style={styles.message}>Loading music library...</Text>
      </View>
    );
  }

  if (!currentSong) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Song not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isImported = importedSongs.some((song) => song.id === currentSong.id);
  const repeatIcon = repeatMode === "one" ? "repeat-outline" : "repeat";
  const repeatColor = repeatMode === "off" ? "#94A3B8" : "#C6A8FF";
  const repeatLabel = repeatMode === "off" ? "Repeat Off" : repeatMode === "all" ? "Repeat All" : "Repeat One";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOODTUNES PLAYER</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => toggleFavorite(currentSong.id)}
          accessibilityLabel="Toggle favorite"
        >
          <Ionicons
            name={isFavorite(currentSong.id) ? "heart" : "heart-outline"}
            size={23}
            color={isFavorite(currentSong.id) ? "#FB7185" : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.albumArt}>
        <Text style={styles.albumEmoji}>{currentSong.emoji}</Text>
      </View>
      <Text style={styles.title}>{currentSong.title}</Text>
      <Text style={styles.artist}>{currentSong.artist}</Text>
      <Text style={styles.mood}>
        {isImported ? "Imported MP3" : `${currentSong.mood} Mood`}
      </Text>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration > 0 ? duration : 1}
          value={Math.min(Math.max(displayedTime, 0), duration > 0 ? duration : 1)}
          minimumTrackTintColor="#C6A8FF"
          maximumTrackTintColor="#40516A"
          thumbTintColor="#C6A8FF"
          disabled={!canSeek || isSeeking}
          onSlidingStart={handleSeekStart}
          onValueChange={handleSeekChange}
          onSlidingComplete={handleSeekComplete}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(displayedTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        {isSeeking && (
          <View style={styles.seekingRow}>
            <ActivityIndicator size="small" color="#C6A8FF" />
            <Text style={styles.seekingText}>Seeking audio...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.modeButton, shuffleEnabled && styles.activeModeButton]}
          onPress={toggleShuffle}
          accessibilityLabel={shuffleEnabled ? "Turn shuffle off" : "Turn shuffle on"}
          accessibilityRole="button"
        >
          <Ionicons name="shuffle" size={22} color={shuffleEnabled ? "#C6A8FF" : "#94A3B8"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.skipButton, (isChanging || isSeeking) && styles.disabledButton]}
          onPress={previousSong}
          disabled={isChanging || isSeeking}
          accessibilityLabel="Previous song"
        >
          <Ionicons name="play-skip-back" size={21} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.playButton, (!hasAudio || isChanging || isSeeking || !isLoaded) && styles.disabledButton]}
          onPress={() => void togglePlayback()}
          disabled={!hasAudio || isChanging || isSeeking || !isLoaded}
          accessibilityLabel={playing ? "Pause" : "Play"}
        >
          {isChanging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name={playing ? "pause" : "play"} size={26} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.skipButton, (isChanging || isSeeking) && styles.disabledButton]}
          onPress={nextSong}
          disabled={isChanging || isSeeking}
          accessibilityLabel="Next song"
        >
          <Ionicons name="play-skip-forward" size={21} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, repeatMode !== "off" && styles.activeModeButton]}
          onPress={cycleRepeatMode}
          accessibilityLabel={`${repeatLabel}. Change repeat mode`}
          accessibilityRole="button"
        >
          <View style={styles.repeatIconContainer}>
            <Ionicons name={repeatIcon} size={22} color={repeatColor} />
            {repeatMode === "one" && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.modeStatusRow}>
        <Text style={styles.modeStatusText}>Shuffle: {shuffleEnabled ? "On" : "Off"}</Text>
        <Text style={styles.modeStatusText}>{repeatLabel}</Text>
      </View>

      {!hasAudio && <Text style={styles.message}>Audio is not available for this song yet.</Text>}
      {hasAudio && !isLoaded && <Text style={styles.message}>Loading audio...</Text>}
      {!!error && <Text style={styles.errorText}>Audio error: {error}</Text>}

      {/* Level 7 Step 4: Shared manual queue controls. */}
      <View style={styles.queueSection}>
        <TouchableOpacity
          style={styles.queueHeadingRow}
          onPress={() => setQueueExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={queueExpanded ? "Hide music queue" : "Show music queue"}
        >
          <View style={styles.queueHeadingGroup}>
            <Ionicons name="list-outline" size={23} color="#C6A8FF" />
            <Text style={styles.queueHeading}>Music Queue</Text>
          </View>
          <View style={styles.queueHeaderRight}>
            <Text style={styles.queueCount}>{queue.length} waiting</Text>
            <Ionicons name={queueExpanded ? "chevron-up" : "chevron-down"} size={20} color="#C6A8FF" />
          </View>
        </TouchableOpacity>

        {queueExpanded && (
          <View>

        <Text style={styles.queueMode}>
          {playbackMode === "playlist" && activePlaylistName
            ? `Playing from playlist: ${activePlaylistName}`
            : "Playing from Library"}
        </Text>

        <Text style={styles.queueSubheading}>NOW PLAYING</Text>
        <View style={styles.nowPlayingRow}>
          <Text style={styles.queueEmoji}>{currentSong.emoji}</Text>
          <View style={styles.queueSongInfo}>
            <Text style={styles.queueSongTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.queueSongArtist} numberOfLines={1}>{currentSong.artist}</Text>
          </View>
          <Ionicons name="musical-notes" size={20} color="#C6A8FF" />
        </View>

        <View style={styles.upNextHeader}>
          <Text style={styles.queueSubheading}>UP NEXT</Text>
          {queue.length > 0 && (
            <TouchableOpacity
              onPress={clearQueue}
              accessibilityLabel="Clear all queued songs"
              accessibilityRole="button"
              style={styles.clearQueueButton}
            >
              <Ionicons name="trash-outline" size={16} color="#FB7185" />
              <Text style={styles.clearQueueText}>Clear Queue</Text>
            </TouchableOpacity>
          )}
        </View>

        {queue.length === 0 ? (
          <Text style={styles.queueEmpty}>No songs in your manual queue. Use the three-dot menu in Library to add songs.</Text>
        ) : (
          queue.map((songId, index) => {
            const queuedSong = allSongs.find((song) => song.id === songId);
            return (
              <View style={styles.queuedSongRow} key={`${songId}-${index}`}>
                <Text style={styles.queueEmoji}>{queuedSong?.emoji ?? "🎵"}</Text>
                <View style={styles.queueSongInfo}>
                  <Text style={styles.queueSongTitle} numberOfLines={1}>
                    {queuedSong?.title ?? "Unavailable song"}
                  </Text>
                  <Text style={styles.queueSongArtist} numberOfLines={1}>
                    {queuedSong?.artist ?? "Song not found"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeQueueButton}
                  onPress={() => removeFromQueue(index)}
                  accessibilityLabel={`Remove ${queuedSong?.title ?? "song"} from queue`}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle-outline" size={25} color="#FB7185" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <Text style={styles.queueHint}>Queued songs play before normal Library or playlist continuation.</Text>
          </View>
        )}
      </View>

      {/* Level 8: Collapsible sleep timer. */}
      <View style={styles.timerSection}>
        <TouchableOpacity
          style={styles.queueHeadingRow}
          onPress={() => setTimerExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={timerExpanded ? "Hide sleep timer options" : "Show sleep timer options"}
        >
          <View style={styles.queueHeadingGroup}>
            <Ionicons name="moon-outline" size={23} color="#C6A8FF" />
            <Text style={styles.queueHeading}>Sleep Timer</Text>
          </View>
          <View style={styles.queueHeaderRight}>
            <Text style={styles.queueCount}>
              {sleepTimerEndTime !== null
                ? `${Math.floor(sleepTimerRemainingSeconds / 60)}:${String(sleepTimerRemainingSeconds % 60).padStart(2, "0")} left`
                : "Off"}
            </Text>
            <Ionicons name={timerExpanded ? "chevron-up" : "chevron-down"} size={20} color="#C6A8FF" />
          </View>
        </TouchableOpacity>

        {timerExpanded && (
          <View style={styles.timerDetails}>
            <Text style={styles.timerHelp}>Pause music automatically after:</Text>
            <View style={styles.timerPresets}>
              {[5, 15, 30, 60].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.timerPresetButton}
                  onPress={() => {
                    setTimerInputError("");
                    startSleepTimer(minutes);
                    setTimerExpanded(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Set sleep timer for ${minutes} minutes`}
                >
                  <Text style={styles.timerPresetText}>{minutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.timerHelp}>Custom duration (1–240 minutes)</Text>
            <View style={styles.timerCustomRow}>
              <TextInput
                style={styles.timerInput}
                value={customMinutes}
                onChangeText={(value) => {
                  setCustomMinutes(value);
                  setTimerInputError("");
                }}
                placeholder="Minutes"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel="Custom sleep timer duration in minutes"
              />
              <TouchableOpacity
                style={styles.timerSetButton}
                onPress={handleCustomTimer}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Set Timer</Text>
              </TouchableOpacity>
            </View>
            {!!timerInputError && <Text style={styles.errorText}>{timerInputError}</Text>}
            {sleepTimerEndTime !== null && (
              <TouchableOpacity
                style={styles.timerCancelButton}
                onPress={() => {
                  cancelSleepTimer();
                  setTimerExpanded(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.clearQueueText}>Cancel Sleep Timer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Text style={styles.footer}>Listen offline with MoodTunes</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101827" },
  centerContainer: { flex: 1, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", padding: 24 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 25, paddingBottom: 35 },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 35 },
  headerButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#243247", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#C6A8FF", fontSize: 13, fontWeight: "bold", letterSpacing: 1.5 },
  albumArt: { width: 220, height: 220, borderRadius: 22, backgroundColor: "#263B52", alignItems: "center", justifyContent: "center", marginBottom: 25 },
  albumEmoji: { fontSize: 90 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "bold", textAlign: "center" },
  artist: { color: "#B5C3D3", fontSize: 16, marginTop: 8, textAlign: "center" },
  mood: { color: "#C6A8FF", fontSize: 13, marginTop: 12 },
  progressContainer: { width: "100%", marginTop: 40, marginBottom: 30 },
  slider: { width: "100%", height: 40 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  timeText: { color: "#94A3B8", fontSize: 12 },
  seekingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  seekingText: { color: "#C6A8FF", fontSize: 12 },
  controls: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 6 },
  modeButton: { width: 40, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activeModeButton: { backgroundColor: "#35264F" },
  skipButton: { width: 43, height: 48, borderRadius: 14, backgroundColor: "#243247", alignItems: "center", justifyContent: "center" },
  playButton: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#7954B8", alignItems: "center", justifyContent: "center" },
  repeatIconContainer: { position: "relative" },
  repeatOneBadge: { position: "absolute", top: 5, left: 7, backgroundColor: "#35264F", minWidth: 10, alignItems: "center" },
  repeatOneText: { color: "#FFFFFF", fontSize: 9, fontWeight: "bold" },
  modeStatusRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginBottom: 15 },
  modeStatusText: { color: "#B5C3D3", fontSize: 12 },
  disabledButton: { backgroundColor: "#64748B", opacity: 0.6 },
  message: { color: "#FBBF24", fontSize: 14, textAlign: "center", marginTop: 15 },
  errorText: { color: "#F87171", fontSize: 13, textAlign: "center", marginTop: 15 },
  footer: { color: "#64748B", fontSize: 12, marginTop: 45 },
  backButton: { padding: 14, backgroundColor: "#243247", borderRadius: 10, marginTop: 20 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  queueSection: { width: "100%", marginTop: 25, backgroundColor: "#1D2638", borderRadius: 18, padding: 17 },
  queueHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  queueHeadingGroup: { flexDirection: "row", alignItems: "center", gap: 9 },
  queueHeaderRight: { flexDirection: "row", alignItems: "center", gap: 9 },
  queueHeading: { color: "#FFFFFF", fontSize: 19, fontWeight: "bold" },
  queueCount: { color: "#B5C3D3", fontSize: 12 },
  queueMode: { color: "#C6A8FF", fontSize: 12, marginTop: 10, marginBottom: 18 },
  queueSubheading: { color: "#B5C3D3", fontSize: 11, fontWeight: "bold", letterSpacing: 1.1 },
  nowPlayingRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#35264F", borderRadius: 12, padding: 12, marginTop: 9, marginBottom: 20 },
  queueEmoji: { fontSize: 25, marginRight: 12 },
  queueSongInfo: { flex: 1 },
  queueSongTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  queueSongArtist: { color: "#B5C3D3", fontSize: 12, marginTop: 3 },
  upNextHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  clearQueueButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6 },
  clearQueueText: { color: "#FB7185", fontSize: 12, fontWeight: "bold" },
  queueEmpty: { color: "#94A3B8", fontSize: 13, lineHeight: 20, paddingVertical: 13 },
  queuedSongRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#354158" },
  removeQueueButton: { padding: 6, marginLeft: 5 },
  queueHint: { color: "#94A3B8", fontSize: 11, lineHeight: 17, marginTop: 15 },
  timerSection: { width: "100%", marginTop: 15, backgroundColor: "#1D2638", borderRadius: 18, padding: 17 },
  timerDetails: { marginTop: 18 },
  timerHelp: { color: "#B5C3D3", fontSize: 13, marginBottom: 12 },
  timerPresets: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 20 },
  timerPresetButton: { backgroundColor: "#35264F", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 13 },
  timerPresetText: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  timerCustomRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  timerInput: { flex: 1, minWidth: 0, backgroundColor: "#101827", borderRadius: 10, padding: 12, color: "#FFFFFF", fontSize: 15 },
  timerSetButton: { backgroundColor: "#7954B8", paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10 },
  timerCancelButton: { marginTop: 18, alignSelf: "flex-start", paddingVertical: 8 },
});
