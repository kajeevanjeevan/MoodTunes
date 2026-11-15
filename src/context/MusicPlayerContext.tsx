
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
  selectSong: (id: number) => void;
  togglePlayback: () => Promise<void>;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (seconds: number) => Promise<void>;
  stopAndClearSong: (id: number) => void;
};

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

  const player = useAudioPlayer(null, {
    updateInterval: 500,
  });

  const status = useAudioPlayerStatus(player);

  const selectedIdRef = useRef<number | null>(null);
  const pendingPlayRef = useRef<number | null>(null);
  const autoPlayIdRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const changingRef = useRef(false);

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

  // Selecting a song requests automatic playback.
  const selectSong = useCallback(
    (id: number) => {
      // Do not restart the song when reopening its screen.
      if (selectedIdRef.current === id) {
        return;
      }

      const exists =
        songs.some((song) => song.id === id) ||
        importedSongs.some((song) => song.id === id);

      if (!exists) {
        return;
      }

      const source = getAudioSource(id);

      changingRef.current = true;
      setIsChanging(true);

      try {
        pendingPlayRef.current = null;
        autoPlayIdRef.current = source ? id : null;
        wasPlayingRef.current = false;

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

  // Start playback when the selected audio becomes ready.
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
  }, [
    currentSongId,
    status.isLoaded,
    player,
  ]);

  // Save listening history when playback starts.
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

  // Next and Previous select the new song.
  // selectSong handles automatic playback.
  const changeSong = useCallback(
    (direction: number) => {
      if (
        currentSongId === null ||
        changingRef.current ||
        allSongs.length === 0
      ) {
        return;
      }

      const index = allSongs.findIndex(
        (song) => song.id === currentSongId
      );

      if (index < 0) {
        return;
      }

      // Skip songs that do not have audio.
      for (
        let offset = 1;
        offset <= allSongs.length;
        offset++
      ) {
        const nextIndex =
          (
            index +
            direction * offset +
            allSongs.length * (offset + 1)
          ) % allSongs.length;

        const candidate = allSongs[nextIndex];

        if (getAudioSource(candidate.id)) {
          selectSong(candidate.id);
          return;
        }
      }
    },
    [
      currentSongId,
      allSongs,
      getAudioSource,
      selectSong,
    ]
  );

  const nextSong = useCallback(
    () => changeSong(1),
    [changeSong]
  );

  const previousSong = useCallback(
    () => changeSong(-1),
    [changeSong]
  );

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
        await player.seekTo(safeTime);
      } catch (error) {
        console.error("Cannot seek audio:", error);
      }
    },
    [player, status.isLoaded, status.duration]
  );

  // Stop and release an imported MP3 before removal.
  const stopAndClearSong = useCallback(
    (id: number) => {
      if (selectedIdRef.current !== id) {
        return;
      }

      try {
        autoPlayIdRef.current = null;
        pendingPlayRef.current = null;
        wasPlayingRef.current = false;

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
