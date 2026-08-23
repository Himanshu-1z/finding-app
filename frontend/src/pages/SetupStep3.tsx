import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Shield, CheckCircle2, RefreshCw } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { authService, apiFetch } from "../services/apiClient";
import { getRandomMemeCat } from "../utils/memeCats";

export function SetupStep3() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const [isScanning, setIsScanning] = useState(true);
  const [captured, setCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start device camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
        setIsScanning(true);
      } else {
        fileInputRef.current?.click();
      }
    } catch (err) {
      console.warn("Live camera stream access failed or permission denied, resorting to file input:", err);
      setCameraError("Camera access required. Opening file picker...");
      fileInputRef.current?.click();
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let yPos = 0;
    let direction = 1;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isScanning && !captured) {
        const gradient = ctx.createLinearGradient(0, yPos - 15, 0, yPos + 15);
        gradient.addColorStop(0, "rgba(99, 87, 68, 0)");
        gradient.addColorStop(0.5, "rgba(124, 111, 91, 0.8)");
        gradient.addColorStop(1, "rgba(99, 87, 68, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, yPos - 15, canvas.width, 30);

        ctx.fillStyle = "#7c6f5b";
        ctx.fillRect(0, yPos, canvas.width, 2);

        yPos += 2.5 * direction;
        if (yPos >= canvas.height || yPos <= 0) {
          direction *= -1;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, captured]);

  const handleShutterClick = () => {
    if (captured) {
      setCaptured(false);
      setCapturedImage(null);
      startCamera();
      return;
    }

    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = video.videoWidth || 640;
      captureCanvas.height = video.videoHeight || 480;
      const ctx = captureCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        const dataUrl = captureCanvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
        setCaptured(true);
        setIsScanning(false);
        setErrorMessage("");
        stopStream();
      }
    } else {
      startCamera();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setCaptured(true);
          setIsScanning(false);
          setErrorMessage("");
          stopStream();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!captured || !capturedImage) {
      setErrorMessage("Please capture or upload your ID photo to complete setup.");
      return;
    }
    setErrorMessage("");
    stopStream();
    dispatch({ type: "SET_USER_FIELD", field: "capturedIdImage", value: capturedImage });
    if (!state.user?.avatarMemeGif) {
      dispatch({ type: "SET_USER_FIELD", field: "avatarMemeGif", value: getRandomMemeCat() });
    }

    try {
      const userState = state.user;
      await apiFetch("/auth/upload-id", {
        method: "POST",
        body: JSON.stringify({
          capturedIdImage: capturedImage,
          studentIdPhotoUrl: capturedImage,
          email: userState?.email,
          mysteryName: userState?.secretName || userState?.name,
        }),
      });
    } catch (err: any) {
      console.warn("Backend ID upload call:", err);
    }

    dispatch({ type: "COMPLETE_SETUP" });
    navigate("/feed");
  };



  return (
    <div className="w-full max-w-md mx-auto pt-6 px-4 pb-24 min-h-screen flex flex-col justify-between relative">
      {/* Hidden camera input fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <div>
        <header className="flex items-center justify-between py-2 mb-4 sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
          <button
            onClick={() => {
              stopStream();
              navigate(-1);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center neo-outset text-primary bg-surface active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="glass-blob px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[11px] font-bold text-primary tracking-widest uppercase">Step 3 of 3</span>
          </div>
          <div className="w-10"></div>
        </header>

        {/* Title */}
        <div className="text-center mb-6 px-2">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Live ID Scan</h1>
          <p className="text-sm text-on-surface-variant flex items-center justify-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            Align your ID card inside the frame to verify
          </p>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative w-full aspect-[4/3] max-w-[340px] mx-auto bg-surface-container-low rounded-3xl p-3 flex flex-col items-center justify-center neo-inset overflow-hidden">
          {/* Frame Container */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-surface-container">
            {/* Live Camera Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover rounded-xl ${
                cameraActive && !captured ? "block" : "hidden"
              }`}
            />

            {/* Captured Photo or Placeholder */}
            {!cameraActive || captured ? (
              capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured ID"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-on-surface-variant p-4 text-center">
                  <Camera className="w-10 h-10 mb-2 opacity-60 text-primary" />
                  <span className="text-xs font-semibold">Tap the shutter button below to open camera and take photo</span>
                </div>
              )
            ) : null}

            {/* Canvas overlay for scanning line */}
            <canvas
              ref={canvasRef}
              width={320}
              height={220}
              className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
            />

            {/* Corner Bracket Guides */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl z-20"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl z-20"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl z-20"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl z-20"></div>

            {captured && (
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                <CheckCircle2 className="w-12 h-12 text-on-primary bg-primary rounded-full p-1 shadow-lg" />
                <span className="text-xs font-bold text-on-primary uppercase tracking-widest bg-primary/80 px-3 py-1 rounded-full">
                  Verified Successfully
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Capture / Upload Controls */}
        <div className="flex flex-col items-center justify-center mt-5 gap-3">
          <div className="flex items-center gap-4">
            {/* Camera Shutter Button */}
            <button
              type="button"
              onClick={handleShutterClick}
              className={`w-16 h-16 rounded-full flex items-center justify-center neo-outset active:scale-95 transition-all cursor-pointer ${
                captured
                  ? "bg-surface-container text-primary hover:bg-surface-container-high"
                  : "bg-primary text-on-primary shadow-lg"
              }`}
              title={captured ? "Retake photo" : cameraActive ? "Snap photo" : "Open camera"}
            >
              {captured ? <RefreshCw className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 rounded-2xl bg-surface neo-outset text-xs font-bold text-primary flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              📁 <span>Upload from Device</span>
            </button>
          </div>

          <span className="text-xs font-semibold text-on-surface-variant">
            {captured ? "Photo ready! Click Continue to submit" : cameraActive ? "Click camera button to snap photo" : "Use camera or upload an existing photo"}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-6 w-full flex flex-col gap-3">
        {errorMessage && (
          <p className="text-xs font-bold text-red-500 text-center animate-fade-in bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 bg-primary text-on-primary font-bold text-base rounded-2xl flex items-center justify-center gap-2 neo-outset active:scale-95 transition-transform shadow-lg cursor-pointer"
        >
          <span>{captured ? "Submit ID & Finish Setup" : "Continue"}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

