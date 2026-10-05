/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Image as ImageIcon, Video, Camera, Eye } from 'lucide-react';
import { InputMode } from '../detection/types';

interface SidebarProps {
  currentTab: 'home' | InputMode;
  onSelectTab: (tab: 'home' | InputMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'image' as const, label: 'Images', icon: ImageIcon },
    { id: 'video' as const, label: 'Videos', icon: Video },
    { id: 'webcam' as const, label: 'Webcam', icon: Camera },
  ];

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-[#0d121f] border-r border-slate-800/60 flex flex-col justify-between p-5 select-none z-20">
      <div className="space-y-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-[1.5px] shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            VisionDetect
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/40 via-indigo-600/30 to-purple-600/20 text-white font-semibold border border-blue-500/40 shadow-sm shadow-blue-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-slate-800/50 space-y-1 text-xs text-slate-500">
        <p className="font-medium text-slate-400">YOLO + OpenCV</p>
        <p className="text-[11px] text-slate-500">Object Detection System</p>
        <p className="text-[10px] text-slate-600 pt-2 flex items-center gap-1">
          Built with <span className="text-rose-500">❤️</span> in AI Studio
        </p>
      </div>
    </aside>
  );
};
