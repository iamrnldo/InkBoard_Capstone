// src/pages/landing/LandingPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenTool,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Check,
  Wand2,
  Share2,
  Shield,
  Play,
  Sparkles,
  MousePointer2,
} from "lucide-react";

/* ── useInView hook for scroll-triggered animations ── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (!options.repeat) observer.disconnect();
        } else if (options.repeat) {
          setInView(false);
        }
      },
      { threshold: options.threshold ?? 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

/* ── Animated grid background ── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orb1 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "orb2 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)",
          filter: "blur(70px)",
          animation: "orb3 12s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.08); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(30px, -20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

/* ── Particle system for hero ── */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 10 + 8,
    delay: Math.random() * -10,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(${p.id % 3 === 0 ? "139,92,246" : p.id % 3 === 1 ? "59,130,246" : "236,72,153"}, ${p.opacity})`,
            animation: `float-particle ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: var(--op, 0.2); }
          33% { transform: translateY(-30px) translateX(15px); }
          66% { transform: translateY(-15px) translateX(-10px); }
        }
      `}</style>
    </div>
  );
}

/* ── Floating canvas mockup ── */
function CanvasMockup() {
  const [activeEl, setActiveEl] = useState(null);

  const elements = [
    { x: 60, y: 40, w: 120, h: 50, color: "#8b5cf6", label: "User Auth" },
    { x: 240, y: 40, w: 110, h: 50, color: "#3b82f6", label: "Dashboard" },
    { x: 60, y: 150, w: 130, h: 50, color: "#10b981", label: "Database" },
    { x: 240, y: 150, w: 110, h: 50, color: "#f59e0b", label: "API Layer" },
    { x: 150, y: 260, w: 120, h: 50, color: "#ec4899", label: "Frontend" },
  ];

  const arrows = [
    { x1: 180, y1: 65, x2: 240, y2: 65 },
    { x1: 120, y1: 115, x2: 120, y2: 150 },
    { x1: 295, y1: 115, x2: 295, y2: 150 },
    { x1: 175, y1: 200, x2: 210, y2: 260 },
  ];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,20,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div
          className="flex-1 mx-3 h-6 rounded-md text-xs flex items-center px-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          inkboard.app/board/my-project
        </div>
        <div className="flex gap-2">
          {["#8b5cf6", "#3b82f6", "#10b981"].map((c, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-gray-800 transition-transform hover:scale-110 cursor-pointer"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="p-6" style={{ minHeight: "360px", position: "relative" }}>
        <svg width="100%" height="320" viewBox="0 0 420 320" className="w-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {arrows.map((a, i) => (
            <g key={i}>
              <line
                x1={a.x1}
                y1={a.y1}
                x2={a.x2}
                y2={a.y2}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />
              <line
                x1={a.x1}
                y1={a.y1}
                x2={a.x2}
                y2={a.y2}
                stroke="rgba(139,92,246,0.4)"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                style={{
                  animation: `dash-move 2s linear infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            </g>
          ))}

          {elements.map((el, i) => (
            <g
              key={i}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActiveEl(i)}
              onMouseLeave={() => setActiveEl(null)}
            >
              <rect
                x={el.x - 2}
                y={el.y - 2}
                width={el.w + 4}
                height={el.h + 4}
                rx="12"
                fill="transparent"
                stroke={activeEl === i ? el.color : "transparent"}
                strokeWidth="1"
                style={{
                  transition: "all 0.2s",
                  filter:
                    activeEl === i
                      ? `drop-shadow(0 0 8px ${el.color})`
                      : "none",
                }}
              />
              <rect
                x={el.x}
                y={el.y}
                width={el.w}
                height={el.h}
                rx="10"
                fill={el.color + (activeEl === i ? "33" : "18")}
                stroke={el.color + (activeEl === i ? "99" : "55")}
                strokeWidth="1.5"
                style={{
                  animation: `pulse-box 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                  transition: "all 0.2s",
                  filter:
                    activeEl === i
                      ? `drop-shadow(0 0 6px ${el.color}88)`
                      : "none",
                }}
              />
              <text
                x={el.x + el.w / 2}
                y={el.y + el.h / 2 + 5}
                textAnchor="middle"
                fill={el.color}
                fontSize="12"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="600"
                style={{ transition: "all 0.2s" }}
              >
                {el.label}
              </text>
            </g>
          ))}

          <g style={{ animation: "cursor-move 5s ease-in-out infinite" }}>
            <path
              d="M200 200 L207 215 L210 208 L217 211 Z"
              fill="white"
              opacity="0.9"
              filter="url(#glow)"
            />
            <circle cx="200" cy="200" r="3" fill="#8b5cf6" opacity="0.9" />
          </g>
        </svg>

        {/* Live indicator */}
        <div
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.25)",
            color: "#10b981",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          3 online
        </div>

        {/* AI Badge */}
        <div
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
            color: "#a78bfa",
            animation: "badge-pop 4s ease-in-out infinite",
          }}
        >
          <Sparkles className="w-3 h-3" />
          AI generated
        </div>
      </div>

      <style>{`
        @keyframes pulse-box {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes cursor-move {
          0% { transform: translate(0px, 0px); }
          20% { transform: translate(70px, -40px); }
          40% { transform: translate(130px, 10px); }
          60% { transform: translate(50px, 70px); }
          80% { transform: translate(-20px, 30px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes dash-move {
          to { stroke-dashoffset: -14; }
        }
        @keyframes badge-pop {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}

/* ── Feature Card with stagger animation ── */
function FeatureCard({ icon: Icon, title, desc, color, index }) {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="group p-6 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transitionDelay: `${index * 80}ms`,
        opacity: inView ? 1 : 0,
        transform: inView
          ? "translateY(0) scale(1)"
          : "translateY(30px) scale(0.97)",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `rgba(${color === "#8b5cf6" ? "139,92,246" : color === "#3b82f6" ? "59,130,246" : color === "#ec4899" ? "236,72,153" : color === "#10b981" ? "16,185,129" : color === "#f59e0b" ? "245,158,11" : "6,182,212"}, 0.07)`;
        e.currentTarget.style.borderColor = color + "33";
        e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
        e.currentTarget.style.boxShadow = `0 20px 40px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.025)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{
          background: `linear-gradient(135deg, ${color}25, ${color}10)`,
          border: `1px solid ${color}35`,
          boxShadow: `0 4px 15px ${color}15`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="font-bold text-white mb-2 text-[15px] tracking-tight">
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ── Pricing Card ── */
function PricingCard({ name, price, features, highlight, cta, onCta, index }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className="relative p-6 rounded-2xl flex flex-col"
      style={{
        background: highlight
          ? "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))"
          : "rgba(255,255,255,0.025)",
        border: highlight
          ? "1px solid rgba(139,92,246,0.35)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: highlight
          ? "0 0 50px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "none",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transitionDelay: `${index * 100}ms`,
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered
            ? "translateY(-8px) scale(1.02)"
            : "translateY(0) scale(1)"
          : "translateY(40px) scale(0.96)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {highlight && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wide"
          style={{
            background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
            color: "white",
            boxShadow: "0 4px 15px rgba(139,92,246,0.4)",
          }}
        >
          MOST POPULAR
        </div>
      )}

      <div className="mb-6">
        <p
          className="text-xs font-bold uppercase tracking-[0.15em] mb-3"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-white tracking-tight">
            {price === 0 ? "Free" : `Rp${price.toLocaleString("id-ID")}`}
          </span>
          {price > 0 && (
            <span
              className="text-sm mb-1.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              /bulan
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-7">
        {features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
              style={{
                background: highlight
                  ? "rgba(139,92,246,0.2)"
                  : "rgba(16,185,129,0.15)",
                border: `1px solid ${highlight ? "rgba(139,92,246,0.4)" : "rgba(16,185,129,0.3)"}`,
              }}
            >
              <Check
                className="w-2.5 h-2.5"
                style={{ color: highlight ? "#a78bfa" : "#10b981" }}
              />
            </div>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200"
        style={
          highlight
            ? {
                background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                color: "white",
                boxShadow: hovered
                  ? "0 8px 30px rgba(139,92,246,0.5)"
                  : "0 4px 20px rgba(139,92,246,0.3)",
                transform: hovered ? "scale(1.02)" : "scale(1)",
              }
            : {
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.1)",
                transform: hovered ? "scale(1.02)" : "scale(1)",
              }
        }
      >
        {cta}
      </button>
    </div>
  );
}

/* ── Section reveal wrapper ── */
function Reveal({ children, delay = 0, direction = "up" }) {
  const [ref, inView] = useInView({ threshold: 0.1 });

  const transforms = {
    up: inView ? "translateY(0)" : "translateY(50px)",
    left: inView ? "translateX(0)" : "translateX(-50px)",
    right: inView ? "translateX(0)" : "translateX(50px)",
    scale: inView ? "scale(1)" : "scale(0.9)",
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: transforms[direction],
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Stats counter ── */
function StatCounter({ value, label, suffix = "" }) {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const target = parseInt(value.replace(/[^0-9]/g, ""));
    const dur = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, dur / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black text-white mb-1 tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavVisible(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const scrollTo = useCallback((id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const features = [
    {
      icon: PenTool,
      title: "Infinite Canvas",
      desc: "Draw, diagram, dan design apapun di canvas yang tumbuh bersama ide-idemu. Tanpa batas.",
      color: "#8b5cf6",
    },
    {
      icon: Users,
      title: "Kolaborasi Real-time",
      desc: "Lihat kursor rekan kerjamu secara langsung. Kerja bareng di satu board sekaligus.",
      color: "#3b82f6",
    },
    {
      icon: Wand2,
      title: "AI Tools Terintegrasi",
      desc: "Generate diagram dari teks, konversi Mermaid syntax, atau ubah wireframe jadi kode.",
      color: "#ec4899",
    },
    {
      icon: Share2,
      title: "Share Satu Klik",
      desc: "Bagikan board dengan satu link. Atur akses view atau edit. Tidak perlu akun untuk melihat.",
      color: "#10b981",
    },
    {
      icon: Zap,
      title: "Auto-save",
      desc: "Setiap goresan tersimpan otomatis. Tidak ada yang hilang, bahkan ketika tab ditutup.",
      color: "#f59e0b",
    },
    {
      icon: Shield,
      title: "Private by Default",
      desc: "Board-mu privat kecuali kamu memilih untuk membagikannya. Kontrol penuh atas pekerjaanmu.",
      color: "#06b6d4",
    },
  ];

  const plans = [
    {
      name: "Lite",
      price: 0,
      features: [
        "1 board",
        "Tool gambar tak terbatas",
        "Sharing view-only",
        "Auto-save",
        "Template library",
      ],
      cta: "Mulai Gratis",
    },
    {
      name: "Pro",
      price: 15000,
      highlight: true,
      features: [
        "10 board",
        "Semua fitur Lite",
        "Sharing edit-access",
        "Kolaborasi real-time",
        "Priority support",
      ],
      cta: "Mulai Pro",
    },
    {
      name: "Premium",
      price: 30000,
      features: [
        "Board tak terbatas",
        "Semua fitur Pro",
        "AI tools (teks → diagram)",
        "Wireframe → code generation",
        "Early access fitur baru",
      ],
      cta: "Go Premium",
    },
  ];

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: "#07070f",
        fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
        scrollBehavior: "smooth",
      }}
    >
      {/* Mouse spotlight */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.04), transparent 40%)`,
          transition: "background 0.1s ease",
        }}
      />

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: navVisible ? "rgba(7,7,15,0.8)" : "transparent",
          backdropFilter: navVisible ? "blur(24px) saturate(180%)" : "none",
          borderBottom: navVisible
            ? "1px solid rgba(255,255,255,0.06)"
            : "none",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
          >
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-black tracking-tight">
            Inkboard
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Fitur", id: "features" },
            { label: "Harga", id: "pricing" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm font-medium transition-all duration-200 relative group"
              style={{
                color: "rgba(255,255,255,0.45)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.color = "white")}
              onMouseLeave={(e) =>
                (e.target.style.color = "rgba(255,255,255,0.45)")
              }
            >
              {item.label}
              <span
                className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                }}
              />
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => (e.target.style.color = "white")}
            onMouseLeave={(e) =>
              (e.target.style.color = "rgba(255,255,255,0.6)")
            }
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-bold px-5 py-2 rounded-xl transition-all duration-300"
            style={{
              background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
              color: "white",
              boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05) translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(139,92,246,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1) translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(139,92,246,0.35)";
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        <GridBackground />
        <Particles />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#a78bfa",
              animation: "hero-fade-in 0.8s ease forwards",
              opacity: 0,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Collaborative whiteboard + AI tools
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
            style={{
              animation:
                "hero-slide-up 0.9s 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: 0,
            }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tempat ide
              <br />
            </span>
            <span
              style={{
                background: "linear-gradient(90deg, #8b5cf6, #3b82f6, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              jadi kenyataan.
            </span>
          </h1>

          {/* Sub */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.4)",
              animation:
                "hero-slide-up 0.9s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: 0,
            }}
          >
            Canvas tak terbatas untuk tim. Buat diagram, brainstorm ide, dan
            kolaborasi real-time — dengan AI tools langsung di dalamnya.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
            style={{
              animation:
                "hero-slide-up 0.9s 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: 0,
            }}
          >
            <button
              onClick={() => navigate("/register")}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300"
              style={{
                background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                color: "white",
                boxShadow: "0 8px 30px rgba(139,92,246,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "scale(1.05) translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 40px rgba(139,92,246,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(139,92,246,0.4)";
              }}
            >
              Mulai menggambar — gratis
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                e.currentTarget.style.transform =
                  "scale(1.02) translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "scale(1) translateY(0)";
              }}
            >
              Log in ke board-mu
            </button>
          </div>

          {/* Canvas mockup with parallax */}
          <div
            className="relative max-w-3xl mx-auto"
            style={{
              transform: `translateY(${scrollY * 0.06}px)`,
              transition: "transform 0.1s linear",
              animation:
                "hero-slide-up 1s 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: 0,
            }}
          >
            <CanvasMockup />
            <div
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)",
                filter: "blur(25px)",
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            opacity: scrollY > 50 ? 0 : 1,
            transition: "opacity 0.3s ease",
            animation: "bounce-slow 2s ease-in-out infinite",
          }}
        >
          <div
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            scroll
          </div>
          <div
            className="w-px h-8"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
            }}
          />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="px-6 py-16">
        <div
          className="max-w-3xl mx-auto rounded-2xl px-8 py-8 grid grid-cols-3 gap-8"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <StatCounter value="12000" label="Pengguna aktif" suffix="+" />
          <StatCounter value="85000" label="Board dibuat" suffix="+" />
          <StatCounter value="99" label="Uptime" suffix="%" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Reveal delay={0}>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "#8b5cf6" }}
              >
                Semua yang kamu butuhkan
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Dibuat untuk kerja nyata
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p
                className="text-base mt-4 max-w-xl mx-auto"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Dari sketsa awal hingga arsitektur sistem yang kompleks — semua
                ada di sini.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-black text-white">
                Mulai dalam 3 langkah
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Buat akun",
                desc: "Daftar gratis. Tidak perlu kartu kredit.",
                color: "#8b5cf6",
                icon: MousePointer2,
              },
              {
                step: "02",
                title: "Buka canvas",
                desc: "Langsung gambar atau pilih dari template yang tersedia.",
                color: "#3b82f6",
                icon: PenTool,
              },
              {
                step: "03",
                title: "Undang tim",
                desc: "Share link dan kolaborasi real-time dengan siapapun.",
                color: "#10b981",
                icon: Users,
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 120} direction="up">
                <div
                  className="relative p-6 rounded-2xl group"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="text-6xl font-black mb-4 select-none"
                    style={{
                      color: item.color,
                      opacity: 0.12,
                      fontFamily: "monospace",
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 -mt-10"
                    style={{
                      background: `${item.color}18`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={{ color: item.color }}
                    />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {item.desc}
                  </p>

                  {i < 2 && (
                    <div
                      className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative px-6 py-28">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Reveal delay={0}>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "#8b5cf6" }}
              >
                Harga yang jelas
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
                Mulai gratis, naik kalau siap
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Tidak ada biaya tersembunyi. Batalkan kapan saja.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <PricingCard
                key={i}
                {...plan}
                index={i}
                onCta={() => navigate("/register")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-20">
        <Reveal direction="scale">
          <div
            className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center top, rgba(139,92,246,0.15) 0%, transparent 60%)",
              }}
            />
            {/* Decorative circles */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  color: "#a78bfa",
                }}
              >
                <Zap className="w-3 h-3" />
                Bergabung sekarang
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Siap menggambar sesuatu?
              </h2>
              <p
                className="text-base mb-8"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Bergabung dengan ribuan kreator dan tim yang menggunakan
                Inkboard.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                  color: "white",
                  boxShadow: "0 8px 30px rgba(139,92,246,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "scale(1.05) translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 15px 50px rgba(139,92,246,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(139,92,246,0.4)";
                }}
              >
                Buat akun gratis
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-10 text-center text-xs"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
          >
            <PenTool className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-black text-white/30 text-sm">Inkboard</span>
        </div>
        <div className="flex items-center justify-center gap-6 mb-3">
          {["Privasi", "Ketentuan", "Kontak"].map((item) => (
            <a
              key={item}
              href="#"
              className="hover:text-white/50 transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {item}
            </a>
          ))}
        </div>
        <p>© {new Date().getFullYear()} Inkboard. Hak cipta dilindungi.</p>
      </footer>

      <style>{`
        @keyframes hero-fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        html { scroll-behavior: smooth; }
        * { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #07070f; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
      `}</style>
    </div>
  );
}
