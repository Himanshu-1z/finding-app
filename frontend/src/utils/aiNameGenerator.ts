export interface AiNameContext {
  gender?: "male" | "female" | string;
  semester?: string | number;
  branch?: string;
  interests?: string[];
}

const PREFIXES = {
  cs: ["Cyber", "Byte", "Quantum", "Neon", "Pixel", "Null", "Binary", "Neural", "Algo", "Matrix"],
  it: ["Cloud", "Digital", "Packet", "Vector", "Crypto", "Silicon", "Nexus", "Hyper"],
  aids: ["Neural", "Synapse", "Cortex", "Data", "Turing", "Deep", "Prism", "Aura", "Omni"],
  elec: ["Volt", "Pulse", "Circuit", "Spark", "Flux", "Laser", "Current", "Resistor", "Tesla"],
  mech: ["Turbo", "Mach", "Velo", "Kinetic", "Gear", "Torque", "Piston", "Aero", "Titan"],
  default: ["Shadow", "Phantom", "Echo", "Cosmic", "Astral", "Silent", "Velvet", "Zenith", "Mystic", "Starlight"],
};

const INTEREST_KEYWORDS: Record<string, string[]> = {
  coding: ["Hacker", "Dev", "Coder", "Architect", "Ninja", "Terminal"],
  music: ["Melody", "Riff", "Acoustic", "Sonic", "Beat", "Harmonic", "LoFi"],
  coffee: ["Brew", "Mocha", "Espresso", "Barista", "Roast", "Caffeine"],
  photography: ["Shutter", "Lens", "Focus", "Aperture", "Frame", "ISO"],
  gaming: ["Gamer", "Rogue", "Striker", "Valkyrie", "Phantom", "Slayer"],
  reading: ["Scholar", "Novelist", "Prose", "Scroll", "Bibliophile"],
  startups: ["Founder", "Venture", "Hustler", "Visionary", "Builder"],
  cinema: ["Otaku", "Director", "Shinobi", "Cinephile", "Reel"],
  fitness: ["Beast", "Titan", "Runner", "Athlete", "Warrior"],
  art: ["Canva", "Artist", "Muse", "Palette", "PixelArt"],
  talks: ["Philosopher", "Nocturnal", "Midnight", "Soul", "Thinker"],
  chess: ["Grandmaster", "Knight", "Bishop", "Gambit", "Strategist"],
  beats: ["Drummer", "Maestro", "Bass", "Groove", "Synth"],
  foodie: ["Gourmet", "Craver", "Nomad", "Flavor", "Muncher"],
  travel: ["Voyager", "Drifter", "Wanderer", "Explorer", "Rover"],
  memes: ["Memer", "Jester", "Dank", "Sarcastic", "Laugh"],
  podcasts: ["Broadcaster", "Voice", "Speaker", "Cast", "Oracle"],
  poetry: ["Poet", "Shayar", "Lyric", "Rhyme", "Verse"],
};

const GENDER_MODIFIERS = {
  female: ["Siren", "Muse", "Goddess", "Valkyrie", "Star", "Duchess", "Queen", "Empress", "Lotus", "Bella"],
  male: ["Knight", "Baron", "Lord", "Hunter", "King", "Maverick", "Shadow", "Captain", "Gladiator", "Chief"],
  neutral: ["Nomad", "Observer", "Specter", "Wanderer", "Phantom", "Voyager", "Mystic", "Sage", "Legend"],
};

const YEAR_TITLES: Record<string, string[]> = {
  "1": ["Novice", "Spark", "Fresher", "Scout", "Newbie"],
  "2": ["Explorer", "Seeker", "Rising", "Striker"],
  "3": ["Builder", "Craftsman", "Vanguard", "Catalyst"],
  "4": ["Specialist", "Architect", "Strategist", "Pioneer"],
  "5": ["Guru", "Veteran", "Lead"],
  "6": ["Elite", "Senior", "Master"],
  "7": ["Legend", "Maestro", "Champion"],
  "8": ["Grandmaster", "Alumnus", "Prime", "Apex"],
};

export function generateAiAnonymousNames(context: AiNameContext, count: number = 6): string[] {
  const branchKey = String(context.branch || "").toLowerCase();
  let prefixPool: string[] = PREFIXES.default;
  if (branchKey.includes("cs") || branchKey.includes("computer")) prefixPool = [...PREFIXES.cs, ...PREFIXES.default];
  else if (branchKey.includes("it")) prefixPool = [...PREFIXES.it, ...PREFIXES.default];
  else if (branchKey.includes("ai") || branchKey.includes("ds")) prefixPool = [...PREFIXES.aids, ...PREFIXES.default];
  else if (branchKey.includes("elec") || branchKey.includes("ee")) prefixPool = [...PREFIXES.elec, ...PREFIXES.default];
  else if (branchKey.includes("mech") || branchKey.includes("me")) prefixPool = [...PREFIXES.mech, ...PREFIXES.default];

  const genderKey = context.gender === "female" ? "female" : context.gender === "male" ? "male" : "neutral";
  const genderPool = GENDER_MODIFIERS[genderKey];

  const semKey = String(context.semester || "1");
  const yearPool = YEAR_TITLES[semKey] || YEAR_TITLES["1"];

  // Collect keyword pool from chosen interests
  let interestPool: string[] = [];
  if (context.interests && context.interests.length > 0) {
    context.interests.forEach((item) => {
      const lower = item.toLowerCase();
      for (const [k, words] of Object.entries(INTEREST_KEYWORDS)) {
        if (lower.includes(k) || k.includes(lower)) {
          interestPool.push(...words);
        }
      }
    });
  }
  if (interestPool.length === 0) {
    interestPool = ["Storyteller", "Echo", "Dreamer", "Seeker", "Voyager", "Pulse", "Vibe", "Mind", "Observer"];
  }

  const generated = new Set<string>();
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  let attempts = 0;
  while (generated.size < count && attempts < 50) {
    attempts++;
    const style = attempts % 4;
    let name = "";

    if (style === 0) {
      // Prefix + Interest (e.g. CyberHacker, NeonLoFi, VoltDev)
      name = `${pick(prefixPool)}${pick(interestPool)}`;
    } else if (style === 1) {
      // Prefix + Gender Title (e.g. VelvetMuse, QuantumKnight, StarlightSiren)
      name = `${pick(prefixPool)}${pick(genderPool)}`;
    } else if (style === 2) {
      // Interest + Year Title (e.g. CodeArchitect, LoFiNovice, GamerApex)
      name = `${pick(interestPool)}${pick(yearPool)}`;
    } else {
      // Prefix + Interest + random number or suffix (e.g. AstralBard, CosmicDev)
      name = `${pick(prefixPool)}${pick(interestPool)}`;
    }

    if (name.length >= 4 && name.length <= 18) {
      generated.add(name);
    }
  }

  return Array.from(generated);
}
