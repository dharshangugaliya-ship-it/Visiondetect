/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, User } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-2 pb-6 border-b border-slate-800/40">
      {/* Top Right Header Actions */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <button
          type="button"
          title="AI Studio Mode"
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-400/80" />
        </button>
        <button
          type="button"
          title="User Account"
          className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-slate-300 transition-colors"
        >
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Content Grid */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Typography */}
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Computer Vision System
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Object Detection
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Detect and identify objects in images, videos, or live camera feeds using
            YOLO and OpenCV. Get class labels, bounding boxes, and confidence scores
            in real-time.
          </p>
        </div>

        {/* Right Column: High-Tech Cyber Eye Illustration */}
        <div className="relative shrink-0 flex items-center justify-center lg:justify-end pr-4">
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Eye Graphic SVG */}
            <svg
              className="w-full h-full text-blue-500 overflow-visible"
              viewBox="0 0 280 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="eyeOutlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="pupilGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.8" />
                </radialGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Dotted decorative matrix on the left */}
              <g opacity="0.4" fill="#60a5fa">
                {Array.from({ length: 4 }).map((_, r) =>
                  Array.from({ length: 12 }).map((_, c) => {
                    const cx = 30 + c * 9;
                    const cy = 35 + r * 18 + Math.sin(c * 0.4) * 8;
                    const radius = Math.max(0.8, 2.2 - (c * 0.12));
                    return <circle key={`${r}-${c}`} cx={cx} cy={cy} r={radius} />;
                  })
                )}
              </g>

              {/* Eye outer contours */}
              <path
                d="M 10 70 Q 140 -20 270 70 Q 140 160 10 70 Z"
                stroke="url(#eyeOutlineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />

              {/* Inner tech concentric arcs */}
              <path
                d="M 60 70 Q 140 15 220 70"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <path
                d="M 70 70 Q 140 120 210 70"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.5"
              />

              {/* Outer Iris Circle */}
              <circle
                cx="155"
                cy="70"
                r="38"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 3"
                opacity="0.75"
              />

              {/* Inner Glowing Pupil */}
              <circle
                cx="155"
                cy="70"
                r="28"
                fill="url(#pupilGlow)"
                filter="url(#glowFilter)"
              />
              <circle
                cx="145"
                cy="62"
                r="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <circle
                cx="155"
                cy="70"
                r="14"
                stroke="#93c5fd"
                strokeWidth="1.5"
                opacity="0.9"
              />

              {/* Tech tick marks */}
              <line x1="155" y1="28" x2="155" y2="22" stroke="#60a5fa" strokeWidth="2" />
              <line x1="155" y1="112" x2="155" y2="118" stroke="#60a5fa" strokeWidth="2" />
              <line x1="113" y1="70" x2="107" y2="70" stroke="#60a5fa" strokeWidth="2" />
              <line x1="197" y1="70" x2="203" y2="70" stroke="#60a5fa" strokeWidth="2" />
            </svg>

            {/* YOLO Badge Overlay on the eye graphic */}
            <div className="absolute right-3 bottom-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 text-white font-extrabold text-[13px] tracking-wide px-3 py-1 rounded-lg border border-blue-400/50 shadow-lg shadow-blue-500/30">
              YOLO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
