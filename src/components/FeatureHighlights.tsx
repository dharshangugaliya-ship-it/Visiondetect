/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, Disc, ShieldCheck, Sliders } from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Fast & Efficient',
      description: 'Powered by YOLO for real-time object detection and low latency.',
    },
    {
      icon: Disc,
      title: 'Multiple Input Sources',
      description: 'Supports images, videos, and live webcam streams.',
    },
    {
      icon: ShieldCheck,
      title: 'Accurate Detection',
      description: 'Provides class labels, bounding boxes and confidence scores.',
    },
    {
      icon: Sliders,
      title: 'Customizable',
      description: 'Adjust confidence threshold and visualization settings.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      {features.map((feat, idx) => {
        const Icon = feat.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#121826] border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-blue-400">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{feat.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {feat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
