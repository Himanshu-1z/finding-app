import React, { useState, useEffect } from "react";
import { Search as SearchIcon, SlidersHorizontal, MapPin, Brain } from "lucide-react";
import { apiFetch } from "../services/apiClient";

export function Search() {
  const [liveUsers, setLiveUsers] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/discover?page=1&pageSize=10")
      .then((res: any) => {
        if (res && res.items && Array.isArray(res.items)) {
          setLiveUsers(res.items);
        }
      })
      .catch((err) => console.warn("Live discover fetch notice:", err));
  }, []);

  return (
    <div className="w-full flex flex-col h-full relative">
      <div className="max-w-2xl mx-auto w-full mb-8 relative">
        <div className="flex items-center bg-surface-container neo-inset rounded-full p-2 pl-6">
          <SearchIcon className="text-outline w-5 h-5" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-base outline-none ml-3"
            placeholder="Search people, interests, confessions..."
          />
          <button className="bg-primary text-on-primary rounded-full p-2 neo-outset active:scale-95 transition-transform flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-on-surface mb-4">Trending Interests</h2>
        <div className="flex flex-wrap gap-3">
          {["#AbstractArt", "#Stoicism", "#UrbanExploration", "#AnalogPhotography", "#FindingRambles"].map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-full glass-blob text-primary text-sm font-semibold cursor-pointer hover:bg-white/60 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6">Discover Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveUsers.map((u: any, idx: number) => (
            <DiscoverCard
              key={u.id || idx}
              username={u.mysteryName || u.realName || "Anon Student"}
              distance={u.yearSemester ? `Semester ${u.yearSemester}` : "Campus Member"}
              match="95%"
              quote={u.interests ? `Interests: ${u.interests.join(", ")}` : "College member looking for genuine connections."}
              tags={u.interests || ["Student", "Campus"]}
              avatarUrl={u.capturedIdImage || undefined}
              icon={!u.capturedIdImage ? <Brain className="w-8 h-8" /> : undefined}
            />
          ))}

          <DiscoverCard
            username="User_8492"
            distance="2 miles away"
            match="95%"
            quote="Looking for someone to discuss existential philosophy and drink overly complicated coffee with in silence."
            tags={["Philosophy", "Coffee"]}
            avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
          />
          <DiscoverCard
            username="Enigma_Seeker"
            distance="5 miles away"
            match="82%"
            quote="I build mechanical keyboards and overanalyze classic cinema. Seeking fellow obsessive hobbyists."
            tags={["Tech", "Film"]}
            icon={<Brain className="w-8 h-8" />}
          />
          <DiscoverCard
            username="WanderingMind"
            distance="Location Hidden"
            match="78%"
            quote="Late night walks and ambient music. I don't want to talk much, just looking for shared presence."
            tags={["Ambient", "Quiet"]}
            avatarUrl="https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=150&auto=format&fit=crop"
          />
        </div>
      </div>
    </div>
  );
}

function DiscoverCard({
  username,
  distance,
  match,
  quote,
  tags,
  avatarUrl,
  icon,
}: {
  key?: React.Key;
  username: string;
  distance: string;
  match: string;
  quote: string;
  tags: string[];
  avatarUrl?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container rounded-3xl p-6 neo-inset flex flex-col relative group">
      <div className="absolute top-4 right-4 flex items-center gap-1 text-error bg-error-container/50 px-2 py-1 rounded-full text-xs font-bold glass-blob">
        🔥 {match} Match
      </div>
      <div className="flex items-center gap-4 mb-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover neo-outset" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center neo-outset text-tertiary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-bold text-on-surface text-base">{username}</h3>
          <p className="text-on-surface-variant text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {distance}
          </p>
        </div>
      </div>
      <p className="text-on-surface-variant text-sm mb-6 line-clamp-3 italic">"{quote}"</p>
      <div className="mt-auto">
        <div className="flex gap-2 mb-4">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-surface-container-high rounded text-xs text-on-surface-variant">
              {tag}
            </span>
          ))}
        </div>
        <button className="w-full py-3 rounded-full bg-primary text-on-primary font-bold neo-outset active:scale-95 transition-transform">
          Connect
        </button>
      </div>
    </div>
  );
}
