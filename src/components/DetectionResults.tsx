/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { Detection } from '../detection/types';

interface DetectionResultsProps {
  detections: Detection[];
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  confidenceThreshold: number;
  isProcessing: boolean;
}

export const DetectionResults: React.FC<DetectionResultsProps> = ({
  detections,
  selectedDetectionId,
  onSelectDetection,
  confidenceThreshold,
  isProcessing,
}) => {
  return (
    <div className="bg-[#121826] border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/50">
        <h3 className="text-base font-semibold text-white">Detection Results</h3>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50 tabular-nums">
          {detections.length} Total
        </span>
      </div>

      {/* Detections List Area */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 max-h-[520px]">
        {/* State: Processing / Loading */}
        {isProcessing && detections.length === 0 && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse flex items-center justify-between p-3.5"
              >
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-slate-700/60 rounded" />
                  <div className="w-32 h-3 bg-slate-800 rounded" />
                  <div className="w-40 h-3 bg-slate-800 rounded" />
                </div>
                <div className="w-14 h-14 bg-slate-700/40 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* State: Empty (No detections above threshold) */}
        {!isProcessing && detections.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 border border-dashed border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500">
              <AlertCircle className="w-5 h-5 text-amber-500/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                No objects above threshold
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                No detections scored &ge; {confidenceThreshold.toFixed(2)}. Lower the
                confidence slider to view weaker detections.
              </p>
            </div>
          </div>
        )}

        {/* Detection Cards */}
        {detections.map((det) => {
          const isSelected = selectedDetectionId === det.id;
          const [x1, y1, x2, y2] = det.bounding_box;

          return (
            <div
              key={det.id}
              onClick={() => onSelectDetection(isSelected ? null : det.id)}
              onMouseEnter={() => onSelectDetection(det.id)}
              onMouseLeave={() => onSelectDetection(null)}
              role="button"
              tabIndex={0}
              className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-blue-400/80 bg-slate-800/90 shadow-lg shadow-blue-500/10'
                  : 'bg-[#151c2d]/70 hover:bg-[#182136] border-slate-800 hover:border-slate-700'
              }`}
              style={{
                borderColor: isSelected ? det.color : undefined,
                boxShadow: isSelected ? `0 0 16px -2px ${det.color}30` : undefined,
              }}
            >
              {/* Left Info: Class name, confidence, bounding box */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: det.color }}
                  />
                  <span className="text-sm font-bold text-white capitalize truncate">
                    {det.class_name}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <span>Confidence:</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {det.confidence.toFixed(2)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  Box: [{x1}, {y1}, {x2}, {y2}]
                </div>
              </div>

              {/* Right Thumbnail Crop */}
              <div className="shrink-0">
                {det.thumbnailUrl ? (
                  <img
                    src={det.thumbnailUrl}
                    alt={det.class_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-slate-700/60 group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center border border-slate-700/60"
                    style={{ backgroundColor: `${det.color}22` }}
                  >
                    <Target className="w-5 h-5" style={{ color: det.color }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
