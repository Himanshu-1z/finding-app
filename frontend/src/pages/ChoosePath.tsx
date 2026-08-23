import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe, Lock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { confessionService } from "../services/apiClient";

export function ChoosePath() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAppStore();
  const user = state.user;
  const targetPerson = location.state?.personName || "recipient";
  const targetCollege = location.state?.targetCollege || "";
  const targetSemester = location.state?.targetSemester || "";

  const [selectedPlan, setSelectedPlan] = useState<"public_private" | "private_only">("public_private");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeliver = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let createdId = crypto.randomUUID();
    try {
      const res = await confessionService.createConfession(
        "A story whisper meant for " + targetPerson,
        selectedPlan === "public_private" ? 1 : 2,
        targetPerson
      );
      if (res?.id) createdId = res.id;
    } catch (err: any) {
      console.warn("Backend Confession creation call:", err);
    }

    dispatch({
      type: "ADD_CONFESSION",
      confession: {
        id: createdId,
        author: user?.secretName || ("Anon-" + Math.floor(Math.random() * 9000 + 1000)),
        time: "Just now",
        content: "A story whisper meant for " + targetPerson,
        likes: 0,
        likedByMe: false,
        isRequested: false,
        type: selectedPlan === "public_private" ? "public" : "tagged",
        targetPerson: targetPerson,
        targetCollege: targetCollege,
        targetSemester: targetSemester,
        authorCollege: user?.college || "",
        isMine: true
      }
    });
    setIsSubmitting(false);
    setIsSuccess(true);
  };



  const handleFinishSuccess = () => {
    setIsSuccess(false);
    navigate("/feed");
  };

  return (
    <div className="w-full max-w-md mx-auto py-2 px-2 flex flex-col items-center relative min-h-screen">
      {/* Header Bar */}
      <header className="bg-surface/80 backdrop-blur-xl sticky top-0 w-full z-30 shadow-sm rounded-t-3xl">
        <div className="flex justify-between items-center px-4 py-3 w-full h-[64px]">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface neo-outset active:scale-95 transition-all text-primary hover:bg-surface-container cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-primary text-center flex-1">
            Choose Delivery Mode
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 flex flex-col items-center justify-start w-full gap-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-on-surface-variant max-w-[300px] mx-auto">
            Select how you'd like to deliver your story to <span className="font-bold text-primary">{targetPerson}</span>.
          </p>
        </div>

        {/* Delivery Options Stack */}
        <div className="flex flex-col gap-5 w-full">
          {/* Option 1: Public & Private */}
          <label 
            onClick={() => setSelectedPlan("public_private")}
            className="relative cursor-pointer group block"
          >
            <input
              type="radio"
              name="delivery_path"
              value="public_private"
              checked={selectedPlan === "public_private"}
              onChange={() => setSelectedPlan("public_private")}
              className="sr-only"
            />
            <div className={`w-full bg-surface rounded-2xl p-6 transition-all duration-300 flex flex-col gap-3 relative ${
              selectedPlan === "public_private" 
                ? "bg-surface-container-low neo-inset" 
                : "neo-outset"
            }`}>
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center neo-inset text-primary">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Public &amp; Private</h2>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full uppercase tracking-wider">
                    Free
                  </span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Share your story with the world on the global feed, and send a direct whisper to someone special's inbox.
              </p>

              {/* Selection Check Circle */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-primary bg-surface flex items-center justify-center transition-opacity duration-200 ${
                selectedPlan === "public_private" ? "opacity-100" : "opacity-0"
              }`}>
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              </div>
            </div>
          </label>

          {/* Option 2: Private Only */}
          <label 
            onClick={() => setSelectedPlan("private_only")}
            className="relative cursor-pointer group block"
          >
            <input
              type="radio"
              name="delivery_path"
              value="private_only"
              checked={selectedPlan === "private_only"}
              onChange={() => setSelectedPlan("private_only")}
              className="sr-only"
            />
            <div className={`w-full bg-surface rounded-2xl p-6 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${
              selectedPlan === "private_only" 
                ? "bg-surface-container-low neo-inset" 
                : "neo-outset"
            }`}>
              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center neo-inset text-primary">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Private Only</h2>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full uppercase tracking-wider">
                    Free
                  </span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed relative z-10">
                The ultimate discretion. Send a direct message to their inbox silently, without creating a public post on the feed.
              </p>

              {/* Selection Check Circle */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-primary bg-surface flex items-center justify-center transition-opacity duration-200 z-10 ${
                selectedPlan === "private_only" ? "opacity-100" : "opacity-0"
              }`}>
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              </div>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            type="button"
            onClick={handleDeliver}
            disabled={isSubmitting}
            className={`w-full h-14 bg-primary text-on-primary font-bold text-base rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer neo-outset ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Delivering Story...
              </>
            ) : (
              <>
                Deliver Story
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>


          <div className="flex items-center justify-center gap-1.5 text-on-surface-variant opacity-75">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold tracking-wider uppercase">100% ANONYMOUS &amp; SECURE DELIVERY</span>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-[150] bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-surface-container/90 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full text-center animate-fade-in border border-outline-variant shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-on-primary-container" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Story Delivered!</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Your story has been dispatched to <span className="font-bold text-on-surface">{targetPerson}</span> via <span className="font-bold text-primary">{selectedPlan === "public_private" ? "Public & Private" : "Private Only"}</span> mode.
            </p>
            <button
              type="button"
              onClick={handleFinishSuccess}
              className="w-full neo-outset bg-primary text-on-primary rounded-full py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
            >
              Back to Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

