import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { useAppStore, useUser } from "../store/AppContext";
import { generateAiAnonymousNames } from "../utils/aiNameGenerator";

export function SetupStep1() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const user = useUser();
  const [secretName, setSecretName] = useState(user?.secretName || "");
  const [gender, setGender] = useState<"male" | "female" | "">(user?.gender || "male");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const refreshAiNames = (g: string = gender) => {
    const names = generateAiAnonymousNames({ gender: g, semester: user?.semester || "1", branch: user?.branch || "CS" }, 6);
    setAiSuggestions(names);
  };

  useEffect(() => {
    refreshAiNames(gender || "male");
  }, [gender]);

  const handleContinue = () => {
    if (!secretName.trim()) {
      setErrorMessage("Please enter or pick an AI suggested story name.");
      return;
    }
    if (!gender) {
      setErrorMessage("Please select your gender to continue.");
      return;
    }
    setErrorMessage("");
    dispatch({ type: "SET_USER_FIELD", field: "secretName", value: secretName.trim() });
    dispatch({ type: "SET_USER_FIELD", field: "gender", value: gender });
    navigate("/setup/2");
  };

  return (
    <div className="w-full max-w-md mx-auto pt-8 px-6 pb-24 min-h-screen">
      <header className="flex justify-between items-center w-full z-50 py-2 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="neo-button p-2 rounded-full text-primary flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95 bg-surface cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-primary tracking-tighter">Smart ID Setup</h1>
        <div className="w-10"></div>
      </header>

      <div className="mb-10">
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          <span>Step 1 of 3</span>
          <span>33%</span>
        </div>
        <div className="h-2 w-full rounded-full neo-inset overflow-hidden bg-surface-container">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: "33.33%" }}
          ></div>
        </div>
      </div>

      <section className="flex flex-col gap-6 animate-fade-in">
        <div className="text-center mb-2">
          <h2 className="text-4xl font-bold text-primary mb-2 tracking-tighter">Who are you?</h2>
          <p className="text-base text-on-surface-variant">Create your anonymous id.</p>
        </div>

        <div className="neo-inset rounded-2xl p-4 bg-surface flex flex-col gap-2">
          <div className="flex items-center justify-between ml-2">
            <label className="text-xs font-bold uppercase tracking-widest text-tertiary">
              Anonymous Secret Name <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-primary/80 font-semibold bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Public Name
            </span>
          </div>
          <input
            type="text"
            value={secretName}
            onChange={(e) => {
              setSecretName(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            className="bg-transparent border-none focus:ring-0 text-base font-bold text-on-surface w-full p-2 placeholder:text-outline-variant outline-none"
            placeholder="e.g. CyberKnight, VelvetMuse"
            required
          />
        </div>

        {/* AI Suggested Names */}
        <div className="flex flex-col gap-2 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant px-1">
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              AI Suggested Anonymous Names
            </span>
            <button
              type="button"
              onClick={() => refreshAiNames()}
              className="text-[11px] text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Shuffle
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {aiSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSecretName(name);
                  if (errorMessage) setErrorMessage("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  secretName === name
                    ? "bg-primary text-on-primary shadow-sm scale-105"
                    : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/50 active:scale-95"
                }`}
              >
                ✨ {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-tertiary ml-2">
            Select Gender <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setGender("male");
                if (errorMessage) setErrorMessage("");
              }}
              className={`rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                gender === "male"
                  ? "neo-inset bg-surface-container border-2 border-primary text-primary shadow-sm"
                  : "neo-button bg-surface text-on-surface-variant hover:text-primary"
              }`}
            >
              {/* Male Avatar Illustration */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 ${
                gender === "male" ? "bg-primary-container text-on-primary-container scale-105" : "bg-surface-container-high text-primary/70"
              }`}>
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Male icon silhouette / avatar */}
                  <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
                  <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.2" className="hidden" />
                </svg>
              </div>
              <div className="text-center">
                <span className="block text-base font-bold">Male</span>
                <span className="text-xs opacity-75">Boy / Man</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setGender("female");
                if (errorMessage) setErrorMessage("");
              }}
              className={`rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                gender === "female"
                  ? "neo-inset bg-surface-container border-2 border-primary text-primary shadow-sm"
                  : "neo-button bg-surface text-on-surface-variant hover:text-primary"
              }`}
            >
              {/* Female Avatar Illustration */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 ${
                gender === "female" ? "bg-primary-container text-on-primary-container scale-105" : "bg-surface-container-high text-primary/70"
              }`}>
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Female icon silhouette / avatar */}
                  <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                  <path d="M12 15a2 2 0 0 0 2-2" strokeDasharray="1 1" />
                </svg>
              </div>
              <div className="text-center">
                <span className="block text-base font-bold">Female</span>
                <span className="text-xs opacity-75">Girl / Woman</span>
              </div>
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs font-bold text-red-500 text-center animate-fade-in bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {errorMessage}
          </p>
        )}
      </section>

      <div className="fixed bottom-0 left-0 w-full p-6 flex justify-center z-50 bg-gradient-to-t from-background via-background to-transparent pb-8">
        <button
          onClick={handleContinue}
          className="neo-button w-full max-w-md bg-primary text-on-primary rounded-full py-4 text-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          Continue
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
