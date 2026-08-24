import { Heart, MessageCircle, Search, X, User, Sparkles, Building2, Laptop, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useConfessions, useAppStore } from "../store/AppContext";
import { confessionService, interactionService, apiFetch } from "../services/apiClient";
import { MEME_CAT_GIFS } from "../utils/memeCats";
import { UserProfileModal } from "../components/UserProfileModal";

// Helper to get a stable meme cat GIF for any author name
function getAuthorCatAvatar(name: string): string {
  if (!name) return MEME_CAT_GIFS[0].url;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MEME_CAT_GIFS.length;
  return MEME_CAT_GIFS[index].url;
}

export function Feed() {
  const confessions = useConfessions();
  const { dispatch } = useAppStore();
  const [filterCollege, setFilterCollege] = useState<string>("All Colleges");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileModalUser, setProfileModalUser] = useState<any>(null);

  // Fetch live confessions from backend
  const fetchLiveFeed = (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    confessionService
      .getFeed(1, 50)
      .then((res: any) => {
        const rawList = Array.isArray(res)
          ? res
          : res && Array.isArray(res.items)
          ? res.items
          : res && Array.isArray(res.value)
          ? res.value
          : [];

        if (Array.isArray(rawList)) {
          dispatch({
            type: "SET_CONFESSIONS",
            confessions: rawList.map((item: any) => ({
              id: String(item.id || item.Id || `c-${Math.random()}`),
              author: item.author || item.authorMysteryName || item.secretName || "Anonymous",
              time:
                item.time ||
                (item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "Recently"),
              content: item.content || item.Content || "",
              likes: item.likes ?? item.likesCount ?? 0,
              likedByMe: Boolean(item.likedByMe),
              isRequested: Boolean(item.isRequested),
              isMine: Boolean(item.isMine),
              type: item.type === "tagged" ? ("tagged" as const) : ("public" as const),
              authorCollege: item.authorCollege || item.collegeName || "Arya (MAIN), kukas",
              authorBranch: item.authorBranch || item.branch || "CS",
              authorYear: item.authorYear || item.yearSemester || "1",
            })),
          });
        }
      })
      .catch((err) => console.warn("Live feed fetch notice:", err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveFeed(true);
    const interval = setInterval(() => fetchLiveFeed(false), 3000);
    window.addEventListener("focus", () => fetchLiveFeed(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", () => fetchLiveFeed(false));
    };
  }, []);

  // Live user search via API
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setMatchingUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      apiFetch(`/confession/users/search?q=${encodeURIComponent(q)}`)
        .then((res: any) => {
          if (Array.isArray(res)) setMatchingUsers(res);
        })
        .catch(() => setMatchingUsers([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter confessions by College & Search Query
  const filteredConfessions = confessions.filter((confession) => {
    const matchCollege = filterCollege === "All Colleges" || confession.authorCollege === filterCollege;
    if (!matchCollege) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (confession.author || "").toLowerCase().includes(q) ||
      (confession.content || "").toLowerCase().includes(q) ||
      (confession.authorCollege || "").toLowerCase().includes(q) ||
      (confession.authorBranch || "").toLowerCase().includes(q)
    );
  });

  // College options strictly matching Signup Page options
  const collegeOptions: string[] = [
    "All Colleges",
    "Arya (OLD), kukas",
    "Arya (MAIN), kukas",
    "JEC, kukas",
    "Shankara, kukas",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
      {/* ─── TOP SEARCH BAR & HEADER ─── */}
      <div className="space-y-4 px-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Campus Feed</h1>
            <p className="text-xs text-on-surface-variant">Live anonymous stories from your college</p>
          </div>

          <div className="relative">
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-full px-4 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase tracking-wider cursor-pointer shadow-2xs"
            >
              {collegeOptions.map((col) => (
                <option key={col} value={col}>
                  {col?.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, @secret_id, or stories..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl neo-inset bg-surface text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setMatchingUsers([]);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* User Search Popup Results */}
          {matchingUsers.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-low border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden p-2 space-y-1 max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary" /> Matching Students ({matchingUsers.length})
              </div>
              {matchingUsers.map((student) => {
                const catAvatar = getAuthorCatAvatar(student.secretName || student.name);
                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      setProfileModalUser({
                        username: student.secretName || student.name,
                        college: student.college,
                        branch: student.branch,
                        year: student.yearSemester || "1",
                      });
                      setMatchingUsers([]);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/30 bg-surface-container flex-shrink-0">
                      <img src={catAvatar} alt="Meme Cat" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface truncate">@{student.secretName}</span>
                        {student.isVerifiedBadge && (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Verified</span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {student.name} • {student.college} ({student.branch})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── CONFESSIONS LIST ─── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant animate-pulse">Loading campus stories...</p>
        </div>
      ) : filteredConfessions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
          <p className="text-base font-semibold text-on-surface mb-1">
            {searchQuery ? "No matching confessions or students found" : "No confessions yet"}
          </p>
          <p className="text-xs text-on-surface-variant mb-4">
            {searchQuery
              ? "Try searching for a different name or clear the search query."
              : "Be the first to share an anonymous story on your campus!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConfessions.map((confession) => (
            <ConfessionCard
              key={confession.id}
              id={confession.id}
              author={confession.author}
              time={confession.time}
              content={confession.content}
              likes={confession.likes}
              likedByMe={confession.likedByMe}
              isRequested={confession.isRequested}
              authorCollege={confession.authorCollege}
              authorBranch={confession.authorBranch}
              authorYear={confession.authorYear}
              onOpenProfile={(authorData) => setProfileModalUser(authorData)}
            />
          ))}
        </div>
      )}

      {/* Anonymous Profile Details Modal */}
      {profileModalUser && (
        <UserProfileModal
          username={profileModalUser.username}
          onClose={() => setProfileModalUser(null)}
          fallbackData={{
            college: profileModalUser.college,
            branch: profileModalUser.branch,
            year: profileModalUser.year,
          }}
        />
      )}
    </div>
  );
}

interface ConfessionCardProps {
  key?: React.Key;
  id: string;
  author: string;
  time: string;
  content: string;
  likes: number;
  likedByMe: boolean;
  isRequested: boolean;
  authorCollege?: string;
  authorBranch?: string;
  authorYear?: string;
  onOpenProfile?: (data: any) => void;
}

function ConfessionCard({
  id,
  author,
  time,
  content,
  likes,
  likedByMe,
  isRequested,
  authorCollege,
  authorBranch,
  authorYear,
  onOpenProfile,
}: ConfessionCardProps) {
  const { state, dispatch } = useAppStore();
  const [showOverlayHeart, setShowOverlayHeart] = useState(false);

  // Check if current user is the author of this confession
  const currentSecretName = (state.user?.secretName || "").trim().toLowerCase();
  const currentRealName = (state.user?.name || "").trim().toLowerCase();
  const authorClean = (author || "").trim().toLowerCase();
  const isOwnStory = Boolean(
    (currentSecretName && authorClean === currentSecretName) ||
    (currentRealName && authorClean === currentRealName)
  );

  const handleCardDoubleTap = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!likedByMe) {
      dispatch({ type: "TOGGLE_LIKE", id });
      try {
        const res: any = await confessionService.likeConfession(id);
        if (res && typeof res.likes === "number") {
          dispatch({ type: "UPDATE_CONFESSION_LIKES", id, likes: res.likes, likedByMe: res.liked });
        }
      } catch (err) {
        console.warn(err);
      }
    }
    setShowOverlayHeart(true);
    setTimeout(() => setShowOverlayHeart(false), 800);
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "TOGGLE_LIKE", id });
    try {
      const res: any = await confessionService.likeConfession(id);
      if (res && typeof res.likes === "number") {
        dispatch({ type: "UPDATE_CONFESSION_LIKES", id, likes: res.likes, likedByMe: res.liked });
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const hasOutgoingRequest = state.connectionRequests.some(
    (r: any) => (r.confessionId === id || r.id === id) && (r.isOutgoing || r.status === "pending" || r.status === "accepted")
  );
  const isAlreadySent = Boolean(isRequested || hasOutgoingRequest);

  const handleInteractToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwnStory || isAlreadySent) return;
    dispatch({ type: "TOGGLE_REQUEST", id });
    // 3 = InteractRequested
    interactionService.respondToConfession(id, 3).catch(err => console.warn("Interaction request error:", err));
  };

  const authorCat = getAuthorCatAvatar(author);

  return (
    <div
      onDoubleClick={handleCardDoubleTap}
      className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow select-none"
    >
      {/* Floating Center Heart Overlay on Double Tap */}
      <AnimatePresence>
        {showOverlayHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.35, 1.1, 0.8], y: [10, -10, -20, -30] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, times: [0, 0.3, 0.6, 1], ease: "easeOut" }}
            className="absolute inset-0 m-auto w-20 h-20 flex items-center justify-center z-30 pointer-events-none drop-shadow-xl"
          >
            <Heart className="w-20 h-20 fill-red-500 text-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1">
        {/* Header: Author Meme Cat Avatar + College + Branch + Year */}
        <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.({
                username: author,
                college: authorCollege,
                branch: authorBranch,
                year: authorYear,
              });
            }}
            className="flex items-center gap-2.5 flex-wrap cursor-pointer hover:opacity-85 transition-opacity group/author"
            title={`View @${author}'s anonymous profile`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 bg-surface-container flex-shrink-0 shadow-2xs group-hover/author:scale-105 transition-transform">
              <img src={authorCat} alt="Meme Cat" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold text-on-surface group-hover/author:underline">@{author}</span>
            {authorCollege && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                🏫 {authorCollege}
              </span>
            )}
            {authorBranch && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                💻 {authorBranch}
              </span>
            )}
            {authorYear && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                🎓 Sem {authorYear}
              </span>
            )}
          </div>
          <span className="text-[10px] text-outline self-center">{time}</span>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed pl-1">{content}</p>
      </div>

      <div className="flex justify-between items-center mt-4 pt-2 border-t border-outline-variant/30">
        {/* Public Likes Count Badge visible to everyone */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container neo-inset text-xs font-bold text-on-surface">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>
            {likes} {likes === 1 ? "like" : "likes"}
          </span>
        </div>

        <div className="flex items-center">
          {/* If own story, show "Your Story" badge instead of Interact */}
          {isOwnStory ? (
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary/10 text-primary border border-primary/25 text-[10px] font-extrabold uppercase tracking-wider mr-2 shadow-xs select-none">
              ✨ Your Story
            </span>
          ) : (
            <button
              type="button"
              disabled={isAlreadySent}
              onClick={handleInteractToggle}
              className={`flex items-center gap-1.5 px-4 h-10 rounded-full border transition-all duration-300 mr-2 shadow-xs select-none ${
                isAlreadySent
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 cursor-default ring-1 ring-emerald-500/25 pointer-events-none"
                  : "text-primary bg-surface border-outline-variant hover:bg-surface-container-high active:scale-95 cursor-pointer"
              }`}
            >
              {isAlreadySent ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5] animate-in zoom-in-75 duration-200" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    SENT
                  </span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    INTERACT
                  </span>
                </>
              )}
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLikeToggle}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-primary bg-surface border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Like story"
          >
            <motion.div
              key={likedByMe ? "liked" : "unliked"}
              initial={{ scale: 0.8 }}
              animate={likedByMe ? { scale: [0.8, 0.6, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 transition-colors duration-200 ${
                  likedByMe ? "fill-red-500 text-red-500" : "text-primary hover:text-red-400"
                }`}
              />
            </motion.div>

            {likedByMe && (
              <motion.span
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-6 h-6 rounded-full border-2 border-red-500/60 pointer-events-none"
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

