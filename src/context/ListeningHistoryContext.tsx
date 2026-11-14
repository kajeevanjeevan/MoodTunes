
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const STORAGE_KEY = "@moodtunes_listening_history";

type ListeningHistory = {
  [songId: number]: number;
};

type RecentPlay = {
  songId: number;
  playedAt: number;
};

type StoredHistory = {
  playCounts: ListeningHistory;
  recentPlays: RecentPlay[];
};

type ListeningHistoryContextType = {
  playCounts: ListeningHistory;
  recentPlays: RecentPlay[];
  totalPlays: number;
  isLoaded: boolean;
  recordPlay: (songId: number) => Promise<void>;
};

const ListeningHistoryContext =
  createContext<ListeningHistoryContextType | undefined>(
    undefined
  );

export function ListeningHistoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [history, setHistory] = useState<StoredHistory>({
    playCounts: {},
    recentPlays: [],
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);

          setHistory({
            playCounts:
              parsed?.playCounts &&
              typeof parsed.playCounts === "object"
                ? parsed.playCounts
                : {},
            recentPlays: Array.isArray(parsed?.recentPlays)
              ? parsed.recentPlays
              : [],
          });
        }
      } catch (error) {
        console.error("Could not load listening history:", error);
      } finally {
        setIsLoaded(true);
      }
    }

    void loadHistory();
  }, []);

  const recordPlay = useCallback(
    async (songId: number) => {
      if (!isLoaded) return;

      setHistory((previous) => {
        const updated: StoredHistory = {
          playCounts: {
            ...previous.playCounts,
            [songId]:
              (previous.playCounts[songId] ?? 0) + 1,
          },
          recentPlays: [
            {
              songId,
              playedAt: Date.now(),
            },
            ...previous.recentPlays,
          ].slice(0, 30),
        };

        return updated;
      });
    },
    [isLoaded]
  );

  useEffect(() => {
    if (!isLoaded) return;

    async function saveHistory() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(history)
        );
      } catch (error) {
        console.error(
          "Could not save listening history:",
          error
        );
      }
    }

    void saveHistory();
  }, [history, isLoaded]);

  const totalPlays = Object.values(
    history.playCounts
  ).reduce((sum, count) => sum + count, 0);

  return (
    <ListeningHistoryContext.Provider
      value={{
        playCounts: history.playCounts,
        recentPlays: history.recentPlays,
        totalPlays,
        isLoaded,
        recordPlay,
      }}
    >
      {children}
    </ListeningHistoryContext.Provider>
  );
}

export function useListeningHistory() {
  const context = useContext(ListeningHistoryContext);

  if (!context) {
    throw new Error(
      "useListeningHistory must be used inside ListeningHistoryProvider"
    );
  }

  return context;
}
