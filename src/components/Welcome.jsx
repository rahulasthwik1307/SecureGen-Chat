import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import DualArenaLogo from "./DualArenaLogo";
import { useAuth } from "../contexts/AuthContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { animate } from "animejs";
import { 
  FaRobot, 
  FaBolt, 
  FaBrain, 
  FaMicrophone, 
  FaCamera, 
  FaShieldHalved, 
  FaArrowRight, 
  FaCopy, 
  FaCheck, 
  FaChevronDown,
  FaCircleCheck,
  FaPlay,
  FaStar,
  FaPlus
} from "react-icons/fa6";

gsap.registerPlugin(ScrollTrigger);

const SIMULATED_PROMPTS = [
  {
    id: "black-holes",
    label: "Explain Black Holes",
    shortQuery: "Explain a black hole like I am 10 years old.",
    llamaAnswer: "Imagine an invisible cosmic vacuum cleaner that became infinitely heavy! It creates a slide in space so steep that not even flashlights can escape its pull.",
    deepseekThink: "Target audience: 10-year-old child. Key physics: intense gravity, escape velocity greater than speed of light, event horizon. Analogy required: bowling ball on trampoline.",
    deepseekAnswer: "Think of an enormous cosmic whirlpool. If you throw a giant bowling ball into a rubber trampoline, it makes a deep dent. A black hole makes a dent so deep that anything falling in cannot climb back out, not even light rays."
  },
  {
    id: "pizza-poem",
    label: "Pizza & Robots",
    shortQuery: "Write a playful poem about a pizza-cooking robot.",
    llamaAnswer: "Beep boop slice, rolling out the dough,\nCheese hits the oven with a golden glow.\nI calculate toppings with laser-sharp grace,\nDelivering hot slices straight to outer space.",
    deepseekThink: "Theme: Robot chef making pizza. Tone: playful, rhythmic, kid-friendly. Rhyme scheme: AABB. Incorporate robot sound effects and pizza elements.",
    deepseekAnswer: "Gears go click and the sensors ignite,\nSpinning tomato sauce left and right.\nWith molten mozzarella and silicon care,\nI bake the crunchiest pizza in the galaxy's air."
  },
  {
    id: "space-alien",
    label: "Alien Pet Advice",
    shortQuery: "What should I feed a pet alien from Mars?",
    llamaAnswer: "Definitely space popcorn dusted with stardust, followed by a glass of sparkling liquid oxygen. Keep them away from alarm clocks, as they think beeping means playtime.",
    deepseekThink: "Premise: Fictional Mars alien pet care. Goal: Delightful, creative sci-fi lore for kids. Address: nutrition, hydration, funny warning habits.",
    deepseekAnswer: "Martian flora experts suggest crunchy red rocks seasoned with comet sugar. For hydration, blue ice crystals dissolved in fruit punch work best. Never give them soda, or they might float away."
  }
];

const FAQS = [
  {
    question: "How does the Dual AI system work?",
    answer: "When you send a prompt, our engine simultaneously queries two top-tier AI models: Qwen 3.8 27B and OpenAI GPT-OSS 120B. You get both answers side-by-side in real-time, allowing you to compare creative storytelling against deep chain-of-thought logic."
  },
  {
    question: "Why is this valuable for children and students?",
    answer: "Learners discover that there is rarely only one way to explain a concept. Seeing two distinct answers side-by-side fosters critical thinking, sparks curiosity, and shows whether an intuitive metaphor or a step-by-step mathematical proof works best."
  },
  {
    question: "Is Dual AI free to use?",
    answer: "Yes, 100% free. You can register with a simple username and password, or use our smart biometric Face ID login. No credit cards, no tracking, and your chat history is stored securely in your browser's private IndexedDB."
  },
  {
    question: "Can I use voice input and face login on mobile?",
    answer: "Yes. The voice microphone button uses the modern Web Speech API, and the Face ID camera login runs client-side with TensorFlow.js and FaceAPI directly on your device."
  }
];

export default function Welcome() {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const pinnedRef = useRef(null);
  const marqueeRef = useRef(null);
  
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // GSAP Orchestrated & Hardware-Accelerated Animations
  useGSAP(() => {
    const isReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Hero Headline Staggered Pop Entrance (Missed Opportunity 2)
    if (!isReducedMotion) {
      gsap.from(".hero-headline-1", {
        y: 28,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.4)"
      });
      gsap.from(".hero-headline-2", {
        scale: 0.92,
        rotation: -2.5,
        opacity: 0,
        duration: 0.65,
        delay: 0.12,
        ease: "back.out(1.5)"
      });
    }

    // 2. Marquee with Reduced Motion check and hover pause (Fixes #3)
    if (!isReducedMotion && marqueeRef.current) {
      const marqueeTween = gsap.to(".marquee-track", {
        xPercent: -50,
        ease: "none",
        duration: 22,
        repeat: -1
      });

      const trackEl = marqueeRef.current;
      const pauseMarquee = () => marqueeTween.pause();
      const resumeMarquee = () => marqueeTween.play();

      trackEl.addEventListener("mouseenter", pauseMarquee);
      trackEl.addEventListener("mouseleave", resumeMarquee);
    }

    // 3. Pinned Comparison Arena with Direct Scrub Timeline (Fixes #2, #5 & Missed Opp 1)
    const mm = gsap.matchMedia();
    
    mm.add("(min-width: 1024px)", () => {
      if (!isReducedMotion && pinnedRef.current) {
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: pinnedRef.current,
            start: "top 12%",
            end: "+=600",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1
          }
        });

        // Cards converge with subtle elastic compression
        scrubTl.fromTo(".pinned-llama-card", 
          { x: -30, scale: 0.97 }, 
          { x: 0, scale: 1.02, ease: "none" }, 0
        );
        scrubTl.fromTo(".pinned-deepseek-card", 
          { x: 30, scale: 0.97 }, 
          { x: 0, scale: 1.02, ease: "none" }, 0
        );
        // Center VS badge impact clash instead of 360 spin
        scrubTl.fromTo(".pinned-vs-badge", 
          { scale: 0.85, rotation: -10 }, 
          { scale: 1.15, rotation: 6, ease: "none" }, 0
        );

        // Stat meters fill ignition
        scrubTl.fromTo(".stat-meter-fill", 
          { scaleX: 0, transformOrigin: "left" }, 
          { scaleX: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" }, 0.15
        );
      }
    });

    // 4. Staggered feature cards reveal (Fixes #6)
    if (!isReducedMotion) {
      gsap.from(".feature-pop-card", {
        scrollTrigger: {
          trigger: "#superpowers",
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        y: 26,
        scale: 0.96,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "back.out(1.3)"
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, { scope: containerRef });

  const activeDemo = SIMULATED_PROMPTS[activePromptIdx];

    const handleCopyDemo = (e) => {
    if (e?.currentTarget) {
      animate(e.currentTarget, {
        scale: [1, 0.88, 1.08, 1],
        duration: 250,
        ease: "outBack"
      });
    }
    const text = `Question: ${activeDemo.shortQuery}\n\nQwen 3.8 27B: ${activeDemo.llamaAnswer}\n\nOpenAI GPT-OSS 120B: ${activeDemo.deepseekAnswer}`;
    navigator.clipboard.writeText(text);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-popCream text-popDark selection:bg-popYellow selection:text-popDark">
      {/* =========================================================================
          CHAPTER 0: NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto bg-white border-3 border-black shadow-neo rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo Badge - Unified Brand Lockup */}
          <Link to="/" className="header-brand-wrap group focus:outline-none focus-visible:ring-4 focus-visible:ring-popYellow rounded-lg">
            <DualArenaLogo size={40} className="shrink-0" />
            <span className="header-title text-xl sm:text-2xl font-black text-black">
              DUAL ARENA
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 font-bold text-sm">
            <a href="#playground" className="text-black hover:text-popBlue transition-colors">Live Demo</a>
            <a href="#arena" className="text-black hover:text-popBlue transition-colors">The Duel</a>
            <a href="#superpowers" className="text-black hover:text-popBlue transition-colors">Superpowers</a>
            <a href="#faq" className="text-black hover:text-popBlue transition-colors">FAQ</a>
          </nav>

          {/* Clean & Attractive Action Cluster in Right-Side Corner */}
          <div className="header-actions">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF6] border-2 border-black rounded-xl text-xs font-mono font-black shadow-neo-sm">
                  <span>👤</span>
                  <span className="max-w-[110px] truncate text-black">{user.username}</span>
                </div>
                <Link
                  to="/chat"
                  className="header-quick-btn"
                  title="Launch the Dual AI Arena"
                >
                  <FaBolt className="text-xs text-amber-500" />
                  <span>Launch Arena</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="header-action-btn font-extrabold text-xs sm:text-sm !w-auto px-4 text-black hover:bg-gray-100"
                  title="Sign In to Dual AI Arena"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="header-quick-btn"
                  title="Create Free Arena Account"
                >
                  <FaPlus className="text-xs" />
                  <span>Enter Arena</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          CHAPTER 1: THE POP ARENA HERO (STRICT TWO-LINE HEADLINE)
      ========================================================================= */}
      <section className="relative pt-12 pb-20 px-4 bg-comic-grid overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-20">
          {/* Main Headline (Guaranteed to fit in 2 lines at all widths) */}
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.08] mb-6">
            TWO GIANT AIs.<br />
            <span className="inline-block bg-popYellow px-3 sm:px-4 py-1 border-3 border-black shadow-neo rounded-2xl transform -rotate-1 mx-1 text-black">
              ONE BATTLE ARENA.
            </span>
          </h1>

          {/* Subtitle / Statement */}
          <p className="max-w-[55ch] mx-auto text-base sm:text-xl font-medium text-gray-800 leading-relaxed mb-8 px-2">
            Why settle for one bot? Watch Qwen 3.8 and OpenAI GPT-OSS 120B think, reason, and answer side-by-side in real-time. Built for curious learners and creators.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              to="/chat"
              className="neo-btn bg-popPink hover:bg-rose-500 text-white px-8 py-4 rounded-2xl text-lg sm:text-xl font-display font-bold flex items-center gap-3 shadow-neo-lg"
            >
              <span>ENTER THE ARENA</span>
              <FaArrowRight />
            </Link>
            <a
              href="#playground"
              className="neo-btn bg-white hover:bg-gray-50 text-black px-6 py-4 rounded-2xl text-base sm:text-lg font-bold flex items-center gap-2"
            >
              <FaPlay className="text-xs text-popBlue" />
              <span>Try Live Simulator</span>
            </a>
          </div>

          {/* =========================================================================
              HERO LIVE INTERACTIVE SIMULATOR (THE PRODUCT PERFORMING)
          ========================================================================= */}
          <div id="playground" className="max-w-4xl mx-auto bg-white border-3 border-black shadow-neo-xl rounded-3xl p-5 sm:p-7 text-left relative">
            {/* Top Bar of the Simulator */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-popPink border-2 border-black inline-block"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-popYellow border-2 border-black inline-block"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-popMint border-2 border-black inline-block"></span>
                <span className="text-sm font-bold text-gray-700 ml-2">Live Duel Preview</span>
              </div>

              {/* Prompt Switcher Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {SIMULATED_PROMPTS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePromptIdx(idx)}
                    className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border-2 border-black transition-all ${
                      activePromptIdx === idx 
                        ? "bg-popYellow shadow-neo-sm transform -translate-y-0.5" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Asked */}
            <div className="bg-popCream border-2 border-black rounded-2xl p-4 mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-popDark text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  YOU
                </div>
                <p className="font-bold text-base sm:text-lg text-black">
                  "{activeDemo.shortQuery}"
                </p>
              </div>
              <button
                onClick={(e) => handleCopyDemo(e)}
                className="neo-btn bg-white text-xs sm:text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-black flex-shrink-0"
                title="Copy entire comparison"
              >
                {copiedDemo ? <FaCheck className="text-green-600" /> : <FaCopy />}
                <span className="hidden sm:inline">{copiedDemo ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Side-by-Side Dual Response Showcase */}
            <div key={activePromptIdx} className="grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity duration-200 animate-fadeIn">
              {/* Left Column: Qwen 3.8 27B */}
              <div className="border-3 border-black rounded-2xl p-5 bg-blue-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-popBlue text-white flex items-center justify-center text-xs font-bold shadow-neo-sm">
                        Q3
                      </span>
                      <span className="font-display font-bold text-base text-popBlue">Qwen 3.8 27B</span>
                    </div>
                    <span className="text-xs font-bold bg-blue-100 border border-blue-400 text-blue-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FaBolt className="text-[10px] text-amber-500" /> Fast Execution
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-900 leading-relaxed font-medium whitespace-pre-line">
                    {activeDemo.llamaAnswer}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs sm:text-sm font-bold text-popBlue">
                  <span>Structured & Concise</span>
                  <span>Speed: Sub-1s</span>
                </div>
              </div>

              {/* Right Column: OpenAI GPT-OSS 120B */}
              <div className="border-3 border-black rounded-2xl p-5 bg-emerald-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-popMint text-black border-2 border-black flex items-center justify-center text-xs font-bold shadow-neo-sm">
                        OS
                      </span>
                      <span className="font-display font-bold text-base text-emerald-900">GPT-OSS 120B</span>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 border border-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FaBrain className="text-[10px] text-emerald-600" /> Reasoning Lab
                    </span>
                  </div>

                  {/* Thinking Process Preview */}
                  <div className="bg-white/90 border-2 border-black/20 rounded-xl p-3 mb-3 text-xs sm:text-sm text-gray-700">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                      <FaBrain className="text-xs" /> Internal Reasoning Chain:
                    </div>
                    <p className="line-clamp-2 italic">{activeDemo.deepseekThink}</p>
                  </div>

                  <p className="text-sm sm:text-base text-gray-900 leading-relaxed font-medium">
                    {activeDemo.deepseekAnswer}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-900">
                  <span>Chain-of-Thought Proof</span>
                  <span>120B Parameters</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar inside Simulator */}
            <div className="mt-5 text-center">
              <Link 
                to="/chat" 
                className="text-sm font-bold text-black hover:text-popPink transition-colors underline decoration-2 underline-offset-4"
              >
                Want to ask your own custom prompt? Jump into the live chat arena →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 2: PINNED DUAL-ENGINE FACEOFF (GSAP SCROLLTRIGGER)
      ========================================================================= */}
      <section id="arena" ref={pinnedRef} className="py-20 px-4 bg-popYellow border-y-3 border-black relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-black tracking-tight leading-tight">
              MEET YOUR TWO CO-PILOTS
            </h2>
            <p className="font-medium text-gray-900 mt-2 text-base sm:text-lg">
              One thinks in rapid creative flashes. The other builds rigorous step-by-step mathematical logic. Together, they are unbeatable.
            </p>
          </div>

          {/* Pinned Arena Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
            {/* Fighter 1: Qwen 3.8 27B */}
            <div className="pinned-llama-card lg:col-span-5 bg-white border-3 border-black shadow-neo-xl rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-gray-900">Alibaba Cloud / Groq LPU</span>
                <span className="text-sm font-bold text-popBlue flex items-center gap-1">
                  <FaBolt className="text-amber-500 text-xs" /> High-Speed Engine
                </span>
              </div>
              <h3 className="font-display font-black text-3xl text-popBlue mb-2">
                Qwen 3.8 27B
              </h3>
              <p className="text-gray-800 font-medium text-sm sm:text-base mb-6 leading-relaxed">
                Engineered for ultra-fast first-token velocity, concise structured clarity, formatted markdown tables, bold key takeaways, and clean bullet lists.
              </p>

              {/* Stat Meters */}
              <div className="space-y-3 text-xs sm:text-sm font-bold">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Speed & Latency</span>
                    <span>99%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popBlue h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "99%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Structured Markdown Tables</span>
                    <span>98%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popYellow h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "98%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Generation Throughput</span>
                    <span>98%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popMint h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "98%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* VS Comic Badge in Center */}
            <div className="pinned-vs-badge lg:col-span-1 flex justify-center py-2 lg:py-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-popPink border-3 border-black shadow-neo rounded-full flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-white">
                VS
              </div>
            </div>

            {/* Fighter 2: OpenAI GPT-OSS 120B */}
            <div className="pinned-deepseek-card lg:col-span-5 bg-white border-3 border-black shadow-neo-xl rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-gray-900">OpenAI Open Weights / Groq LPU</span>
                <span className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                  <FaBrain className="text-emerald-600 text-xs" /> Reasoning Engine
                </span>
              </div>
              <h3 className="font-display font-black text-3xl text-emerald-800 mb-2">
                OpenAI GPT-OSS 120B
              </h3>
              <p className="text-gray-800 font-medium text-sm sm:text-base mb-6 leading-relaxed">
                A massive 120B parameter reasoning model with dedicated chain-of-thought analysis, breaking down internal logic, edge cases, and multi-step deduction.
              </p>

              {/* Stat Meters */}
              <div className="space-y-3 text-xs sm:text-sm font-bold">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Chain-of-Thought Depth</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popMint h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "100%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Code & Math Precision</span>
                    <span>99%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popPink h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "99%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Logic Transparency</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4 overflow-hidden">
                    <div className="bg-popYellow h-full border-r-2 border-black stat-meter-fill origin-left" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 3: SUPERPOWERS & PLAYFUL FEATURES
      ========================================================================= */}
      <section id="superpowers" className="py-24 px-4 bg-popCream">
        <div className="max-w-6xl mx-auto">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-black tracking-tight leading-tight">
              DESIGNED FOR INTERACTION
            </h2>
            <p className="font-medium text-gray-800 mt-2 text-base sm:text-lg">
              Every feature is built with tactile feedback, speech recognition, biometric authentication, and complete user privacy.
            </p>
          </div>

          {/* Asymmetric Pop Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Voice Recognition */}
            <div className="feature-pop-card bg-white border-3 border-black shadow-neo-lg rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-popYellow border-3 border-black rounded-2xl flex items-center justify-center text-2xl text-black shadow-neo-sm mb-6">
                  <FaMicrophone />
                </div>
                <h3 className="font-display font-black text-2xl text-black mb-3">
                  Talk Directly With Your Voice
                </h3>
                <p className="text-gray-800 font-medium leading-relaxed text-sm sm:text-base">
                  Younger kids and fast thinkers can speak directly into the microphone. Using the built-in browser Speech Recognition engine, your words turn into instant questions without typing fatigue.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black/10 flex items-center gap-2 text-sm font-bold text-popBlue">
                <FaCircleCheck /> <span>Hands-Free Speech Recognition</span>
              </div>
            </div>

            {/* Card 2: Biometric Face ID */}
            <div className="feature-pop-card bg-white border-3 border-black shadow-neo-lg rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-popPink border-3 border-black rounded-2xl flex items-center justify-center text-2xl text-white shadow-neo-sm mb-6">
                  <FaCamera />
                </div>
                <h3 className="font-display font-black text-2xl text-black mb-3">
                  Smile to Sign In with Face ID
                </h3>
                <p className="text-gray-800 font-medium leading-relaxed text-sm sm:text-base">
                  Forget passwords. Register your smile with your camera. Our client-side TensorFlow model extracts facial descriptor vectors right on your device for instant, safe biometric authentication.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black/10 flex items-center gap-2 text-sm font-bold text-black">
                <FaCircleCheck className="text-popPink" /> <span>100% Client-Side Private Storage</span>
              </div>
            </div>

            {/* Card 3: Transparent Thinking Lab */}
            <div className="feature-pop-card bg-white border-3 border-black shadow-neo-lg rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-popMint border-3 border-black rounded-2xl flex items-center justify-center text-2xl text-black shadow-neo-sm mb-6">
                  <FaBrain />
                </div>
                <h3 className="font-display font-black text-2xl text-black mb-3">
                  Peek Inside The AI Brain
                </h3>
                <p className="text-gray-800 font-medium leading-relaxed text-sm sm:text-base">
                  Expandable reasoning accordions show exactly how GPT-OSS 120B breaks down tough math equations, coding bugs, or science puzzles before offering its final answer.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black/10 flex items-center gap-2 text-sm font-bold text-emerald-900">
                <FaCircleCheck /> <span>Chain-of-Thought Transparency</span>
              </div>
            </div>

            {/* Card 4: Local Private Storage */}
            <div className="feature-pop-card bg-white border-3 border-black shadow-neo-lg rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-popBlue border-3 border-black rounded-2xl flex items-center justify-center text-2xl text-white shadow-neo-sm mb-6">
                  <FaShieldHalved />
                </div>
                <h3 className="font-display font-black text-2xl text-black mb-3">
                  Kid-Safe & Private Local Memory
                </h3>
                <p className="text-gray-800 font-medium leading-relaxed text-sm sm:text-base">
                  No tracking cookies or data brokers. All conversation sessions are persisted strictly inside your browser using IndexedDB. You can search, export, copy, or wipe your chat history anytime with 1 click.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black/10 flex items-center gap-2 text-sm font-bold text-popBlue">
                <FaCircleCheck /> <span>Client-Side IndexedDB Storage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 4: ROLLING COMIC MARQUEE TAPE
      ========================================================================= */}
      <div ref={marqueeRef} className="py-4 bg-black text-popYellow font-display font-black text-xl sm:text-2xl tracking-wider uppercase border-y-3 border-black overflow-hidden select-none whitespace-nowrap">
        <div className="marquee-track inline-block">
          <span className="mx-6">DUAL AI PARALLEL STREAM</span>
          <span className="mx-6">•</span>
          <span className="mx-6">QWEN 3.8 27B AND OPENAI GPT-OSS 120B</span>
          <span className="mx-6">•</span>
          <span className="mx-6">POWERED BY GROQ LPUS</span>
          <span className="mx-6">•</span>
          <span className="mx-6">100 PERCENT FREE AND LOCAL</span>
          <span className="mx-6">•</span>
          <span className="mx-6">VOICE ACTIVATED</span>
          <span className="mx-6">•</span>
          <span className="mx-6">BIOMETRIC FACE LOGIN</span>
          <span className="mx-6">•</span>
          <span className="mx-6">DUAL AI PARALLEL STREAM</span>
          <span className="mx-6">•</span>
          <span className="mx-6">QWEN 3.8 27B AND OPENAI GPT-OSS 120B</span>
        </div>
      </div>

      {/* =========================================================================
          CHAPTER 5: INTERACTIVE ACCORDION FAQ
      ========================================================================= */}
      <section id="faq" className="py-24 px-4 bg-comic-grid">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-black">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border-3 border-black shadow-neo rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full text-left p-5 sm:p-6 font-display font-bold text-lg sm:text-xl text-black flex items-center justify-between gap-4 hover:bg-amber-50/50 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-popYellow cursor-pointer select-none"
                  aria-expanded={openFaq === idx}
                >
                  <span>{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center transform transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${openFaq === idx ? "rotate-180 bg-popYellow" : "bg-gray-100"}`}>
                    <FaChevronDown className="text-xs" />
                  </div>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${openFaq === idx ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-6 pt-2 text-gray-800 font-medium text-base sm:text-lg leading-relaxed border-t-2 border-black/10">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 6: GRAND LAUNCH BILLBOARD & FOOTER
      ========================================================================= */}
      <section className="py-20 px-4 bg-popCream">
        <div className="max-w-5xl mx-auto bg-popYellow border-4 border-black shadow-neo-xl rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden bg-halftone-dots">
          <div className="relative z-10">
            <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-black tracking-tight leading-[1.05] mb-6">
              DOUBLE YOUR BRAINPOWER.
            </h2>
            <p className="max-w-xl mx-auto font-medium text-black text-base sm:text-xl mb-8">
              Join thousands of students, tinkerers, and AI adventurers. Free forever, no credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="neo-btn bg-popPink hover:bg-rose-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-display font-bold text-lg sm:text-2xl shadow-neo-lg"
              >
                CREATE FREE ACCOUNT
              </Link>
              <Link
                to="/login"
                className="neo-btn bg-white hover:bg-gray-50 text-black px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-xl"
              >
                Sign In With Face ID
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="max-w-5xl mx-auto mt-12 pt-6 border-t-2 border-black/20 flex flex-wrap items-center justify-between gap-4 text-sm font-bold text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black font-display text-base">DUAL ARENA</span>
            <span>• Powered by Groq LPU, Qwen 3.8 27B & OpenAI GPT-OSS 120B</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-black">Login</Link>
            <Link to="/register" className="hover:text-black">Register</Link>
            <Link to="/chat" className="hover:text-black">Arena Chat</Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
