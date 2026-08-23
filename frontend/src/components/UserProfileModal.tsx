import { useState, useEffect } from "react";
import { X, Sparkles, Building2, GraduationCap, Heart, BookOpen, ShieldCheck } from "lucide-react";
import { apiFetch } from "../services/apiClient";

interface UserProfileModalProps {
  username: string | null;
  onClose: () => void;
  fallbackData?: {
    college?: string;
    branch?: string;
    year?: string;
  };
}

export function UserProfileModal({ username, onClose, fallbackData }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    const cleanUser = username.replace(/^@/, "").trim();

    apiFetch(`/auth/profile/${encodeURIComponent(cleanUser)}`)
      .then((res: any) => {
        if (res && res.anonymousUsername) {
          setProfile(res);
        } else {
          setProfile({
            anonymousUsername: cleanUser,
            collegeName: fallbackData?.college || "Arya (MAIN), kukas",
            branch: fallbackData?.branch || "CS",
            yearSemester: fallbackData?.year || "1",
            interests: ["Coding", "Gaming", "Campus Life", "Night Walks", "Music"],
            storiesCount: 1,
            likesReceived: 0,
          });
        }
      })
      .catch(() => {
        setProfile({
          anonymousUsername: cleanUser,
          collegeName: fallbackData?.college || "Arya (MAIN), kukas",
          branch: fallbackData?.branch || "CS",
          yearSemester: fallbackData?.year || "1",
          interests: ["Coding", "Gaming", "Campus Life", "Night Walks", "Music"],
          storiesCount: 1,
          likesReceived: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [username, fallbackData]);

  if (!username) return null;

  const cleanHandle = username.replace(/^@/, "");

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface rounded-3xl p-6 relative border border-white/20 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar & Header */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative w-20 h-20 rounded-full bg-surface-container-high border-3 border-primary p-1 shadow-md mb-3">
            <img
              src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${cleanHandle}&backgroundColor=ffd5dc`}
              alt={cleanHandle}
              className="w-full h-full object-cover rounded-full"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-surface" />
          </div>

          <h2 className="text-xl font-bold text-on-surface flex items-center gap-1.5">
            @{cleanHandle}
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-1 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anonymous Campus Profile</span>
          </div>
        </div>

        {/* Academic Details Card */}
        <div className="space-y-2 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/50">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-on-surface">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{profile?.collegeName || fallbackData?.college || "Arya (MAIN), kukas"}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-on-surface">
            <GraduationCap className="w-4 h-4 text-secondary shrink-0" />
            <span>
              Branch: <span className="text-primary font-bold">{profile?.branch || fallbackData?.branch || "CS"}</span> • Semester: <span className="text-primary font-bold">{profile?.yearSemester || fallbackData?.year || "1"}</span>
            </span>
          </div>
        </div>

        {/* Hobbies & Interests */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> Interests & Hobbies
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.interests && profile.interests.length > 0
              ? profile.interests
              : ["Coding", "Gaming", "Campus Life", "Night Walks", "Music"]
            ).map((item: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container neo-inset text-on-surface border border-outline-variant/40"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Activity Highlights */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-surface-container-low p-3 rounded-xl text-center border border-outline-variant/40">
            <span className="block text-lg font-bold text-primary flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4" /> {profile?.storiesCount || 1}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Stories</span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl text-center border border-outline-variant/40">
            <span className="block text-lg font-bold text-rose-500 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 fill-rose-500" /> {profile?.likesReceived || 0}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Likes</span>
          </div>
        </div>

        {/* Anonymity Note */}
        <p className="text-[10px] text-center text-on-surface-variant/70 italic">
          🔒 Real name and private credentials are kept confidential.
        </p>
      </div>
    </div>
  );
}
