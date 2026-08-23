import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown, Phone, Mail, Eye, EyeOff, Sparkles, Check, Send, ShieldCheck, KeyRound, RefreshCw, UserCheck } from "lucide-react";
import { useAppStore, useUser } from "../store/AppContext";
import { authService, apiFetch } from "../services/apiClient";
import { CAMPUS_INTERESTS, getRandomMemeCat } from "../utils/memeCats";
import { generateAiAnonymousNames } from "../utils/aiNameGenerator";

export function SetupStep2() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const user = useUser();
  const [secretName, setSecretName] = useState(user?.secretName || "");
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [semester, setSemester] = useState(user?.semester || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [section, setSection] = useState(user?.section || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState(user?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [errorMessage, setErrorMessage] = useState("");

  // Email Verification OTP State
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState<string>("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address first.");
      return;
    }
    setOtpLoading(true);
    setErrorMessage("");
    setOtpNotice("");
    try {
      const res = await apiFetch("/auth/send-email-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setOtpSent(true);
      setResendCooldown(60);
      setEmailOtp(""); // User enters the OTP received in their Gmail
      setOtpNotice(res.message || "Verification code sent to your email. Please check your inbox / spam folder.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp.trim() || emailOtp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP code received on your email.");
      return;
    }
    setOtpLoading(true);
    setErrorMessage("");
    try {
      await apiFetch("/auth/verify-email-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), otp: emailOtp.trim() }),
      });
      setIsEmailVerified(true);
      setOtpNotice("");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const toggleInterest = (interestName: string) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interestName));
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
    if (errorMessage) setErrorMessage("");
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!college) {
      setErrorMessage("Please select your college.");
      return;
    }
    if (!semester) {
      setErrorMessage("Please select your semester.");
      return;
    }
    if (!branch) {
      setErrorMessage("Please select your branch.");
      return;
    }
    if (!section) {
      setErrorMessage("Please select your section.");
      return;
    }
    if (!mobile.trim() || mobile.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your email ID.");
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage("Please click 'Send OTP' and verify your email with the 6-digit code before continuing.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter a password.");
      return;
    }
    if (selectedInterests.length < 5) {
      setErrorMessage(`Please choose at least 5 interests for your profile (Selected: ${selectedInterests.length}/5).`);
      return;
    }
    const finalSecretName = secretName.trim() || user?.secretName || `Anon_${Date.now().toString(36)}`;
    dispatch({ type: "SET_USER_FIELD", field: "secretName", value: finalSecretName });
    dispatch({ type: "SET_USER_FIELD", field: "name", value: name.trim() });
    dispatch({ type: "SET_USER_FIELD", field: "college", value: college });
    dispatch({ type: "SET_USER_FIELD", field: "semester", value: semester });
    dispatch({ type: "SET_USER_FIELD", field: "branch", value: branch });
    dispatch({ type: "SET_USER_FIELD", field: "section", value: section });
    dispatch({ type: "SET_USER_FIELD", field: "mobile", value: mobile.trim() });
    dispatch({ type: "SET_USER_FIELD", field: "email", value: email.trim() });
    dispatch({ type: "SET_USER_FIELD", field: "password", value: password });
    dispatch({ type: "SET_USER_FIELD", field: "interests", value: selectedInterests });
    if (!user?.avatarMemeGif) {
      dispatch({ type: "SET_USER_FIELD", field: "avatarMemeGif", value: getRandomMemeCat() });
    }

    try {
      const payload = {
        mysteryName: finalSecretName,
        email: email.trim(),
        password: password,
        gender: user?.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : "Male",
        dateOfBirth: user?.dob || "2002-01-15",
        realName: name.trim(),
        college: college,
        yearSemester: semester,
        branch: branch,
        mobileNumber: mobile.trim(),
        capturedIdImage: null
      };
      await authService.register(payload);
    } catch (err: any) {
      setErrorMessage(err.message || "An account with this email or mobile number already exists. Please sign in instead.");
      return;
    }

    navigate("/setup/3");
  };


  return (
    <div className="w-full max-w-md mx-auto pt-8 px-6 pb-24 min-h-screen flex flex-col">
      <header className="flex items-center justify-between py-2 mb-4 sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center neo-button text-primary bg-surface"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-primary tracking-tighter">Smart ID Setup</h1>
        <div className="w-10"></div>
      </header>

      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Step 2 of 3</span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">66%</span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full neo-inset overflow-hidden relative">
          <div
            className="h-full bg-primary rounded-full absolute left-0 top-0 transition-all duration-500 shadow-md w-[66%]"
          ></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col gap-6 overflow-y-auto">
        <div className="neo-outset bg-surface rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden">
          {/* 1. Name */}
          <div className="flex flex-col gap-2 relative z-10">
            <div className="flex justify-between items-center pl-2">
              <label className="text-sm text-on-surface-variant font-semibold">
                Real Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-primary/90 font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                🔒 Private (Only visible to you)
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              className="w-full h-14 px-4 rounded-xl neo-inset text-base text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent"
              placeholder="e.g. Himanshu Sharma"
              required
            />
          </div>

          {/* 1.5. College */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              College <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <select
                value={college}
                onChange={(e) => {
                  setCollege(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full px-4 appearance-none rounded-xl neo-inset text-base text-on-surface bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12 cursor-pointer"
                required
              >
                <option value="" disabled className="text-outline-variant">
                  Select your college
                </option>
                <option value="Arya (OLD), kukas">Arya (OLD), kukas</option>
                <option value="Arya (MAIN), kukas">Arya (MAIN), kukas</option>
                <option value="JEC, kukas">JEC, kukas</option>
                <option value="Shankara, kukas">Shankara, kukas</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 2. Semester */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full px-4 appearance-none rounded-xl neo-inset text-base text-on-surface bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12 cursor-pointer"
                required
              >
                <option value="" disabled className="text-outline-variant">
                  Select your semester
                </option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            {semester === "1" && (
              <p className="text-xs text-primary/80 pl-2 font-medium animate-fade-in">
                Note: Semester 1 students skip Step 3 ID verification
              </p>
            )}
          </div>

          {/* 3. Branch Selection */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              Branch <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full px-4 appearance-none rounded-xl neo-inset text-base text-on-surface bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12 cursor-pointer"
                required
              >
                <option value="" disabled className="text-outline-variant">
                  Select your branch
                </option>
                <option value="CS">CS</option>
                <option value="IT">IT</option>
                <option value="AI & DS">AI & DS</option>
                <option value="Elec & Co. E">Elec & Co. E</option>
                <option value="E.E">E.E</option>
                <option value="M.E">M.E</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 4. Section Selection */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              Section <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full px-4 appearance-none rounded-xl neo-inset text-base text-on-surface bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12 cursor-pointer"
                required
              >
                <option value="" disabled className="text-outline-variant">
                  Select your section
                </option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="E">Section E</option>
                <option value="F">Section F</option>
                <option value="G">Section G</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 5. Mobile Number */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full pl-14 pr-4 rounded-xl neo-inset text-base text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent"
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>

          {/* 6. Email ID with Live OTP Verification */}
          <div className="flex flex-col gap-2 relative z-10 pb-2">
            <div className="flex justify-between items-center pl-2">
              <label className="text-sm text-on-surface-variant font-semibold">
                Email ID <span className="text-red-500">*</span>
              </label>
              {isEmailVerified ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Email Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || resendCooldown > 0}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              )}
            </div>
            <div className="relative w-full h-14">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low/50 shadow-inner">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                  setOtpSent(false);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full pl-14 pr-4 rounded-xl neo-inset text-base text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent"
                placeholder="e.g. name@example.com"
                required
              />
            </div>

            {/* Inline Email Error / Account Exists Notice */}
            {errorMessage && errorMessage.includes("already exists") && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-600 font-semibold animate-fade-in mt-1">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="px-3 py-1 bg-primary text-on-primary rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* OTP Code Entry Row */}
            {otpSent && !isEmailVerified && (
              <div className="p-3 bg-surface-container-low rounded-2xl border border-primary/20 space-y-2 animate-fade-in mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary" /> Enter 6-digit OTP from your email
                  </span>
                </div>
                {otpNotice && (
                  <p className="text-[11px] text-primary/90 font-medium">
                    {otpNotice}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 h-11 px-3 rounded-xl neo-inset text-center tracking-widest font-mono text-base font-bold bg-transparent text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || emailOtp.length !== 6}
                    className="px-4 h-11 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 7. Password */}
          <div className="flex flex-col gap-2 relative z-10 pb-2">
            <label className="text-sm text-on-surface-variant font-semibold pl-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-14">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="w-full h-full px-4 rounded-xl neo-inset text-base text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent pr-12"
                placeholder="Create a secure password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 8. Compulsory Campus Interests (Choose 5) */}
          <div className="flex flex-col gap-3 relative z-10 pt-2 border-t border-outline-variant/30">
            <div className="flex justify-between items-center pl-2">
              <div>
                <label className="text-sm text-on-surface-variant font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Campus Interests <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-on-surface-variant/80">Choose exactly 5 interests to display on your profile</p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                  selectedInterests.length >= 5
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shadow-xs"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                {selectedInterests.length >= 5 ? `✓ ${selectedInterests.length}/5 Selected` : `${selectedInterests.length}/5 Required`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 neo-inset rounded-2xl bg-surface/50">
              {CAMPUS_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.name);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-primary text-on-primary shadow-sm scale-[0.98]"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40"
                    }`}
                  >
                    <span className="text-base">{interest.emoji}</span>
                    <span className="flex-1 truncate">{interest.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9. AI Analyzed Anonymous Identity */}
          <div className="flex flex-col gap-2.5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 relative z-10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                AI Analyzed Anonymous Identity
              </label>
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                Public Campus Name
              </span>
            </div>
            
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Generated by AI by analyzing your <span className="font-semibold text-primary">{branch || "Branch"}</span>, <span className="font-semibold text-primary">{semester ? `Sem ${semester}` : "Semester"}</span>, and {selectedInterests.length} selected interests:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {generateAiAnonymousNames({
                gender: user?.gender || "male",
                semester: semester || "1",
                branch: branch || "CS",
                interests: selectedInterests
              }, 6).map((aiName) => (
                <button
                  key={aiName}
                  type="button"
                  onClick={() => {
                    setSecretName(aiName);
                    if (errorMessage) setErrorMessage("");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    (secretName || user?.secretName) === aiName
                      ? "bg-primary text-on-primary shadow-sm scale-105"
                      : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/50 active:scale-95"
                  }`}
                >
                  ✨ {aiName}
                </button>
              ))}
            </div>

            <div className="mt-1 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant font-medium">Selected Public Name:</span>
              <span className="font-bold text-primary text-sm">@{secretName || user?.secretName || "AnonUser"}</span>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs font-bold text-red-500 text-center animate-fade-in bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
              {errorMessage}
            </p>
          )}
        </div>
      </main>

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
