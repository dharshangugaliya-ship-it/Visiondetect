/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Detection, SearchResultSummary } from '../detection/types';

interface DetectionResultsProps {
  detections: Detection[];
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  confidenceThreshold: number;
  isProcessing: boolean;
  searchSummary?: SearchResultSummary;
}

export const DetectionResults: React.FC<DetectionResultsProps> = ({
  detections,
  selectedDetectionId,
  onSelectDetection,
  confidenceThreshold,
  isProcessing,
  searchSummary,
}) => {
  return (
    <div className="bg-[#121826] border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/50">
        <div>
          <h3 className="text-base font-semibold text-white">Detection Results</h3>
          {searchSummary && searchSummary.target && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Query: <span className="text-blue-300 font-semibold">"{searchSummary.target}"</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {searchSummary && searchSummary.status === 'found' && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
              ✓ {detections.length} Found
            </span>
          )}
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50 tabular-nums">
            {detections.length} Total
          </span>
        </div>
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

        {/* State: Target Query Not Found */}
        {!isProcessing && searchSummary?.status === 'not_found' && detections.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 border border-dashed border-amber-900/40 bg-amber-950/10 rounded-xl">
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Target: "{searchSummary.target}"
              </p>
              <p className="text-xs font-medium text-amber-400/90 mt-1">
                No matching objects detected.
              </p>
              <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                The open-vocabulary engine scanned the visual feed for this concept but found no instances above {confidenceThreshold.toFixed(2)} confidence.
              </p>
            </div>
          </div>
        )}

        {/* State: General Empty (No detections above threshold) */}
        {!isProcessing && searchSummary?.status !== 'not_found' && detections.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 border border-dashed border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500">
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                No objects above threshold
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                No detections scored &ge; {confidenceThreshold.toFixed(2)}. Enter a target in the search bar above or lower the threshold.
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
                  {det.isTargetMatch && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Target Match</span>
                    </span>
                  )}
                  {det.isMinuteObject && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-sky-950/90 text-sky-300 border border-sky-500/50 px-1.5 py-0.5 rounded">
                      <span>🔬 Minute ({det.areaPercentage !== undefined ? `${det.areaPercentage}%` : '<3%'})</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <span>Confidence:</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {det.confidence.toFixed(2)} ({Math.round(det.confidence * 100)}%)
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  Box: [{x1}, {y1}, {x2}, {y2}]
                </div>

                {det.description && (
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {det.description}
                  </p>
                )}
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
