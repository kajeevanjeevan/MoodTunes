
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useListeningHistory } from "@/context/ListeningHistoryContext";
import { songs } from "@/data/songs";

export default function ExploreScreen() {
  const {
    playCounts,
    recentPlays,
    totalPlays,
    isLoaded,
  } = useListeningHistory();

  // Sort songs by number of plays
  const mostPlayedSongs = useMemo(() => {
    return songs
      .filter((song) => (playCounts[song.id] ?? 0) > 0)
      .sort(
        (a, b) =>
          (playCounts[b.id] ?? 0) -
          (playCounts[a.id] ?? 0)
      );
  }, [playCounts]);

  // Show recently played songs without duplicates
  const recentlyPlayedSongs = useMemo(() => {
    const seen = new Set<number>();

    return recentPlays
      .filter((entry) => {
        if (seen.has(entry.songId)) {
          return false;
        }

        seen.add(entry.songId);
        return true;
      })
      .map((entry) => {
        const song = songs.find(
          (item) => item.id === entry.songId
        );

        return song
          ? {
              ...song,
              playedAt: entry.playedAt,
            }
          : null;
      })
      .filter(
        (
          song
        ): song is (typeof songs)[number] & {
          playedAt: number;
        } => song !== null
      )
      .slice(0, 10);
  }, [recentPlays]);

  const uniqueSongsPlayed = mostPlayedSongs.length;

  const openSong = (songId: number) => {
    router.push({
      pathname: "/song/[id]",
      params: {
        id: String(songId),
      },
    });
  };

  const formatRecentDate = (timestamp: number) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      date.toDateString() === yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return date.toLocaleDateString();
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading listening history...
        </Text>
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
        <View>
          <Text style={styles.heading}>
            Your Music
          </Text>

          <Text style={styles.subtitle}>
            Your listening activity
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="headset-outline"
            size={25}
            color="#C6A8FF"
          />
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Total Plays
          </Text>

          <Text style={styles.statNumber}>
            {totalPlays}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Songs Played
          </Text>

          <Text style={styles.statNumber}>
            {uniqueSongsPlayed}
          </Text>
        </View>
      </View>

      {/* Most Played */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Most Played
        </Text>

        <Ionicons
          name="trending-up-outline"
          size={19}
          color="#C6A8FF"
        />
      </View>

      {mostPlayedSongs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No listening activity yet
          </Text>

          <Text style={styles.emptyDescription}>
            Play a song from your library to see
            your most played tracks here.
          </Text>
        </View>
      ) : (
        mostPlayedSongs.map((song, index) => (
          <Pressable
            key={song.id}
            style={styles.songRow}
            onPress={() => openSong(song.id)}
          >
            <Text style={styles.rank}>
              {String(index + 1).padStart(2, "0")}
            </Text>

            <View style={styles.songDetails}>
              <Text style={styles.songTitle}>
                {song.title}
              </Text>

              <Text style={styles.songArtist}>
                {song.artist}
              </Text>
            </View>

            <View style={styles.playCountContainer}>
              <Text style={styles.playCount}>
                {playCounts[song.id] ?? 0} plays
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color="#8E819F"
            />
          </Pressable>
        ))
      )}

      {/* Recently Played */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Recently Played
        </Text>

        <Ionicons
          name="time-outline"
          size={19}
          color="#C6A8FF"
        />
      </View>

      {recentlyPlayedSongs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No recent songs
          </Text>

          <Text style={styles.emptyDescription}>
            Your recently listened songs will
            appear here automatically.
          </Text>
        </View>
      ) : (
        recentlyPlayedSongs.map((song) => (
          <Pressable
            key={song.id}
            style={styles.recentRow}
            onPress={() => openSong(song.id)}
          >
            <View style={styles.recentIcon}>
              <Ionicons
                name="musical-note-outline"
                size={19}
                color="#C6A8FF"
              />
            </View>

            <View style={styles.songDetails}>
              <Text style={styles.songTitle}>
                {song.title}
              </Text>

              <Text style={styles.songArtist}>
                {song.artist}
              </Text>
            </View>

            <Text style={styles.recentTime}>
              {formatRecentDate(song.playedAt)}
            </Text>
          </Pressable>
        ))
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Listening history is saved offline
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11101D",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#11101D",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#BEB6D3",
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#AFA7C1",
    fontSize: 14,
    marginTop: 6,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#302444",
    alignItems: "center",
    justifyContent: "center",
  },

  // Statistics
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#302444",
    padding: 18,
    borderRadius: 16,
  },

  statLabel: {
    color: "#C9B7E6",
    fontSize: 13,
  },

  statNumber: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Most Played
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#292438",
  },

  rank: {
    color: "#C6A8FF",
    fontSize: 15,
    fontWeight: "bold",
    width: 34,
  },

  songDetails: {
    flex: 1,
    marginRight: 8,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  songArtist: {
    color: "#AFA7C1",
    fontSize: 12,
    marginTop: 5,
  },

  playCountContainer: {
    marginRight: 8,
  },

  playCount: {
    color: "#C6A8FF",
    fontSize: 12,
  },

  // Recently Played
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#292438",
  },

  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#302444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  recentTime: {
    color: "#AFA7C1",
    fontSize: 12,
  },

  // Empty state
  emptyCard: {
    backgroundColor: "#211D30",
    padding: 20,
    borderRadius: 14,
    marginBottom: 25,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  emptyDescription: {
    color: "#AFA7C1",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  // Footer
  footer: {
    color: "#827A99",
    fontSize: 12,
    textAlign: "center",
    marginTop: 35,
  },
});
