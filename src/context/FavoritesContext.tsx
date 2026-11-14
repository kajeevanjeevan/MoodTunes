
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type FavoritesContextType = {
  favorites: number[];
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  clearFavorites: () => void;
};

const STORAGE_KEY = "@moodtunes_favorites";

const FavoritesContext = createContext<
  FavoritesContextType | undefined
>(undefined);

export function FavoritesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved favorites when the app starts
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (savedFavorites !== null) {
          const parsed: unknown = JSON.parse(savedFavorites);

          if (
            Array.isArray(parsed) &&
            parsed.every(
              (id) =>
                typeof id === "number" &&
                Number.isInteger(id)
            )
          ) {
            setFavorites(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadFavorites();
  }, []);

  // Save favorites whenever they change
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(favorites)
        );
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }
    };

    void saveFavorites();
  }, [favorites, isLoaded]);

  // Add or remove one favorite song
  const toggleFavorite = (id: number) => {
    if (!isLoaded) {
      return;
    }

    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((songId) => songId !== id)
        : [...previous, id]
    );
  };

  // Check whether a song is a favorite
  const isFavorite = (id: number) => {
    return favorites.includes(id);
  };

  // Remove all favorite songs
  const clearFavorites = () => {
    if (!isLoaded) {
      return;
    }

    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider"
    );
  }

  return context;
}
