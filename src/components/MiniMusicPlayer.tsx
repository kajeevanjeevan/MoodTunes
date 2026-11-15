
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useMusicPlayer } from "@/context/MusicPlayerContext";

export default function MiniMusicPlayer() {
  const {
    currentSong,
    currentSongId,
    playing,
    isLoaded,
    isChanging,
    duration,
    currentTime,
    hasAudio,
    togglePlayback,
    nextSong,
    previousSong,
  } = useMusicPlayer();

  if (!currentSong || currentSongId === null) {
    return null;
  }

  const progress =
    duration > 0
      ? Math.max(
          0,
          Math.min(currentTime / duration, 1)
        )
      : 0;

  const openFullPlayer = () => {
    router.push({
      pathname: "/player/[id]",
      params: {
        id: String(currentSongId),
      },
    });
  };

  const canPlay =
    hasAudio && isLoaded && !isChanging;

  return (
    <View style={styles.wrapper}>
      <View style={styles.player}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.songArea}
            onPress={openFullPlayer}
            accessibilityLabel="Open full music player"
            activeOpacity={0.8}
          >
            <View style={styles.artwork}>
              <Text style={styles.emoji}>
                {currentSong.emoji}
              </Text>
            </View>

            <View style={styles.songInfo}>
              <Text
                style={styles.songTitle}
                numberOfLines={1}
              >
                {currentSong.title}
              </Text>

              <Text
                style={styles.artist}
                numberOfLines={1}
              >
                {currentSong.artist}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={previousSong}
            disabled={isChanging}
            accessibilityLabel="Previous song"
          >
            <Ionicons
              name="play-skip-back"
              size={22}
              color={
                isChanging
                  ? "#928BA6"
                  : "#FFFFFF"
              }
            />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => void togglePlayback()}
            disabled={!canPlay}
            accessibilityLabel={
              playing ? "Pause music" : "Play music"
            }
          >
            <Ionicons
              name={playing ? "pause" : "play"}
              size={24}
              color={
                canPlay
                  ? "#FFFFFF"
                  : "#928BA6"
              }
            />
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={nextSong}
            disabled={isChanging}
            accessibilityLabel="Next song"
          >
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={
                isChanging
                  ? "#928BA6"
                  : "#FFFFFF"
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#11101D",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 5,
  },

  player: {
    backgroundColor: "#332A44",
    borderRadius: 14,
    overflow: "hidden",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 65,
    paddingHorizontal: 8,
  },

  songArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  artwork: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: "#7954B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  emoji: {
    fontSize: 22,
  },

  songInfo: {
    flex: 1,
    minWidth: 0,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  artist: {
    color: "#C6A8FF",
    fontSize: 11,
    marginTop: 4,
  },

  controlButton: {
    width: 35,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 3,
    backgroundColor: "#625477",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#C6A8FF",
  },
});
