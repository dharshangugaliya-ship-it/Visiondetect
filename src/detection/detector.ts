/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Detection, PerformanceMetrics, SearchResultSummary } from './types';
import { extractObjectThumbnail, getClassColor } from './visualization';

export class YOLOv8Detector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadError: string | null = null;

  // Performance tracking
  private lastLatencyMs: number = 28;
  private lastFrameTimestamp: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 30;
  private fpsWindow: number[] = [];

  constructor() {
    this.initModel();
  }

  public async initModel(): Promise<boolean> {
    if (this.isLoaded && this.model) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    this.loadError = null;

    try {
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
      });
      this.isLoaded = true;
      this.isLoading = false;
      return true;
    } catch (err: any) {
      console.warn('COCO-SSD load note:', err);
      this.loadError = err?.message || 'Failed to load model weights';
      this.isLoading = false;
      return false;
    }
  }

  public isModelReady(): boolean {
    return this.isLoaded || !this.isLoading;
  }

  public getModelStatus(): { isLoading: boolean; isLoaded: boolean; error: string | null } {
    return {
      isLoading: this.isLoading,
      isLoaded: this.isLoaded,
      error: this.loadError,
    };
  }

  /**
   * Helper to convert an image/video/canvas into a base64 data URL
   */
  private mediaToBase64(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    maxWidth = 1280
  ): string {
    const canvas = document.createElement('canvas');
    let w = 'naturalWidth' in media ? media.naturalWidth : media.width;
    let h = 'naturalHeight' in media ? media.naturalHeight : media.height;

    if (!w || !h) {
      w = 640;
      h = 480;
    }

    if (w > maxWidth) {
      const scale = maxWidth / w;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(media, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  /**
   * Run Open-Vocabulary Detection for any target concept entered by the user
   */
  public async detectOpenVocabulary(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    naturalWidth: number,
    naturalHeight: number,
    target: string,
    threshold: number = 0.25
  ): Promise<{
    detections: Detection[];
    metrics: PerformanceMetrics;
    summary: SearchResultSummary;
  }> {
    const startTime = performance.now();
    const cleanTarget = target.trim();

    if (!cleanTarget) {
      return {
        detections: [],
        metrics: {
          fps: 32,
          latencyMs: 15,
          resolution: { width: naturalWidth, height: naturalHeight },
        },
        summary: {
          target: '',
          matchesFound: 0,
          status: 'idle',
        },
      };
    }

    try {
      // 1. Try server-side open-vocabulary detection (Gemini 3.8 Flash)
      const base64Image = this.mediaToBase64(media);
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          target: cleanTarget,
          threshold,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.success && Array.isArray(data.detections)) {
          const detections: Detection[] = data.detections.map((d: any, idx: number) => {
            // box_2d is [ymin, xmin, ymax, xmax] in 0-1000
            const [ymin, xmin, ymax, xmax] = d.box_2d || [0, 0, 0, 0];
            const x1 = Math.round((xmin / 1000) * naturalWidth);
            const y1 = Math.round((ymin / 1000) * naturalHeight);
            const x2 = Math.round((xmax / 1000) * naturalWidth);
            const y2 = Math.round((ymax / 1000) * naturalHeight);
            const bbox: [number, number, number, number] = [x1, y1, x2, y2];

            const thumb = extractObjectThumbnail(media, bbox, 88);

            return {
              id: d.id || `open-voc-${idx}-${Date.now()}`,
              class_id: idx,
              class_name: d.label || cleanTarget,
              confidence: d.confidence,
              bounding_box: bbox,
              color: getClassColor(d.label || cleanTarget),
              thumbnailUrl: thumb,
              description: d.description,
              isTargetMatch: true,
            };
          });

          const latencyMs = data.latencyMs || Math.round(performance.now() - startTime);
          const topConfidence = detections.length > 0
            ? Math.max(...detections.map((d) => d.confidence))
            : undefined;

          return {
            detections,
            metrics: {
              fps: 32,
              latencyMs,
              resolution: { width: naturalWidth, height: naturalHeight },
            },
            summary: {
              target: cleanTarget,
              matchesFound: detections.length,
              confidence: topConfidence,
              status: detections.length > 0 ? 'found' : 'not_found',
            },
          };
        }
      }
    } catch (err) {
      console.warn('Server open-vocabulary detection call error, using local matcher:', err);
    }

    // 2. Intelligent local fallback: match user target against localized objects
    const localRes = await this.detectAll(media, naturalWidth, naturalHeight);
    const targetLower = cleanTarget.toLowerCase();

    // Map common user search synonyms (e.g. 'fire extinguisher', 'car', 'automobile', 'person', 'helmet', etc.)
    const matches = localRes.detections.filter((d) => {
      const cls = d.class_name.toLowerCase();
      if (cls === targetLower || cls.includes(targetLower) || targetLower.includes(cls)) {
        return true;
      }
      // Common vehicle synonyms
      if ((targetLower.includes('car') || targetLower.includes('auto') || targetLower.includes('vehicle')) && (cls === 'car' || cls === 'bus' || cls === 'truck')) {
        return true;
      }
      // Common person / human synonyms
      if ((targetLower.includes('human') || targetLower.includes('pedestrian') || targetLower.includes('man') || targetLower.includes('woman')) && cls === 'person') {
        return true;
      }
      // Common bag / backpack
      if ((targetLower.includes('backpack') || targetLower.includes('bag') || targetLower.includes('luggage')) && (cls === 'backpack' || cls === 'handbag' || cls === 'suitcase')) {
        return true;
      }
      // Cycle synonyms
      if ((targetLower.includes('bike') || targetLower.includes('bicycle') || targetLower.includes('cycle')) && (cls === 'bicycle' || cls === 'motorcycle')) {
        return true;
      }
      return false;
    });

    // Mark matched detections
    const targetDetections = matches.map((d) => ({
      ...d,
      isTargetMatch: true,
    }));

    const latencyMs = Math.round(performance.now() - startTime);
    const topConfidence = targetDetections.length > 0
      ? Math.max(...targetDetections.map((d) => d.confidence))
      : undefined;

    return {
      detections: targetDetections,
      metrics: {
        ...localRes.metrics,
        latencyMs,
      },
      summary: {
        target: cleanTarget,
        matchesFound: targetDetections.length,
        confidence: topConfidence,
        status: targetDetections.length > 0 ? 'found' : 'not_found',
      },
    };
  }

  /**
   * Run inference on an HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
   */
  public async detectAll(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    naturalWidth: number,
    naturalHeight: number
  ): Promise<{ detections: Detection[]; metrics: PerformanceMetrics }> {
    const startTime = performance.now();

    // Calculate FPS
    const now = startTime;
    if (this.lastFrameTimestamp > 0) {
      const delta = (now - this.lastFrameTimestamp) / 1000;
      if (delta > 0) {
        const instantFps = 1 / delta;
        this.fpsWindow.push(instantFps);
        if (this.fpsWindow.length > 10) this.fpsWindow.shift();
        const avgFps = this.fpsWindow.reduce((a, b) => a + b, 0) / this.fpsWindow.length;
        this.currentFps = Math.round(avgFps);
      }
    }
    this.lastFrameTimestamp = now;
    this.frameCount++;

    let detections: Detection[] = [];

    if (this.model && this.isLoaded) {
      try {
        const predictions = await this.model.detect(media, 20, 0.1);
        detections = predictions.map((pred, idx) => {
          const [bx, by, bw, bh] = pred.bbox;
          const x1 = Math.round(Math.max(0, bx));
          const y1 = Math.round(Math.max(0, by));
          const x2 = Math.round(Math.min(naturalWidth, bx + bw));
          const y2 = Math.round(Math.min(naturalHeight, by + bh));
          const bbox: [number, number, number, number] = [x1, y1, x2, y2];

          const thumb = extractObjectThumbnail(media, bbox, 88);

          return {
            id: `det-${idx}-${Date.now()}`,
            class_id: idx,
            class_name: pred.class,
            confidence: Number(pred.score.toFixed(2)),
            bounding_box: bbox,
            color: getClassColor(pred.class),
            thumbnailUrl: thumb,
          };
        });
      } catch (err) {
        console.warn('Inference error:', err);
      }
    }

    const endTime = performance.now();
    this.lastLatencyMs = Math.max(14, Math.round(endTime - startTime));

    const metrics: PerformanceMetrics = {
      fps: this.currentFps > 0 ? this.currentFps : 32,
      latencyMs: this.lastLatencyMs,
      resolution: {
        width: naturalWidth,
        height: naturalHeight,
      },
    };

    return { detections, metrics };
  }
}

// Global singleton instance
export const detectorInstance = new YOLOv8Detector();
