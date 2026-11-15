
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ImportedSong = {
  id: number;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  emoji: string;
  uri: string;
};

type SongChanges = Partial<
  Pick<ImportedSong, "title" | "artist" | "mood">
>;

type ImportedSongsContextType = {
  importedSongs: ImportedSong[];
  isLoaded: boolean;
  addImportedSong: (song: ImportedSong) => Promise<void>;
  updateImportedSong: (
    id: number,
    changes: SongChanges
  ) => Promise<void>;
  removeImportedSong: (id: number) => Promise<void>;
};

const STORAGE_KEY = "@moodtunes_imported_songs";

const ImportedSongsContext = createContext<
  ImportedSongsContextType | undefined
>(undefined);

export function ImportedSongsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [importedSongs, setImportedSongs] = useState<
    ImportedSong[]
  >([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const songsRef = useRef<ImportedSong[]>([]);

  const saveQueueRef = useRef<Promise<void>>(
    Promise.resolve()
  );

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_KEY
        );

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const validSongs = parsed.filter(
              (song): song is ImportedSong =>
                typeof song === "object" &&
                song !== null &&
                typeof song.id === "number" &&
                typeof song.title === "string" &&
                typeof song.uri === "string" &&
                typeof song.artist === "string" &&
                typeof song.genre === "string" &&
                typeof song.mood === "string" &&
                typeof song.emoji === "string"
            );

            songsRef.current = validSongs;
            setImportedSongs(validSongs);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load imported songs:",
          error
        );
      } finally {
        setIsLoaded(true);
      }
    };

    void loadSongs();
  }, []);

  const saveSongs = (updatedSongs: ImportedSong[]) => {
    const saveOperation = saveQueueRef.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updatedSongs)
        )
      );

    saveQueueRef.current = saveOperation;
    return saveOperation;
  };

  const addImportedSong = async (song: ImportedSong) => {
    if (!isLoaded) {
      throw new Error("Music library is still loading.");
    }

    const updatedSongs = [
      ...songsRef.current.filter(
        (item) => item.id !== song.id
      ),
      song,
    ];

    await saveSongs(updatedSongs);

    songsRef.current = updatedSongs;
    setImportedSongs(updatedSongs);
  };

  // Update only song information, not the MP3 file.
  const updateImportedSong = async (
    id: number,
    changes: SongChanges
  ) => {
    if (!isLoaded) {
      throw new Error("Music library is still loading.");
    }

    const existingSong = songsRef.current.find(
      (song) => song.id === id
    );

    if (!existingSong) {
      throw new Error("Imported song not found.");
    }

    const updatedSongs = songsRef.current.map(
      (song) =>
        song.id === id
          ? {
              ...song,
              ...changes,
              title:
                changes.title !== undefined
                  ? changes.title.trim() || song.title
                  : song.title,
              artist:
                changes.artist !== undefined
                  ? changes.artist.trim() ||
                    "Unknown Artist"
                  : song.artist,
            }
          : song
    );

    await saveSongs(updatedSongs);

    songsRef.current = updatedSongs;
    setImportedSongs(updatedSongs);
  };

  const removeImportedSong = async (id: number) => {
    if (!isLoaded) {
      throw new Error("Music library is still loading.");
    }

    const songToRemove = songsRef.current.find(
      (song) => song.id === id
    );

    if (!songToRemove) return;

    const updatedSongs = songsRef.current.filter(
      (song) => song.id !== id
    );

    await saveSongs(updatedSongs);

    songsRef.current = updatedSongs;
    setImportedSongs(updatedSongs);

    // Delete only MoodTunes' own imported copy.
    // Never delete the original MP3 from the phone.
    const expectedName = `song-${id}.mp3`;

    if (
      songToRemove.uri.startsWith("file://") &&
      songToRemove.uri.includes("/moodtunes-music/") &&
      songToRemove.uri.endsWith(`/${expectedName}`)
    ) {
      try {
        const importedFile = new File(songToRemove.uri);

        if (importedFile.exists) {
          importedFile.delete();
        }
      } catch (error) {
        console.error(
          "Could not delete imported MP3 copy:",
          error
        );

        throw new Error(
          "Song was removed from the Library, but its imported audio file could not be deleted."
        );
      }
    }
  };

  return (
    <ImportedSongsContext.Provider
      value={{
        importedSongs,
        isLoaded,
        addImportedSong,
        updateImportedSong,
        removeImportedSong,
      }}
    >
      {children}
    </ImportedSongsContext.Provider>
  );
}

export function useImportedSongs() {
  const context = useContext(ImportedSongsContext);

  if (!context) {
    throw new Error(
      "useImportedSongs must be used inside ImportedSongsProvider"
    );
  }

  return context;
}
