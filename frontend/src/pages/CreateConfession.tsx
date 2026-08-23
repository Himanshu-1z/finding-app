import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, AtSign, Send, Loader2 } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { confessionService } from "../services/apiClient";

export function CreateConfession() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const user = state.user;
  const [text, setText] = useState("");
  const [option, setOption] = useState<"public" | "tagged">("public");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // useRef guard: survives re-renders and is synchronous unlike setState
  const submittingRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePost = async () => {
    // Double-click / React StrictMode double-invoke guard
    if (submittingRef.current || isSubmitting) return;
    if (!text.trim()) {
      showToast("Please type a story first!");
      return;
    }

    if (option === "tagged") {
      navigate("/whom-to-confess");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await confessionService.createConfession(
        text.trim(),
        1,
        undefined,
        user?.college || "Arya (MAIN), kukas",
        user?.branch || "CS",
        user?.semester || "1",
        user?.secretName || user?.name || "Student",
        user?.name || ""
      );

      dispatch({
        type: "ADD_CONFESSION",
        confession: {
          id: res?.id || crypto.randomUUID(),
          author: res?.author || user?.secretName || ("Anon-" + Math.floor(Math.random() * 9000 + 1000)),
          time: "Just now",
          content: text.trim(),
          likes: 0,
          likedByMe: false,
          isRequested: false,
          type: "public",
          authorCollege: res?.authorCollege || user?.college || "Arya (MAIN), kukas",
          authorBranch: res?.authorBranch || user?.branch || "CS",
          authorYear: res?.authorYear || user?.semester || "1",
          isMine: true
        }
      });
      showToast("Story posted successfully!");
      setTimeout(() => {
        navigate("/feed");
      }, 800);
    } catch (err: any) {
      console.error("Backend Confession creation error:", err);
      showToast(err.message || "Failed to post story. Please try again.");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full max-w-xl mx-auto py-4 px-4 space-y-5 flex flex-col relative pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-primary text-on-primary px-6 py-3 rounded-full shadow-2xl text-sm font-bold animate-in fade-in zoom-in-95 flex items-center gap-2 border border-white/20">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full neo-button bg-surface text-primary active:scale-95 transition-all cursor-pointer shadow-2xs"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3.5 py-1 rounded-full border border-primary/20 text-xs font-bold">
          <span>🔒 100% Anonymous</span>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Create Story</h1>
        <p className="text-xs text-on-surface-variant">
          Posting as <span className="font-bold text-primary">@{user?.secretName || "Anonymous"}</span> • {user?.college || "Campus Community"}
        </p>
      </div>

      {/* Main Textarea Card */}
      <div className="relative w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          className="w-full h-56 bg-surface rounded-3xl neo-inset p-5 text-sm md:text-base text-on-surface resize-none focus:outline-none placeholder:text-outline-variant/60 transition-all border-none leading-relaxed"
          placeholder="Share your thoughts, campus confessions, questions, or secret stories..."
        />
        <div className="absolute bottom-4 right-5 text-[11px] font-bold text-on-surface-variant/70 bg-surface/80 px-2.5 py-0.5 rounded-full backdrop-blur-xs neo-outset border border-outline-variant/40">
          {text.length} / 500
        </div>
      </div>

      {/* Story Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
          Story Destination
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Public Story Option */}
          <button
            type="button"
            onClick={() => setOption("public")}
            className={`flex items-start gap-3 p-4 rounded-2xl transition-all text-left cursor-pointer border ${
              option === "public"
                ? "bg-surface border-primary ring-2 ring-primary/20 neo-outset shadow-sm"
                : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container"
            }`}
          >
            <div className={`p-2 rounded-xl ${option === "public" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-on-surface">Campus Feed</span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5">Visible to all students</span>
            </div>
          </button>

          {/* Tagged Story Option */}
          <button
            type="button"
            onClick={() => setOption("tagged")}
            className={`flex items-start gap-3 p-4 rounded-2xl transition-all text-left cursor-pointer border ${
              option === "tagged"
                ? "bg-surface border-primary ring-2 ring-primary/20 neo-outset shadow-sm"
                : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container"
            }`}
          >
            <div className={`p-2 rounded-xl ${option === "tagged" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
              <AtSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-on-surface">Tag Student</span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5">Directly notify someone</span>
            </div>
          </button>
        </div>
      </div>

      {/* Primary Submit CTA */}
      <button
        type="button"
        onClick={handlePost}
        disabled={isSubmitting}
        className={`w-full py-4 rounded-full text-base font-bold bg-primary text-on-primary shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
          isSubmitting ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Publishing to Campus...</span>
          </>
        ) : (
          <>
            <span>{option === "tagged" ? "Next: Choose Whom to Tag" : "Publish Anonymous Story"}</span>
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}


