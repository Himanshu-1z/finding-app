import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, MessageSquareQuote } from "lucide-react";

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/setup/1");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="liquid-blob-1"></div>
        <div className="liquid-blob-2"></div>
      </div>

      <main className="w-full max-w-md flex flex-col relative z-10 px-6 py-6 h-[80vh]">
        <header className="flex justify-center items-center w-full py-2 mb-8">
          <h1 className="text-5xl font-logo tracking-wide text-primary drop-shadow-sm">Finding</h1>
        </header>

        <div className="flex-1 flex flex-col justify-center w-full relative overflow-hidden neo-inset rounded-[2rem] p-4 glass-blob">
          <div
            className="flex w-[300%] h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
          >
            {/* Slide 1: Identity */}
            <div className="w-[33.333%] flex-shrink-0 flex flex-col items-center justify-center text-center p-6 space-y-6">
              
              <h2 className="text-2xl font-bold text-on-surface">Your True Identity</h2>
              <p className="text-base text-on-surface-variant max-w-xs">
                Enter a space where anonymity breeds authenticity. Your stories are safe in the shadows.
              </p>
            </div>

            {/* Slide 2: Stories */}
            <div className="w-[33.333%] flex-shrink-0 flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="w-32 h-32 rounded-[2rem] neo-inset flex items-center justify-center bg-surface-container mb-4">
                <MessageSquareQuote className="w-16 h-16 text-tertiary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Unfiltered Thoughts</h2>
              <p className="text-base text-on-surface-variant max-w-xs">
                Share your deepest thoughts without the fear of judgment. The canvas is yours.
              </p>
            </div>

            {/* Slide 3: Connections */}
            <div className="w-[33.333%] flex-shrink-0 flex flex-col items-center justify-center text-center p-6 space-y-6">
              <h2 className="text-2xl font-bold text-on-surface">Deep Connections</h2>
              <p className="text-base text-on-surface-variant max-w-xs">
                Every story deserves to heard.everyone deserves a chance
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 pb-4 flex flex-col items-center gap-8 w-full z-20">
          <div className="flex gap-3">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 neo-inset ${
                  currentSlide === index ? "bg-primary scale-125" : "bg-surface-variant scale-100"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full max-w-[280px] py-4 rounded-full bg-primary text-on-primary text-xl font-semibold neo-button active:scale-95 transition-transform duration-200 cursor-pointer shadow-md"
          >
            {currentSlide === totalSlides - 1 ? "Get Started" : "Continue"}
          </button>

          <p className="text-sm text-on-surface-variant text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-bold hover:underline ml-1 cursor-pointer transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

