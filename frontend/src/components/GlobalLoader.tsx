import { useEffect, useState } from "react";
import { subscribeToLoading } from "../services/apiClient";
import { Loader2 } from "lucide-react";

export function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    let timer: any = null;

    const unsubscribe = subscribeToLoading((loading) => {
      setIsLoading(loading);
      if (loading) {
        // Show the subtle glass pill only if request takes longer than 250ms
        timer = setTimeout(() => {
          setShowBadge(true);
        }, 250);
      } else {
        if (timer) clearTimeout(timer);
        setShowBadge(false);
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      {/* Sleek Top Animated Progress Line (Non-blocking) */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 overflow-hidden pointer-events-none bg-primary/10">
        <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary animate-progress-indeterminate" />
      </div>
    </>
  );
}

