
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useImportedSongs } from "@/context/ImportedSongsContext";
import { useListeningHistory } from "@/context/ListeningHistoryContext";
import { audioSources } from "@/data/audio";
import { songs } from "@/data/songs";

type MusicSong = (typeof songs)[number];

export type RepeatMode = "off" | "all" | "one";

type MusicPlayerContextType = {
  currentSong: MusicSong | null;
  currentSongId: number | null;
  allSongs: MusicSong[];
  playing: boolean;
  isLoaded: boolean;
  isChanging: boolean;
  duration: number;
  currentTime: number;
  error: string | null;
  hasAudio: boolean;

  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;

  selectSong: (id: number) => void;
  togglePlayback: () => Promise<void>;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (seconds: number) => Promise<void>;
  stopAndClearSong: (id: number) => void;
};

const SETTINGS_KEY = "@moodtunes_playback_settings";

const MusicPlayerContext =
  createContext<MusicPlayerContextType | undefined>(
    undefined
  );

export function MusicPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { importedSongs } = useImportedSongs();
  const { recordPlay } = useListeningHistory();

  const allSongs = [...songs, ...importedSongs];

  const [currentSongId, setCurrentSongId] =
    useState<number | null>(null);

  const [isChanging, setIsChanging] = useState(false);

  const [shuffleEnabled, setShuffleEnabled] =
    useState(false);

  const [repeatMode, setRepeatMode] =
    useState<RepeatMode>("off");

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const player = useAudioPlayer(null, {
    updateInterval: 500,
  });

  const status = useAudioPlayerStatus(player);

  const selectedIdRef = useRef<number | null>(null);
  const pendingPlayRef = useRef<number | null>(null);
  const autoPlayIdRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const changingRef = useRef(false);
  const finishedHandledRef = useRef(false);

  // Shuffle navigation history.
  const shuffleHistoryRef = useRef<number[]>([]);

  // Songs already visited during the current shuffle cycle.
  const shuffledPlayedRef = useRef<number[]>([]);

  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("off");

  const currentSong =
    allSongs.find(
      (song) => song.id === currentSongId
    ) ?? null;

  const getAudioSource = useCallback(
    (id: number) => {
      const importedSong = importedSongs.find(
        (song) => song.id === id
      );

      if (importedSong) {
        return importedSong.uri
          ? { uri: importedSong.uri }
          : null;
      }

      return audioSources[id] ?? null;
    },
    [importedSongs]
  );

  const hasAudio =
    currentSongId !== null &&
    getAudioSource(currentSongId) !== null;

  // Load saved playback preferences.
  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          SETTINGS_KEY
        );

        if (saved) {
          const parsed = JSON.parse(saved);

          if (active) {
            const shuffle =
              parsed.shuffleEnabled === true;

            const repeat: RepeatMode =
              parsed.repeatMode === "all" ||
              parsed.repeatMode === "one"
                ? parsed.repeatMode
                : "off";

            shuffleRef.current = shuffle;
            repeatRef.current = repeat;

            setShuffleEnabled(shuffle);
            setRepeatMode(repeat);
          }
        }
      } catch (error) {
        console.error(
          "Cannot load playback settings:",
          error
        );
      } finally {
        if (active) {
          setSettingsLoaded(true);
        }
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  // Save Shuffle and Repeat preferences.
  useEffect(() => {
    if (!settingsLoaded) return;

    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({
            shuffleEnabled,
            repeatMode,
          })
        );
      } catch (error) {
        console.error(
          "Cannot save playback settings:",
          error
        );
      }
    };

    void saveSettings();
  }, [shuffleEnabled, repeatMode, settingsLoaded]);

  // Enable or disable Shuffle.
  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;

    shuffleRef.current = next;

    shuffleHistoryRef.current = [];
    shuffledPlayedRef.current = [];

    setShuffleEnabled(next);
  }, []);

  // Repeat Off -> All -> One -> Off.
  const cycleRepeatMode = useCallback(() => {
    const next: RepeatMode =
      repeatRef.current === "off"
        ? "all"
        : repeatRef.current === "all"
          ? "one"
          : "off";

    repeatRef.current = next;
    setRepeatMode(next);
  }, []);

  // Select a song and request playback.
  const selectSong = useCallback(
    (id: number) => {
      // Do not restart the same song when reopening its screen.
      if (selectedIdRef.current === id) {
        return;
      }

      const exists =
        songs.some((song) => song.id === id) ||
        importedSongs.some((song) => song.id === id);

      if (!exists) return;

      const source = getAudioSource(id);

      changingRef.current = true;
      setIsChanging(true);

      try {
        pendingPlayRef.current = null;
        autoPlayIdRef.current = source ? id : null;
        wasPlayingRef.current = false;
        finishedHandledRef.current = false;

        player.pause();
        player.replace(source);

        selectedIdRef.current = id;
        setCurrentSongId(id);
      } catch (error) {
        autoPlayIdRef.current = null;
        console.error("Cannot select song:", error);
      } finally {
        changingRef.current = false;
        setIsChanging(false);
      }
    },
    [player, importedSongs, getAudioSource]
  );

  // Start playing after the selected audio loads.
  useEffect(() => {
    const requestedId = autoPlayIdRef.current;

    if (
      requestedId === null ||
      requestedId !== currentSongId ||
      !status.isLoaded ||
      changingRef.current
    ) {
      return;
    }

    autoPlayIdRef.current = null;

    try {
      pendingPlayRef.current = requestedId;
      player.play();
    } catch (error) {
      pendingPlayRef.current = null;
      console.error("Auto playback failed:", error);
    }
  }, [currentSongId, status.isLoaded, player]);

  // Record listening history when playback starts.
  useEffect(() => {
    if (status.playing && !wasPlayingRef.current) {
      const id = pendingPlayRef.current;

      if (id !== null) {
        pendingPlayRef.current = null;
        void recordPlay(id);
      }
    }

    wasPlayingRef.current = status.playing;
  }, [status.playing, recordPlay]);

  // Play or pause current song.
  const togglePlayback = useCallback(async () => {
    if (
      currentSongId === null ||
      !getAudioSource(currentSongId) ||
      changingRef.current ||
      !status.isLoaded
    ) {
      return;
    }

    try {
      if (status.playing) {
        autoPlayIdRef.current = null;
        pendingPlayRef.current = null;
        player.pause();
      } else {
        if (
          status.duration > 0 &&
          status.currentTime >= status.duration
        ) {
          await player.seekTo(0);
        }

        finishedHandledRef.current = false;
        pendingPlayRef.current = currentSongId;
        player.play();
      }
    } catch (error) {
      pendingPlayRef.current = null;
      console.error("Playback error:", error);
    }
  }, [
    currentSongId,
    getAudioSource,
    player,
    status.isLoaded,
    status.playing,
    status.duration,
    status.currentTime,
  ]);

  // Return songs with available audio sources.
  const getPlayableIds = useCallback(() => {
    return allSongs
      .filter(
        (song) => getAudioSource(song.id) !== null
      )
      .map((song) => song.id);
  }, [allSongs, getAudioSource]);

  // Handle Next and Previous song selection.
  const changeSong = useCallback(
    (direction: number, automatic = false) => {
      const currentId = selectedIdRef.current;

      if (
        currentId === null ||
        changingRef.current
      ) {
        return;
      }

      const playableIds = getPlayableIds();

      if (playableIds.length === 0) return;

      const index = playableIds.indexOf(currentId);

      // Shuffle playback.
      if (shuffleRef.current) {
        // Previous returns to a previously shuffled song.
        if (direction < 0) {
          while (
            shuffleHistoryRef.current.length > 0
          ) {
            const previous =
              shuffleHistoryRef.current.pop()!;

            if (
              previous !== currentId &&
              playableIds.includes(previous)
            ) {
              selectSong(previous);
              return;
            }
          }

          return;
        }

        // Remember songs visited in this shuffle cycle.
        const visited = new Set([
          ...shuffledPlayedRef.current,
          currentId,
        ]);

        let choices = playableIds.filter(
          (id) =>
            id !== currentId &&
            !visited.has(id)
        );

        // All songs have been visited.
        if (choices.length === 0) {
          // Repeat Off: stop automatic playback.
          if (
            automatic &&
            repeatRef.current !== "all"
          ) {
            return;
          }

          // Start another shuffle cycle.
          shuffledPlayedRef.current = [];

          choices = playableIds.filter(
            (id) => id !== currentId
          );
        }

        // Only one playable song exists.
        if (choices.length === 0) {
          if (
            automatic &&
            repeatRef.current === "all"
          ) {
            void player
              .seekTo(0)
              .then(() => {
                if (
                  selectedIdRef.current !== currentId
                ) {
                  return;
                }

                pendingPlayRef.current = currentId;
                player.play();
              })
              .catch((error) => {
                console.error(
                  "Cannot repeat song:",
                  error
                );
              });
          }

          return;
        }

        // Choose a random song.
        const randomIndex = Math.floor(
          Math.random() * choices.length
        );

        const nextId = choices[randomIndex];

        shuffledPlayedRef.current.push(currentId);
        shuffleHistoryRef.current.push(currentId);

        selectSong(nextId);
        return;
      }

      // Normal sequential playback.
      if (index < 0) {
        selectSong(playableIds[0]);
        return;
      }

      let nextIndex = index + direction;

      // Repeat Off: stop at the last song.
      if (
        automatic &&
        repeatRef.current === "off" &&
        nextIndex >= playableIds.length
      ) {
        return;
      }

      if (nextIndex >= playableIds.length) {
        nextIndex = 0;
      }

      if (nextIndex < 0) {
        nextIndex = playableIds.length - 1;
      }

      const nextId = playableIds[nextIndex];

      if (nextId !== currentId) {
        selectSong(nextId);
      } else if (
        automatic &&
        repeatRef.current === "all"
      ) {
        void player
          .seekTo(0)
          .then(() => {
            if (
              selectedIdRef.current !== currentId
            ) {
              return;
            }

            pendingPlayRef.current = currentId;
            player.play();
          })
          .catch((error) => {
            console.error(
              "Cannot repeat song:",
              error
            );
          });
      }
    },
    [getPlayableIds, selectSong, player]
  );

  const nextSong = useCallback(() => {
    changeSong(1);
  }, [changeSong]);

  const previousSong = useCallback(() => {
    changeSong(-1);
  }, [changeSong]);

  // Automatically continue or repeat when audio finishes.
  useEffect(() => {
    if (!status.didJustFinish) {
      finishedHandledRef.current = false;
      return;
    }

    if (
      finishedHandledRef.current ||
      changingRef.current ||
      selectedIdRef.current === null
    ) {
      return;
    }

    finishedHandledRef.current = true;

    const id = selectedIdRef.current;

    // Repeat the same song.
    if (repeatRef.current === "one") {
      void player
        .seekTo(0)
        .then(() => {
          if (selectedIdRef.current !== id) {
            return;
          }

          pendingPlayRef.current = id;
          player.play();
        })
        .catch((error) => {
          console.error(
            "Repeat One failed:",
            error
          );
        });

      return;
    }

    // Otherwise continue to next playable song.
    changeSong(1, true);
  }, [status.didJustFinish, player, changeSong]);

  // Seek to another position.
  const seekTo = useCallback(
    async (seconds: number) => {
      if (
        !status.isLoaded ||
        status.duration <= 0 ||
        changingRef.current
      ) {
        return;
      }

      const safeTime = Math.max(
        0,
        Math.min(seconds, status.duration)
      );

      try {
        finishedHandledRef.current = false;
        await player.seekTo(safeTime);
      } catch (error) {
        console.error("Cannot seek audio:", error);
      }
    },
    [player, status.isLoaded, status.duration]
  );

  // Stop and release audio before removing an imported MP3.
  const stopAndClearSong = useCallback(
    (id: number) => {
      if (selectedIdRef.current !== id) {
        return;
      }

      try {
        autoPlayIdRef.current = null;
        pendingPlayRef.current = null;
        wasPlayingRef.current = false;
        finishedHandledRef.current = false;

        shuffleHistoryRef.current =
          shuffleHistoryRef.current.filter(
            (songId) => songId !== id
          );

        shuffledPlayedRef.current =
          shuffledPlayedRef.current.filter(
            (songId) => songId !== id
          );

        player.pause();
        player.replace(null);

        selectedIdRef.current = null;
        setCurrentSongId(null);

        changingRef.current = false;
        setIsChanging(false);
      } catch (error) {
        console.error(
          "Cannot stop and clear song:",
          error
        );

        throw error;
      }
    },
    [player]
  );

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        currentSongId,
        allSongs,
        playing: status.playing,
        isLoaded: status.isLoaded,
        isChanging,
        duration: status.duration || 0,
        currentTime: status.currentTime || 0,
        error: status.error ?? null,
        hasAudio,

        shuffleEnabled,
        repeatMode,
        toggleShuffle,
        cycleRepeatMode,

        selectSong,
        togglePlayback,
        nextSong,
        previousSong,
        seekTo,
        stopAndClearSong,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);

  if (!context) {
    throw new Error(
      "useMusicPlayer must be used inside MusicPlayerProvider"
    );
  }

  return context;
}
