import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  showSubtitle?: boolean;
  textSize?: string;
}

export function Logo({
  className = "",
  variant = "dark",
  showSubtitle = false,
  textSize = "text-base",
}: LogoProps) {
  const isDark = variant === "dark";

  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
          isDark
            ? "bg-[#1C1917] text-white"
            : "bg-white/10 text-white backdrop-blur-xs"
        }`}
      >
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="7" r="3" />
          <circle cx="7" cy="16" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      </div>
      <div>
        <span
          className={`font-bold tracking-tight leading-tight block ${textSize} ${
            isDark ? "text-[#1C1917]" : "text-white"
          }`}
        >
          Gestimo
        </span>
        {showSubtitle && (
          <p
            className={`text-[11px] leading-tight ${
              isDark ? "text-[#78716C]" : "text-[#D1C7BD]"
            }`}
          >
            Gestion des immobilisations
          </p>
        )}
      </div>
    </Link>
  );
}
