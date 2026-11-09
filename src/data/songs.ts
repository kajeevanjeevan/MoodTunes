
export type Song = {
  id: number;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  emoji: string;
};

export const songs: Song[] = [
  {
    id: 1,
    title: "Sunny Morning",
    artist: "MoodTunes Studio",
    genre: "Pop",
    mood: "Happy",
    emoji: "☀️",
  },
  {
    id: 2,
    title: "Quiet Rain",
    artist: "MoodTunes Studio",
    genre: "Ambient",
    mood: "Sad",
    emoji: "🌧️",
  },
  {
    id: 3,
    title: "Peaceful Garden",
    artist: "MoodTunes Studio",
    genre: "Ambient",
    mood: "Calm",
    emoji: "🌿",
  },
  {
    id: 4,
    title: "Electric Pulse",
    artist: "MoodTunes Studio",
    genre: "Electronic",
    mood: "Energetic",
    emoji: "⚡",
  },
  {
    id: 5,
    title: "Deep Focus",
    artist: "MoodTunes Studio",
    genre: "Instrumental",
    mood: "Focus",
    emoji: "🧠",
  },
];
