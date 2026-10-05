/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Image as ImageIcon, Video, Camera, Upload } from 'lucide-react';
import { InputMode } from '../detection/types';

interface InputSourceControlsProps {
  inputMode: InputMode;
  onSelectMode: (mode: InputMode) => void;
  confidenceThreshold: number;
  onThresholdChange: (threshold: number) => void;
  onImageUpload: (file: File) => void;
  onVideoUpload: (file: File) => void;
}

export const InputSourceControls: React.FC<InputSourceControlsProps> = ({
  inputMode,
  onSelectMode,
  confidenceThreshold,
  onThresholdChange,
  onImageUpload,
  onVideoUpload,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = (mode: InputMode) => {
    onSelectMode(mode);
    if (mode === 'image' && imageInputRef.current) {
      // Trigger file dialog if already in image mode or user wants to upload
      imageInputRef.current.click();
    } else if (mode === 'video' && videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoUpload(file);
      e.target.value = '';
    }
  };

  return (
    <section className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleVideoFileChange}
      />

      <h2 className="text-base font-semibold text-slate-200">
        Choose Input Source
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Image */}
        <div
          onClick={() => handleCardClick('image')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('image')}
          className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
            inputMode === 'image'
              ? 'bg-[#151c2d] border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
              : 'bg-[#121826] border-slate-800/80 hover:border-slate-700/80 hover:bg-[#161d2f]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                inputMode === 'image'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-300'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Image</span>
                <Upload className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Upload an image file</p>
            </div>
          </div>
        </div>

        {/* Card 2: Video */}
        <div
          onClick={() => handleCardClick('video')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('video')}
          className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
            inputMode === 'video'
              ? 'bg-[#151c2d] border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
              : 'bg-[#121826] border-slate-800/80 hover:border-slate-700/80 hover:bg-[#161d2f]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                inputMode === 'video'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-300'
              }`}
            >
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Video</span>
                <Upload className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Upload a video file</p>
            </div>
          </div>
        </div>

        {/* Card 3: Webcam */}
        <div
          onClick={() => onSelectMode('webcam')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectMode('webcam')}
          className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
            inputMode === 'webcam'
              ? 'bg-[#151c2d] border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
              : 'bg-[#121826] border-slate-800/80 hover:border-slate-700/80 hover:bg-[#161d2f]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                inputMode === 'webcam'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-300'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Webcam</span>
                {inputMode === 'webcam' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Use your camera</p>
            </div>
          </div>
        </div>

        {/* Card 4: Confidence Threshold */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Confidence Threshold
            </span>
            <span className="font-mono text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 tabular-nums">
              {confidenceThreshold.toFixed(2)}
            </span>
          </div>

          <div className="my-2.5">
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={confidenceThreshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              aria-label="Confidence Threshold"
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Filter out low confidence detections
          </p>
        </div>
      </div>
    </section>
  );
};
