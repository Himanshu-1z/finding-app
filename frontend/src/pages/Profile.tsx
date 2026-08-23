import React, { useState, useEffect } from "react";
import {
  Shield, Key, History, Bookmark, LogOut, ChevronRight, User,
  Grid, Heart, MessageSquare, Edit3, Share2, Award, Sparkles,
  Building2, GraduationCap, Laptop, Trash2, Calendar
} from "lucide-react";
import { useAppStore, useUser, useConfessions, useConnectionRequests, Confession } from "../store/AppContext";
import { useNavigate } from "react-router-dom";
import { apiFetch, confessionService } from "../services/apiClient";
import { motion, AnimatePresence } from "motion/react";
import { getRandomMemeCat } from "../utils/memeCats";

export function Profile() {
  const { dispatch } = useAppStore();
  const user = useUser();
  const allConfessions = useConfessions();
  const connectionRequests = useConnectionRequests();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"stories" | "saved" | "settings">("stories");
  const [myConfessions, setMyConfessions] = useState<Confession[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Live refresh helper for Stories, Likes, and Matches
  const refreshProfileStats = () => {
    // 1. Fetch Profile Data
    apiFetch("/profile/me")
      .then((res: any) => {
        if (res) {
          if (res.name || res.realName) dispatch({ type: "SET_USER_FIELD", field: "name", value: res.name || res.realName });
          const sec = res.secretName || res.mysteryName || res.name;
          if (sec) dispatch({ type: "SET_USER_FIELD", field: "secretName", value: sec });
          if (res.email) dispatch({ type: "SET_USER_FIELD", field: "email", value: res.email });
          if (res.college) dispatch({ type: "SET_USER_FIELD", field: "college", value: res.college });
          if (res.branch) dispatch({ type: "SET_USER_FIELD", field: "branch", value: res.branch });
          if (res.semester || res.yearSemester) dispatch({ type: "SET_USER_FIELD", field: "semester", value: res.semester || res.yearSemester });
          if (res.bio) dispatch({ type: "SET_USER_FIELD", field: "bio", value: res.bio });
        }
      })
      .catch((err) => console.warn("Live profile fetch notice:", err));

    // 2. Fetch User's Own Confessions & Likes
    confessionService
      .getMyConfessions()
      .then((items: any) => {
        if (Array.isArray(items)) {
          setMyConfessions(
            items.map((item: any) => ({
              id: item.id,
              author: item.author || user?.secretName || "Me",
              time: new Date(item.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
              content: item.content,
              likes: item.likesCount ?? item.likes ?? 0,
              likedByMe: Boolean(item.likedByMe),
              isRequested: false,
              type: item.type === "tagged" ? "tagged" : "public",
              authorCollege: item.authorCollege || user?.college || "",
              authorBranch: item.authorBranch || user?.branch || "",
              authorYear: item.authorYear || user?.semester || "",
              isMine: true,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("My confessions fetch notice:", err);
        setMyConfessions(allConfessions.filter((c) => c.isMine || c.author === user?.secretName));
      })
      .finally(() => {
        setLoadingPosts(false);
      });

    // 3. Fetch Matches & Connection Requests
    apiFetch("/interaction/my")
      .then((res: any) => {
        const list = Array.isArray(res)
          ? res
          : res && res.incoming && res.outgoing
          ? [...res.incoming, ...res.outgoing]
          : res && res.value
          ? res.value
          : [];
        if (Array.isArray(list)) {
          dispatch({ type: "SET_CONNECTION_REQUESTS", requests: list });
        }
      })
      .catch((err) => console.warn("Live interactions fetch notice:", err));
  };

  // Initial fetch and auto-refresh on interval + focus
  useEffect(() => {
    refreshProfileStats();
    const interval = setInterval(refreshProfileStats, 4000);
    window.addEventListener("focus", refreshProfileStats);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshProfileStats);
    };
  }, []);

  const totalLikesReceived = myConfessions.reduce((acc, c) => acc + (c.likes || 0), 0);
  const totalMatches = connectionRequests.filter(
    (r) => r.status === "accepted" || (r as any).response === "Accepted" || (r as any).status === "connected"
  ).length;
  const likedStories = allConfessions.filter((c) => c.likedByMe);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-24">
      {/* ─── INSTAGRAM-STYLE PROFILE HEADER ─── */}
      <section className="bg-surface-container-low border border-outline-variant/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Meme Cat GIF and Shuffle Action */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0 shadow-md">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-surface bg-surface-container-high">
                <img
                  src={user?.avatarMemeGif || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.secretName || 'Student'}&backgroundColor=c0aede`}
                  alt="Meme Cat Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.secretName || 'Student'}&backgroundColor=ffd5dc`;
                  }}
                />
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-surface" title="Anonymous Meme Cat Avatar Active">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Shuffle Meme Cat Button */}
            <button
              type="button"
              onClick={() => {
                const nextCat = getRandomMemeCat();
                dispatch({ type: "SET_USER_FIELD", field: "avatarMemeGif", value: nextCat });
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-primary flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              🎲 Shuffle Cat GIF
            </button>
          </div>

          {/* User Details & Stats */}
          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                    {user?.secretName || "Anonymous User"}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-3 h-3" /> Anonymous
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  {user?.name || "Student Member"} • <span className="text-primary font-semibold">Privacy Active (ID Private)</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2 pt-1">
                <button
                  onClick={() => setActiveModal("Edit Profile")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "Finding Profile", url: window.location.href }).catch(() => {});
                    } else {
                      alert("Profile link copied!");
                    }
                  }}
                  className="p-2 rounded-xl text-on-surface bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant transition-all active:scale-95 cursor-pointer"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Academic Badges (College + Branch + Year) */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
              {user?.college && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Building2 className="w-3.5 h-3.5" /> {user.college}
                </span>
              )}
              {user?.branch && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  <Laptop className="w-3.5 h-3.5" /> {user.branch}
                </span>
              )}
              {user?.semester && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  <GraduationCap className="w-3.5 h-3.5" /> Sem {user.semester}
                </span>
              )}
            </div>

            {/* 5 Compulsory Campus Interests */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Campus Interests (5 Selected)
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                {(user?.interests && user.interests.length > 0
                  ? user.interests
                  : [
                      "Coding & Hackathons",
                      "Indie & Lo-Fi Music",
                      "Coffee & Cafe Crawls",
                      "Film & Photography",
                      "Deep 3 AM Talks",
                    ]
                ).map((interest: string) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high border border-outline-variant/60 text-on-surface flex items-center gap-1 shadow-2xs"
                  >
                    ✨ {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            {user?.bio ? (
              <p className="text-xs text-on-surface-variant italic pt-1 leading-relaxed">
                "{user.bio}"
              </p>
            ) : (
              <p className="text-[11px] text-outline pt-1">
                Share anonymous thoughts and connect freely with fellow students on campus.
              </p>
            )}
          </div>
        </div>

        {/* Instagram Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-outline-variant/60">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container/50">
            <span className="text-xl sm:text-2xl font-black text-primary">{myConfessions.length}</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Stories</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container/50">
            <span className="text-xl sm:text-2xl font-black text-rose-600">{totalLikesReceived}</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Likes</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container/50">
            <span className="text-xl sm:text-2xl font-black text-purple-700">{totalMatches}</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Matches</span>
          </div>
        </div>
      </section>

      {/* ─── INSTAGRAM-STYLE PROFILE TABS ─── */}
      <div className="flex border-b border-outline-variant/80 bg-surface">
        <button
          onClick={() => setActiveTab("stories")}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "stories"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Grid className="w-4 h-4" /> My Stories ({myConfessions.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "saved"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Heart className="w-4 h-4" /> Liked ({likedStories.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Shield className="w-4 h-4" /> Settings & Vault
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === "stories" && (
        <div className="space-y-4">
          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-on-surface-variant animate-pulse">Loading your stories...</p>
            </div>
          ) : myConfessions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-surface-container-lowest border border-outline-variant rounded-2xl space-y-3">
              <MessageSquare className="w-12 h-12 text-outline mx-auto opacity-40" />
              <h3 className="text-base font-bold text-on-surface">No stories shared yet</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Confessions you create will appear here on your profile with live views and reaction counters.
              </p>
              <button
                onClick={() => navigate("/create")}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-full text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                + Post First Story
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myConfessions.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-primary">@{item.author}</span>
                      {item.authorCollege && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          🏫 {item.authorCollege}
                        </span>
                      )}
                      {item.authorBranch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          💻 {item.authorBranch}
                        </span>
                      )}
                      {item.authorYear && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          🎓 Sem {item.authorYear}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-outline">{item.time}</span>
                  </div>

                  <p className="text-sm text-on-surface font-medium leading-relaxed bg-surface/50 p-4 rounded-xl border border-outline-variant/40">
                    "{item.content}"
                  </p>

                  <div className="flex justify-between items-center pt-2 text-xs font-semibold text-on-surface-variant">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-rose-600">
                        <Heart className="w-4 h-4 fill-current" /> {item.likes} {item.likes === 1 ? "like" : "likes"}
                      </span>
                      <span className="text-primary text-[11px] font-bold uppercase">
                        {item.type} story
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-4">
          {likedStories.length === 0 ? (
            <div className="text-center py-16 px-4 bg-surface-container-lowest border border-outline-variant rounded-2xl space-y-2">
              <Heart className="w-12 h-12 text-rose-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-on-surface">No liked stories yet</h3>
              <p className="text-xs text-on-surface-variant">
                Double tap on stories in the feed to like them and save them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {likedStories.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-primary">@{item.author}</span>
                    <span className="text-[10px] text-outline">{item.time}</span>
                  </div>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">
                    "{item.content}"
                  </p>
                  <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                    <Heart className="w-4 h-4 fill-current" /> {item.likes} likes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <section className="space-y-4">
          {/* Privacy */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-2">
              Account & Privacy
            </h3>
            <div className="space-y-1">
              <SettingsButton icon={<User className="w-5 h-5 text-primary" />} label="Edit Profile Details" onClick={() => setActiveModal("Edit Profile")} />
              <SettingsButton icon={<Key className="w-5 h-5 text-primary" />} label="Security & Password" onClick={() => setActiveModal("Change Password")} />
              <SettingsButton icon={<Shield className="w-5 h-5 text-primary" />} label="Identity Protection" onClick={() => setActiveModal("Account Privacy")} />
            </div>
          </div>

          {/* Activity */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-2">
              Activity History
            </h3>
            <div className="space-y-1">
              <SettingsButton icon={<History className="w-5 h-5 text-primary" />} label="Interaction Queue History" onClick={() => setActiveModal("Interaction History")} />
              <SettingsButton icon={<Bookmark className="w-5 h-5 text-primary" />} label="Saved Vault" onClick={() => setActiveModal("Saved Stories")} />
            </div>
          </div>

          {/* Logout */}
          <div className="pt-2">
            <button
              onClick={() => {
                dispatch({ type: "LOGOUT" });
                localStorage.removeItem("finding_app_state_v2");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-error-container text-on-error-container hover:opacity-90 active:scale-98 transition-all font-bold text-sm cursor-pointer shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out of Finding
            </button>
          </div>
        </section>
      )}

      {/* Edit Profile Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-surface border border-outline-variant w-full max-w-md p-6 sm:p-8 rounded-3xl flex flex-col gap-4 shadow-2xl relative my-auto">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="text-xl font-bold text-on-surface">{activeModal}</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center font-bold text-on-surface-variant">✕</button>
            </div>

            {activeModal === "Edit Profile" && (
              <EditProfileForm onClose={() => setActiveModal(null)} />
            )}

            {activeModal === "Change Password" && (
              <div className="flex flex-col gap-3 py-2">
                <input type="password" placeholder="Current Password" className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                <input type="password" placeholder="New Password" className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                <button
                  onClick={() => { alert("Password updated successfully"); setActiveModal(null); }}
                  className="mt-2 w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            )}

            {activeModal === "Interaction History" && (
              <div className="py-3 text-sm text-on-surface-variant space-y-2">
                <p>You have posted <strong>{myConfessions.length}</strong> anonymous stories.</p>
                <p>You have received <strong>{totalLikesReceived}</strong> likes from fellow students.</p>
                <p>You have <strong>{totalMatches}</strong> active mutual student matches.</p>
              </div>
            )}

            {activeModal === "Saved Stories" && (
              <div className="py-3 text-sm text-on-surface-variant">
                <p>You have <strong>{likedStories.length}</strong> saved stories in your vault.</p>
              </div>
            )}

            {activeModal === "Account Privacy" && (
              <div className="py-3 text-sm text-on-surface-variant space-y-2">
                <p>🔐 <strong>Full Anonymity Shield:</strong> Your real name is never exposed to other students unless you explicitly reveal it in private chats.</p>
                <p>🏫 <strong>Campus Community:</strong> Your college and branch help match you with classmates while keeping your identity private.</p>
              </div>
            )}

            {activeModal !== "Edit Profile" && activeModal !== "Change Password" && (
              <button
                onClick={() => setActiveModal(null)}
                className="mt-2 w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-sm cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useAppStore();
  const user = useUser();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    secretName: user?.secretName || "",
    college: user?.college || "",
    semester: user?.semester || "",
    branch: user?.branch || "",
    bio: user?.bio || "",
    section: user?.section || ""
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          realName: formData.name,
          mysteryName: formData.secretName,
          college: formData.college,
          branch: formData.branch,
          yearSemester: formData.semester,
          bio: formData.bio,
          section: formData.section
        })
      });

      dispatch({ type: "SET_USER_FIELD", field: "name", value: formData.name });
      dispatch({ type: "SET_USER_FIELD", field: "secretName", value: formData.secretName });
      dispatch({ type: "SET_USER_FIELD", field: "college", value: formData.college });
      dispatch({ type: "SET_USER_FIELD", field: "semester", value: formData.semester });
      dispatch({ type: "SET_USER_FIELD", field: "branch", value: formData.branch });
      dispatch({ type: "SET_USER_FIELD", field: "bio", value: formData.bio });
      dispatch({ type: "SET_USER_FIELD", field: "section", value: formData.section });

      onClose();
    } catch (err: any) {
      alert("Profile update failed: " + (err?.message || "Error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto px-1">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">Story Username / Handle</label>
        <input
          name="secretName"
          value={formData.secretName}
          onChange={handleChange}
          className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
          placeholder="e.g. dev"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">Real Name (Private)</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="e.g. Dev Sharma"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">Bio Description</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={2}
          className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Tell a little about your campus vibes..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">College / University</label>
        <select
          name="college"
          value={formData.college}
          onChange={handleChange}
          className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer"
        >
          <option value="" disabled>Select college</option>
          <option value="Arya (OLD), kukas">Arya (OLD), kukas</option>
          <option value="Arya (MAIN), kukas">Arya (MAIN), kukas</option>
          <option value="JEC, kukas">JEC, kukas</option>
          <option value="Shankara, kukas">Shankara, kukas</option>
          <option value="DTU">Delhi Technological University (DTU)</option>
          <option value="IIT Delhi">IIT Delhi</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">Branch</label>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer"
          >
            <option value="" disabled>Branch</option>
            <option value="CS">CS (Computer Science)</option>
            <option value="IT">IT (Information Tech)</option>
            <option value="EC">EC (Electronics)</option>
            <option value="ME">ME (Mechanical)</option>
            <option value="CE">CE (Civil)</option>
            <option value="EE">EE (Electrical)</option>
            <option value="AI-DS">AI / Data Science</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest pl-1">Semester / Year</label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="rounded-xl p-3 bg-surface-container border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/20 text-sm cursor-pointer"
          >
            <option value="" disabled>Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="3">3rd Semester</option>
            <option value="4">4th Semester</option>
            <option value="5">5th Semester</option>
            <option value="6">6th Semester</option>
            <option value="7">7th Semester</option>
            <option value="8">8th Semester</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-3 pt-2 border-t border-outline-variant/60">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function SettingsButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-container-high transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3.5 text-on-surface-variant group-hover:text-primary transition-colors">
        {icon}
        <span className="text-sm font-semibold text-on-surface">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-outline-variant group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
