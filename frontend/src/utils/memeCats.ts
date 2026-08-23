export interface MemeCatGif {
  id: string;
  name: string;
  url: string;
  tag: string;
}

export const MEME_CAT_GIFS: MemeCatGif[] = [
  {
    id: "cat-pop",
    name: "Pop Cat",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=PopCat&backgroundColor=ffd5dc",
    tag: "Pop Pop"
  },
  {
    id: "cat-vibe",
    name: "Vibing Cat",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=VibingCat&backgroundColor=c0aede",
    tag: "Lo-Fi Vibe"
  },
  {
    id: "cat-bongo",
    name: "Bongo Cat",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=BongoCat&backgroundColor=d1d4f9",
    tag: "Bongo Beats"
  },
  {
    id: "cat-glasses",
    name: "Cool Cat",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolCat&backgroundColor=b6e3f4",
    tag: "Campus Chill"
  },
  {
    id: "cat-type",
    name: "Coding Cat",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CodingCat&backgroundColor=ffdfbf",
    tag: "Late Night Code"
  },
  {
    id: "cat-smug",
    name: "Winking Cat",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=WinkingCat&backgroundColor=c0aede",
    tag: "Secret Smile"
  },
  {
    id: "cat-dance",
    name: "Dancing Cat",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=DancingCat&backgroundColor=ffd5dc",
    tag: "Party Mode"
  },
  {
    id: "cat-laser",
    name: "Laser Eyes Cat",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=LaserCat&backgroundColor=b6e3f4",
    tag: "Hyped"
  }
];

export function getRandomMemeCat(): string {
  const item = MEME_CAT_GIFS[Math.floor(Math.random() * MEME_CAT_GIFS.length)];
  return item.url;
}

export interface InterestItem {
  id: string;
  name: string;
  emoji: string;
  category: "tech" | "creative" | "lifestyle" | "fun";
}

export const CAMPUS_INTERESTS: InterestItem[] = [
  { id: "coding", name: "Coding & Hackathons", emoji: "💻", category: "tech" },
  { id: "music", name: "Indie & Lo-Fi Music", emoji: "🎧", category: "creative" },
  { id: "coffee", name: "Coffee & Cafe Crawls", emoji: "☕", category: "lifestyle" },
  { id: "photography", name: "Film & Photography", emoji: "📸", category: "creative" },
  { id: "gaming", name: "Competitive Gaming", emoji: "🎮", category: "fun" },
  { id: "reading", name: "Late Night Books", emoji: "📚", category: "creative" },
  { id: "startups", name: "Startups & Build", emoji: "🚀", category: "tech" },
  { id: "cinema", name: "Cinema & Anime", emoji: "🍿", category: "fun" },
  { id: "fitness", name: "Gym & Calisthenics", emoji: "🏋️", category: "lifestyle" },
  { id: "art", name: "Digital Art & Design", emoji: "🎨", category: "creative" },
  { id: "talks", name: "Deep 3 AM Talks", emoji: "🧠", category: "lifestyle" },
  { id: "chess", name: "Chess & Strategy", emoji: "♟️", category: "fun" },
  { id: "beats", name: "Jamming & Beats", emoji: "🎸", category: "creative" },
  { id: "foodie", name: "Midnight Street Food", emoji: "🍕", category: "lifestyle" },
  { id: "travel", name: "Roadtrips & Travel", emoji: "✈️", category: "lifestyle" },
  { id: "memes", name: "Dank Memes & Sarcasm", emoji: "🎭", category: "fun" },
  { id: "podcasts", name: "Tech & True Crime Pods", emoji: "🎙️", category: "creative" },
  { id: "poetry", name: "Shayari & Poetry", emoji: "✍️", category: "creative" }
];

