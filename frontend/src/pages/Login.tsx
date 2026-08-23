import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { authService } from "../services/apiClient";

export function Login() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await authService.login(email.trim(), password.trim());
      if (res && res.accessToken) {
        const u = res.user || {};
        dispatch({
          type: "LOGIN_SUCCESS",
          user: {
            email: u.email || email.trim(),
            secretName: u.secretName || u.mysteryName || u.name || "Anonymous",
            gender: u.gender?.toLowerCase() === "female" ? "female" : "male",
            name: u.realName || u.name || "",
            college: u.college || "",
            semester: u.yearSemester || u.semester || "1",
            dob: u.dateOfBirth || u.dob || "",
            mobile: u.mobileNumber || u.mobile || "",
            avatarMemeGif: u.avatarMemeGif || u.avatarUrl,
            isSetupComplete: true
          }
        });
        navigate("/feed", { replace: true });
      } else {
        setErrorMessage(res?.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between pt-6 px-6 pb-12 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="liquid-blob-1 opacity-60"></div>
        <div className="liquid-blob-2 opacity-50"></div>
      </div>

      <div className="relative z-10 w-full">
        {/* Header navigation */}
        <header className="flex justify-between items-center w-full py-2 mb-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="neo-button p-2.5 rounded-full text-primary flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95 bg-surface cursor-pointer shadow-sm hover:text-primary"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Welcome Back</span>
          </div>
          <div className="w-10"></div>
        </header>

        {/* Title and tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-logo tracking-wide text-primary drop-shadow-sm mb-2">Finding</h1>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight mb-1">Sign In to Your Story</h2>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            Step back into the shadow realm. Your authentic stories await.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Input */}
          <div className="neo-inset rounded-2xl p-4 bg-surface flex flex-col gap-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/40">
            <label className="text-xs font-bold uppercase tracking-widest text-tertiary ml-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Campus Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="e.g. yourname@college.edu"
              className="bg-transparent border-none focus:ring-0 text-base text-on-surface w-full p-1.5 placeholder:text-outline-variant outline-none font-medium"
              autoComplete="email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="neo-inset rounded-2xl p-4 bg-surface flex flex-col gap-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/40">
            <label className="text-xs font-bold uppercase tracking-widest text-tertiary ml-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </label>
            <div className="flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Enter your password"
                className="bg-transparent border-none focus:ring-0 text-base text-on-surface w-full p-1.5 placeholder:text-outline-variant outline-none font-medium"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-on-surface-variant hover:text-primary p-2 cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-outline-variant" />}
              </button>
            </div>
          </div>

          {/* Error message alert */}
          {errorMessage && (
            <div className="text-xs font-bold text-red-500 text-center animate-fade-in bg-red-500/10 py-3 px-4 rounded-2xl border border-red-500/20">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="neo-button w-full bg-primary text-on-primary rounded-full py-4 text-lg font-semibold flex items-center justify-center gap-2.5 hover:opacity-95 active:scale-95 transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer navigation toggle */}
      <div className="relative z-10 text-center pt-8">
        <p className="text-sm text-on-surface-variant">
          Don't have an account yet?{" "}
          <Link
            to="/setup/1"
            className="text-primary font-bold hover:underline transition-colors ml-1 cursor-pointer"
          >
            Create an ID
          </Link>
        </p>
      </div>
    </div>
  );
}
