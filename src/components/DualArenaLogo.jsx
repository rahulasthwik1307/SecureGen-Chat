import React, { useEffect, useRef } from "react";
import { animate, createTimeline } from "animejs";

/**
 * DualArenaLogo - Raw Swiss Neo-Brutalist Animated SVG Logo
 * 
 * Strict Anti-Slop Rules:
 * - Zero rounded corners, zero gradients, zero soft drop shadows
 * - Hard #000000 drop shadows with +4px offset
 * - stroke="#000000", strokeWidth="3.5", strokeLinejoin="miter"
 * - Left 'D' (Qwen Flash Speed): Pop Yellow #FFDE00
 * - Right 'A' (GPT-OSS Reasoning): Electric Pink #FF3366
 * - Clash Slash ('//'): Mint Green #00F5D4
 */
const DualArenaLogo = ({ size = 48, className = "", onClick }) => {
  const containerRef = useRef(null);
  const frameGroupRef = useRef(null);
  const frameBaseRef = useRef(null);
  const frameShadowRef = useRef(null);
  const letterDRef = useRef(null);
  const letterARef = useRef(null);
  const slashRef = useRef(null);
  const slashBodyRef = useRef(null);
  const isClashingRef = useRef(false);

  // Mount / Entrance Choreography with Anime.js v4
  useEffect(() => {
    const tl = createTimeline();

    // 1. arena-frame pops in
    if (frameGroupRef.current) {
      tl.add(frameGroupRef.current, {
        scale: [0.85, 1],
        duration: 300,
        ease: "outBack"
      }, 0);
    }

    // 2. letter-d slams in from top-left
    if (letterDRef.current) {
      tl.add(letterDRef.current, {
        translateX: [-18, 0],
        translateY: [-18, 0],
        duration: 350,
        ease: "outExpo"
      }, 50);
    }

    // 3. letter-a slams in from bottom-right (overlapped)
    if (letterARef.current) {
      tl.add(letterARef.current, {
        translateX: [18, 0],
        translateY: [18, 0],
        duration: 350,
        ease: "outExpo"
      }, 150);
    }

    // 4. clash-slash slices diagonally across center
    if (slashRef.current) {
      tl.add(slashRef.current, {
        scaleY: [0, 1],
        translateX: [12, 0],
        translateY: [-12, 0],
        duration: 280,
        ease: "outElastic"
      }, 250);
    }
  }, []);

  // Hover / Click Tactile Clash Physics
  const handleClash = (e) => {
    if (onClick) onClick(e);
    if (isClashingRef.current) return;
    isClashingRef.current = true;

    // 1. Classic Neo-Brutalist Frame Press: base moves +3px, +3px
    if (frameBaseRef.current) {
      animate(frameBaseRef.current, {
        translateX: [0, 3, 0],
        translateY: [0, 3, 0],
        duration: 220,
        ease: "outBack"
      });
    }

    // 2. Head-to-Head Clash: Letter D jolts 4px toward center and bounces back
    if (letterDRef.current) {
      animate(letterDRef.current, {
        translateX: [0, 4, 0],
        translateY: [0, 4, 0],
        duration: 380,
        ease: "outElastic"
      });
    }

    // 3. Head-to-Head Clash: Letter A jolts 4px toward center and bounces back
    if (letterARef.current) {
      animate(letterARef.current, {
        translateX: [0, -4, 0],
        translateY: [0, -4, 0],
        duration: 380,
        ease: "outElastic"
      });
    }

    // 4. Clash Slash color flash: Mint -> White -> Mint
    if (slashBodyRef.current) {
      animate(slashBodyRef.current, {
        fill: ["#00F5D4", "#FFFFFF", "#00F5D4"],
        duration: 280,
        ease: "outQuad"
      });
    }

    setTimeout(() => {
      isClashingRef.current = false;
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={handleClash}
      onClick={handleClash}
      title="DUAL.ARENA — Click to clash!"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClash(e);
        }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {/* Layer 1: Arena Frame */}
        <g id="arena-frame" ref={frameGroupRef}>
          {/* Hard Shadow */}
          <rect
            ref={frameShadowRef}
            x="14"
            y="14"
            width="78"
            height="78"
            fill="#000000"
          />
          {/* Canvas Base */}
          <rect
            ref={frameBaseRef}
            x="8"
            y="8"
            width="78"
            height="78"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </g>

        {/* Layer 2: Letter 'D' (Top-Left Geometric Brutalist 'D') */}
        <g id="letter-d" ref={letterDRef}>
          {/* Hard Drop Shadow */}
          <path
            d="M 16 18 L 36 18 L 46 28 L 46 48 L 36 58 L 16 58 Z"
            fill="#000000"
            transform="translate(4, 4)"
          />
          {/* Body */}
          <path
            d="M 16 18 L 36 18 L 46 28 L 46 48 L 36 58 L 16 58 Z"
            fill="#FFDE00"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
          {/* Counter Cutout */}
          <rect
            x="25"
            y="28"
            width="10"
            height="20"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </g>

        {/* Layer 3: Letter 'A' (Bottom-Right Geometric Brutalist 'A') */}
        <g id="letter-a" ref={letterARef}>
          {/* Hard Drop Shadow */}
          <path
            d="M 56 36 L 68 36 L 78 76 L 46 76 Z"
            fill="#000000"
            transform="translate(4, 4)"
          />
          {/* Body */}
          <path
            d="M 56 36 L 68 36 L 78 76 L 46 76 Z"
            fill="#FF3366"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
          {/* Counter Cutout */}
          <rect
            x="58"
            y="48"
            width="8"
            height="10"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
          {/* Crossbar */}
          <line
            x1="50"
            y1="65"
            x2="74"
            y2="65"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </g>

        {/* Layer 4: Clash Slash (Center Mint Green Divider) */}
        <g id="clash-slash" ref={slashRef} style={{ transformOrigin: "50px 50px" }}>
          {/* Hard Drop Shadow */}
          <polygon
            points="62,14 70,14 32,80 24,80"
            fill="#000000"
            transform="translate(3, 3)"
          />
          {/* Body */}
          <polygon
            ref={slashBodyRef}
            points="62,14 70,14 32,80 24,80"
            fill="#00F5D4"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </g>
      </svg>
    </div>
  );
};

export default DualArenaLogo;

