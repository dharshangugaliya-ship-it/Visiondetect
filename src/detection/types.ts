/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InputMode = 'image' | 'video' | 'webcam';

export interface Detection {
  id: string;
  class_id: number;
  class_name: string;
  confidence: number;
  bounding_box: [number, number, number, number]; // [x1, y1, x2, y2]
  color: string;
  thumbnailUrl?: string;
}

export interface PerformanceMetrics {
  fps: number;
  latencyMs: number;
  resolution: {
    width: number;
    height: number;
  };
}

export interface MediaMeta {
  name: string;
  dimensions: string;
  size?: string;
  type?: string;
}
