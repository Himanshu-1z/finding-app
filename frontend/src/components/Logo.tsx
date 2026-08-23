import React from "react";

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Right Black Bubble (Back) */}
      <path d="M45 25 C45 15, 55 15, 65 15 L75 15 C85 15, 95 25, 95 35 L95 65 C95 75, 85 85, 75 85 L65 85 L55 95 C52 98, 48 95, 50 90 L52 83 C48 80, 45 75, 45 70 Z" fill="#2C2C2C"/>
      
      {/* Black Bubble Face */}
      <circle cx="65" cy="45" r="4" fill="#FFFFFF"/>
      <circle cx="85" cy="45" r="4" fill="#FFFFFF"/>
      <path d="M70 55 Q75 60 80 55" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>

      {/* Left Gold Bubble (Front) */}
      <path d="M5 25 C5 10, 15 5, 25 5 L55 5 C65 5, 75 10, 75 25 L75 55 C75 70, 65 75, 55 75 L45 75 C45 75, 30 85, 25 90 C22 93, 18 90, 20 85 L23 72 C10 68, 5 60, 5 50 Z" fill="#C6A664"/>
      
      {/* Gold Bubble Face */}
      <circle cx="30" cy="35" r="4" fill="#2C2C2C"/>
      <circle cx="50" cy="35" r="4" fill="#2C2C2C"/>
      <path d="M35 45 Q40 50 45 45" stroke="#2C2C2C" strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
