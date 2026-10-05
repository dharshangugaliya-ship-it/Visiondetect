/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { SearchResultSummary } from '../detection/types';

interface OpenVocabularySearchProps {
  onSearch: (target: string) => void;
  isSearching: boolean;
  searchSummary: SearchResultSummary;
  activeTarget: string;
  showAllObjects: boolean;
  onToggleShowAll: (showAll: boolean) => void;
}

export const OpenVocabularySearch: React.FC<OpenVocabularySearchProps> = ({
  onSearch,
  isSearching,
  searchSummary,
  activeTarget,
  showAllObjects,
  onToggleShowAll,
}) => {
  const [inputValue, setInputValue] = useState<string>(activeTarget || 'car');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onSearch(suggestion);
  };

  const suggestions = [
    'fire extinguisher',
    'car',
    'person',
    'bicycle',
    'bus',
    'laptop',
    'backpack',
    'helmet',
  ];

  return (
    <div className="p-5 rounded-2xl bg-[#121826] border border-blue-500/30 shadow-lg shadow-blue-900/10 space-y-4">
      {/* Header and Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              What do you want to detect?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Users can enter any object they want to find, and the VisionDetect system
            uses open-vocabulary detection to locate matching objects within images or video.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onToggleShowAll(false)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              !showAllObjects
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Target Only
          </button>
          <button
            type="button"
            onClick={() => onToggleShowAll(true)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              showAllObjects
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Detect All
          </button>
        </div>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type anything..."
            aria-label="Target object to detect"
            className="w-full pl-10 pr-4 py-3 bg-[#0b0f19] border border-slate-700/80 hover:border-slate-600 focus:border-blue-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSearching || !inputValue.trim()}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>DETECTING...</span>
            </>
          ) : (
            <>
              <span>DETECT</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Suggestions:</span>
        </span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              activeTarget.toLowerCase() === suggestion.toLowerCase()
                ? 'bg-blue-600/30 border-blue-400 text-blue-200 font-medium'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Target Search Match Result Banner */}
      {searchSummary.status !== 'idle' && (
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
            searchSummary.status === 'found'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {searchSummary.status === 'found' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span>Target: "{searchSummary.target}"</span>
                <span className="text-slate-400">→</span>
                {searchSummary.status === 'found' ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ {searchSummary.matchesFound} {searchSummary.matchesFound === 1 ? 'match' : 'matches'} found
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium">
                    No matching objects detected.
                  </span>
                )}
              </div>
              {searchSummary.status === 'not_found' && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try another search query or adjust the confidence threshold slider below.
                </p>
              )}
            </div>
          </div>

          {searchSummary.status === 'found' && (
            <div className="flex items-center gap-3 text-xs self-start sm:self-auto font-mono">
              <span className="bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-300">
                Found: <strong className="font-bold">{searchSummary.matchesFound}</strong>
              </span>
              {searchSummary.confidence && (
                <span className="bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-300">
                  Confidence: <strong className="font-bold">{Math.round(searchSummary.confidence * 100)}%</strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
