import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  showSubtitle?: boolean;
  textSize?: string;
  imageSize?: number;
}

export function Logo({
  className = "",
  variant = "dark",
  showSubtitle = false,
  textSize = "text-base",
  imageSize = 44,
}: LogoProps) {
  const isDark = variant === "dark";

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group ${className}`}>
      <div className="shrink-0 relative">
        {/* Subtle glow behind logo */}
        <div className={`absolute -inset-1 rounded-xl blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${isDark ? "bg-[#483C2C]/30" : "bg-white/20"}`} />
        <Image
          src="/gestimmo-logo.jpg"
          alt="Gestimmo"
          width={imageSize}
          height={imageSize}
          className="relative object-contain group-hover:scale-105 transition-transform duration-200"
          priority
        />
      </div>

      <div className="min-w-0">
        <span className={`font-extrabold tracking-tight leading-tight block ${textSize}`}>
          <span className={isDark ? "text-[#5C3317]" : "text-white"}>Gest</span>
          <span className={isDark ? "text-[#A0683C]" : "text-[#D1C7BD]"}>immo</span>
        </span>
        {showSubtitle && (
          <p
            className={`text-[10px] leading-tight font-medium tracking-wide uppercase ${
              isDark ? "text-[#A8A29E]" : "text-[#D1C7BD]"
            }`}
          >
            Gestion des immobilisations
          </p>
        )}
      </div>
    </Link>
  );
}
