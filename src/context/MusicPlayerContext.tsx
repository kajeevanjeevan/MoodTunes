
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
export type PlaybackMode = "library" | "playlist";

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

  playbackMode: PlaybackMode;
  activePlaylistId: string | null;
  activePlaylistName: string | null;
  playbackSongIds: number[];

  // Sleep timer uses real elapsed minutes, even while playback is paused.
  sleepTimerRemainingSeconds: number;
  sleepTimerEndTime: number | null;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;

  queue: number[];
  addToQueue: (id: number) => void;
  playNext: (id: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  startLibrarySong: (id: number) => void;
  startPlaylistSong: (
    id: number,
    playlistId: string,
    playlistName: string,
    songIds: number[]
  ) => void;

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

  const [playbackMode, setPlaybackMode] =
    useState<PlaybackMode>("library");

  const [activePlaylistId, setActivePlaylistId] =
    useState<string | null>(null);

  const [activePlaylistName, setActivePlaylistName] =
    useState<string | null>(null);

  const [playbackSongIds, setPlaybackSongIds] =
    useState<number[]>([]);

  const [queue, setQueue] = useState<number[]>([]);

  const [sleepTimerEndTime, setSleepTimerEndTime] =
    useState<number | null>(null);
  const [sleepTimerRemainingSeconds, setSleepTimerRemainingSeconds] =
    useState(0);
  const sleepTimerDeadlineRef = useRef<number | null>(null);

  const player = useAudioPlayer(null, {
    updateInterval: 500,
  });

  const status = useAudioPlayerStatus(player);

  const cancelSleepTimer = useCallback(() => {
    sleepTimerDeadlineRef.current = null;
    setSleepTimerEndTime(null);
    setSleepTimerRemainingSeconds(0);
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    const deadline = Date.now() + Math.round(minutes * 60_000);
    sleepTimerDeadlineRef.current = deadline;
    setSleepTimerEndTime(deadline);
    setSleepTimerRemainingSeconds(
      Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    );
  }, []);

  // Keep this timer in the shared provider so it continues after
  // the Player screen is closed. A new timer replaces the old one.
  useEffect(() => {
    if (sleepTimerEndTime === null) return;

    const updateTimer = () => {
      const deadline = sleepTimerDeadlineRef.current;
      if (deadline === null || deadline !== sleepTimerEndTime) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );
      setSleepTimerRemainingSeconds(remaining);

      if (remaining === 0) {
        // Clear pending automatic playback as well as pausing the
        // current song, so a loading song cannot restart afterward.
        autoPlayIdRef.current = null;
        pendingPlayRef.current = null;
        player.pause();
        cancelSleepTimer();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, player, cancelSleepTimer]);

  const selectedIdRef = useRef<number | null>(null);
  const pendingPlayRef = useRef<number | null>(null);
  const autoPlayIdRef = useRef<number | null>(null);

  const wasPlayingRef = useRef(false);
  const changingRef = useRef(false);
  const finishedHandledRef = useRef(false);

  const shuffleHistoryRef = useRef<number[]>([]);
  const shuffledPlayedRef = useRef<number[]>([]);

  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("off");

  const modeRef = useRef<PlaybackMode>("library");
  const playbackIdsRef = useRef<number[]>([]);
  const queueRef = useRef<number[]>([]);

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

  const isPlayable = useCallback(
    (id: number) => {
      const exists =
        songs.some((song) => song.id === id) ||
        importedSongs.some((song) => song.id === id);

      return exists && getAudioSource(id) !== null;
    },
    [importedSongs, getAudioSource]
  );

  const getPlayableIds = useCallback(() => {
    return [...songs, ...importedSongs]
      .filter((song) => isPlayable(song.id))
      .map((song) => song.id);
  }, [importedSongs, isPlayable]);

  const updateQueue = useCallback(
    (updated: number[]) => {
      queueRef.current = updated;
      setQueue(updated);
    },
    []
  );

  const resetShuffleHistory = useCallback(() => {
    shuffleHistoryRef.current = [];
    shuffledPlayedRef.current = [];
  }, []);

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

  // Save playback preferences.
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

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;

    shuffleRef.current = next;
    resetShuffleHistory();
    setShuffleEnabled(next);
  }, [resetShuffleHistory]);

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

  // Internal song selection.
  // This does not change Library or Playlist mode.
  const selectSong = useCallback(
    (id: number) => {
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

  // Start a single song from the Library.
  const startLibrarySong = useCallback(
    (id: number) => {
      modeRef.current = "library";
      playbackIdsRef.current = [];

      setPlaybackMode("library");
      setActivePlaylistId(null);
      setActivePlaylistName(null);
      setPlaybackSongIds([]);

      resetShuffleHistory();
      updateQueue([]);

      selectSong(id);
    },
    [selectSong, resetShuffleHistory, updateQueue]
  );

  // Start playback from a specific playlist.
  const startPlaylistSong = useCallback(
    (
      id: number,
      playlistId: string,
      playlistName: string,
      songIds: number[]
    ) => {
      const validIds = Array.from(
        new Set(songIds.filter(isPlayable))
      );

      if (!validIds.includes(id)) return;

      modeRef.current = "playlist";
      playbackIdsRef.current = validIds;

      setPlaybackMode("playlist");
      setActivePlaylistId(playlistId);
      setActivePlaylistName(playlistName);
      setPlaybackSongIds(validIds);

      resetShuffleHistory();
      updateQueue([]);

      selectSong(id);
    },
    [
      isPlayable,
      selectSong,
      resetShuffleHistory,
      updateQueue,
    ]
  );

  // Add a song to the end of the queue.
  const addToQueue = useCallback(
    (id: number) => {
      if (!isPlayable(id)) return;

      updateQueue([...queueRef.current, id]);
    },
    [isPlayable, updateQueue]
  );

  // Put a song at the beginning of the queue.
  const playNext = useCallback(
    (id: number) => {
      if (!isPlayable(id)) return;

      updateQueue([id, ...queueRef.current]);
    },
    [isPlayable, updateQueue]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      if (
        index < 0 ||
        index >= queueRef.current.length
      ) {
        return;
      }

      updateQueue(
        queueRef.current.filter(
          (_, itemIndex) => itemIndex !== index
        )
      );
    },
    [updateQueue]
  );

  const clearQueue = useCallback(() => {
    updateQueue([]);
  }, [updateQueue]);

  // Take the next valid song from the queue.
  const consumeQueue = useCallback(() => {
    const currentQueue = queueRef.current;

    const index = currentQueue.findIndex(isPlayable);

    if (index < 0) {
      if (currentQueue.length > 0) {
        updateQueue([]);
      }
      return null;
    }

    const nextId = currentQueue[index];

    updateQueue(currentQueue.slice(index + 1));

    return nextId;
  }, [isPlayable, updateQueue]);

  // Start playback when audio has loaded.
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

  // Record listening history.
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

  // Replay the current song from the beginning.
  const replayCurrentSong = useCallback(() => {
    const id = selectedIdRef.current;

    if (id === null) return;

    void player
      .seekTo(0)
      .then(() => {
        if (selectedIdRef.current !== id) return;

        finishedHandledRef.current = false;
        pendingPlayRef.current = id;
        player.play();
      })
      .catch((error) => {
        console.error("Cannot replay song:", error);
      });
  }, [player]);

  // Determine which songs are available for navigation.
  const getNavigationIds = useCallback(() => {
    const playableIds = getPlayableIds();

    if (modeRef.current === "playlist") {
      return playbackIdsRef.current.filter(
        (id) => playableIds.includes(id)
      );
    }

    // In Library mode, manual navigation and
    // explicitly enabled Shuffle use the Library.
    return playableIds;
  }, [getPlayableIds]);

  const changeSong = useCallback(
    (direction: number, automatic = false) => {
      const currentId = selectedIdRef.current;

      if (
        currentId === null ||
        changingRef.current
      ) {
        return;
      }

      // Queued songs have priority over normal Next.
      if (direction > 0) {
        const queuedId = consumeQueue();

        if (queuedId !== null) {
          if (queuedId === currentId) {
            replayCurrentSong();
          } else {
            selectSong(queuedId);
          }
          return;
        }
      }

      const playableIds = getNavigationIds();

      if (playableIds.length === 0) return;

      // Library mode plays one song automatically
      // unless Shuffle or Repeat is enabled.
      if (
        automatic &&
        modeRef.current === "library" &&
        !shuffleRef.current
      ) {
        if (repeatRef.current === "all") {
          replayCurrentSong();
        }
        return;
      }

      const index = playableIds.indexOf(currentId);

      // Shuffle navigation.
      if (shuffleRef.current) {
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

        const visited = new Set([
          ...shuffledPlayedRef.current,
          currentId,
        ]);

        let choices = playableIds.filter(
          (id) =>
            id !== currentId &&
            !visited.has(id)
        );

        if (choices.length === 0) {
          if (
            automatic &&
            repeatRef.current !== "all"
          ) {
            return;
          }

          shuffledPlayedRef.current = [];

          choices = playableIds.filter(
            (id) => id !== currentId
          );
        }

        if (choices.length === 0) {
          if (
            automatic &&
            repeatRef.current === "all"
          ) {
            replayCurrentSong();
          }
          return;
        }

        const randomIndex = Math.floor(
          Math.random() * choices.length
        );

        const nextId = choices[randomIndex];

        shuffledPlayedRef.current.push(currentId);
        shuffleHistoryRef.current.push(currentId);

        selectSong(nextId);
        return;
      }

      // Normal sequential navigation.
      if (index < 0) {
        if (!automatic) {
          selectSong(playableIds[0]);
        }
        return;
      }

      let nextIndex = index + direction;

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
        replayCurrentSong();
      }
    },
    [
      consumeQueue,
      getNavigationIds,
      replayCurrentSong,
      selectSong,
    ]
  );

  const nextSong = useCallback(() => {
    changeSong(1);
  }, [changeSong]);

  const previousSong = useCallback(() => {
    changeSong(-1);
  }, [changeSong]);

  // Handle completion of the current song.
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

    // Repeat One takes priority over the queue.
    if (repeatRef.current === "one") {
      replayCurrentSong();
      return;
    }

    changeSong(1, true);
  }, [
    status.didJustFinish,
    changeSong,
    replayCurrentSong,
  ]);

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

  // Stop audio before removing an imported song.
  const stopAndClearSong = useCallback(
    (id: number) => {
      // Remove the song from the manual queue.
      updateQueue(
        queueRef.current.filter(
          (songId) => songId !== id
        )
      );

      // Remove it from playlist playback.
      const remainingIds =
        playbackIdsRef.current.filter(
          (songId) => songId !== id
        );

      playbackIdsRef.current = remainingIds;
      setPlaybackSongIds(remainingIds);

      shuffleHistoryRef.current =
        shuffleHistoryRef.current.filter(
          (songId) => songId !== id
        );

      shuffledPlayedRef.current =
        shuffledPlayedRef.current.filter(
          (songId) => songId !== id
        );

      if (selectedIdRef.current !== id) {
        return;
      }

      try {
        autoPlayIdRef.current = null;
        pendingPlayRef.current = null;
        wasPlayingRef.current = false;
        finishedHandledRef.current = false;

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
    [player, updateQueue]
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

        playbackMode,
        activePlaylistId,
        activePlaylistName,
        playbackSongIds,

        sleepTimerRemainingSeconds,
        sleepTimerEndTime,
        startSleepTimer,
        cancelSleepTimer,

        queue,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,

        startLibrarySong,
        startPlaylistSong,

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
