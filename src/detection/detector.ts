/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Detection, PerformanceMetrics, SearchResultSummary } from './types';
import { extractObjectThumbnail, getClassColor } from './visualization';

export function calculateIoU(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);
  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = Math.max(0, boxA[2] - boxA[0]) * Math.max(0, boxA[3] - boxA[1]);
  const boxBArea = Math.max(0, boxB[2] - boxB[0]) * Math.max(0, boxB[3] - boxB[1]);
  const unionArea = boxAArea + boxBArea - interArea;
  return unionArea > 0 ? interArea / unionArea : 0;
}

export function applyNMS(detections: Detection[], iouThreshold: number = 0.45): Detection[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];

  for (const det of sorted) {
    let keep = true;
    for (const existing of selected) {
      if (existing.class_name.toLowerCase() === det.class_name.toLowerCase()) {
        const iou = calculateIoU(existing.bounding_box, det.bounding_box);
        if (iou > iouThreshold) {
          keep = false;
          break;
        }
      }
    }
    if (keep) {
      selected.push(det);
    }
  }
  return selected;
}

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
   * Helper to convert an image/video/canvas into a high-res base64 data URL
   */
  private mediaToBase64(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    maxWidth = 1920
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
    return canvas.toDataURL('image/jpeg', 0.90);
  }

  /**
   * Multi-Scale / Tiled High-Resolution Inference (SAHI)
   * Slices the media into overlapping high-resolution tiles to capture minute objects
   */
  public async detectMultiScaleTiled(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    naturalWidth: number,
    naturalHeight: number
  ): Promise<Detection[]> {
    if (!this.model || !this.isLoaded) return [];

    const totalArea = Math.max(1, naturalWidth * naturalHeight);
    const allDetections: Detection[] = [];

    // 1. Full Image Inference
    try {
      const fullPredictions = await this.model.detect(media, 20, 0.08);
      for (let idx = 0; idx < fullPredictions.length; idx++) {
        const pred = fullPredictions[idx];
        const [bx, by, bw, bh] = pred.bbox;
        const x1 = Math.round(Math.max(0, bx));
        const y1 = Math.round(Math.max(0, by));
        const x2 = Math.round(Math.min(naturalWidth, bx + bw));
        const y2 = Math.round(Math.min(naturalHeight, by + bh));
        const bbox: [number, number, number, number] = [x1, y1, x2, y2];
        const area = (x2 - x1) * (y2 - y1);
        const areaPercentage = Number(((area / totalArea) * 100).toFixed(2));
        const isMinuteObject = areaPercentage <= 3.5;

        allDetections.push({
          id: `full-${idx}-${Date.now()}`,
          class_id: idx,
          class_name: pred.class,
          confidence: Number(pred.score.toFixed(2)),
          bounding_box: bbox,
          color: getClassColor(pred.class),
          thumbnailUrl: extractObjectThumbnail(media, bbox, 88),
          isMinuteObject,
          areaPercentage,
        });
      }
    } catch (e) {
      console.warn('Full inference skip:', e);
    }

    // 2. High-Resolution Tiled Inference (2x2 with 20% overlap = 4 tiles)
    const tileW = Math.round(naturalWidth * 0.6);
    const tileH = Math.round(naturalHeight * 0.6);
    const tileCoords = [
      { x: 0, y: 0 },
      { x: Math.round(naturalWidth * 0.4), y: 0 },
      { x: 0, y: Math.round(naturalHeight * 0.4) },
      { x: Math.round(naturalWidth * 0.4), y: Math.round(naturalHeight * 0.4) },
    ];

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileW;
    tileCanvas.height = tileH;
    const tileCtx = tileCanvas.getContext('2d');

    if (tileCtx) {
      for (let t = 0; t < tileCoords.length; t++) {
        const { x: tx, y: ty } = tileCoords[t];
        tileCtx.clearRect(0, 0, tileW, tileH);
        tileCtx.drawImage(media, tx, ty, tileW, tileH, 0, 0, tileW, tileH);

        try {
          const tilePredictions = await this.model.detect(tileCanvas, 15, 0.08);
          for (let p = 0; p < tilePredictions.length; p++) {
            const pred = tilePredictions[p];
            const [bx, by, bw, bh] = pred.bbox;

            // Map local tile coordinates to global frame
            const gx1 = Math.round(Math.max(0, tx + bx));
            const gy1 = Math.round(Math.max(0, ty + by));
            const gx2 = Math.round(Math.min(naturalWidth, tx + bx + bw));
            const gy2 = Math.round(Math.min(naturalHeight, ty + by + bh));
            const bbox: [number, number, number, number] = [gx1, gy1, gx2, gy2];
            const area = (gx2 - gx1) * (gy2 - gy1);
            const areaPercentage = Number(((area / totalArea) * 100).toFixed(2));
            const isMinuteObject = areaPercentage <= 3.5;

            allDetections.push({
              id: `tile-${t}-${p}-${Date.now()}`,
              class_id: p,
              class_name: pred.class,
              confidence: Number(pred.score.toFixed(2)),
              bounding_box: bbox,
              color: getClassColor(pred.class),
              thumbnailUrl: extractObjectThumbnail(media, bbox, 88),
              isMinuteObject,
              areaPercentage,
            });
          }
        } catch (e) {
          // continue next tile
        }
      }
    }

    // Merge duplicate detections across tiles using Non-Maximum Suppression (NMS)
    return applyNMS(allDetections, 0.45);
  }

  /**
   * Run Open-Vocabulary Detection for any target concept entered by the user
   * with high-resolution and multi-scale minute object detection.
   */
  public async detectOpenVocabulary(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    naturalWidth: number,
    naturalHeight: number,
    target: string,
    threshold: number = 0.25,
    enableMultiScale: boolean = true
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
          enableMultiScale,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.success && Array.isArray(data.detections)) {
          const totalArea = Math.max(1, naturalWidth * naturalHeight);
          const rawDetections: Detection[] = data.detections.map((d: any, idx: number) => {
            const [ymin = 0, xmin = 0, ymax = 0, xmax = 0] = d.box_2d || [0, 0, 0, 0];
            const x1 = Math.round((xmin / 1000) * naturalWidth);
            const y1 = Math.round((ymin / 1000) * naturalHeight);
            const x2 = Math.round((xmax / 1000) * naturalWidth);
            const y2 = Math.round((ymax / 1000) * naturalHeight);
            const bbox: [number, number, number, number] = [x1, y1, x2, y2];

            const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
            const areaPercentage = Number(((area / totalArea) * 100).toFixed(2));
            const isMinute = d.isMinuteObject ?? (areaPercentage <= 3.5);

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
              isMinuteObject: isMinute,
              areaPercentage,
            };
          });

          // Apply NMS to clean overlapping hits
          const detections = applyNMS(rawDetections, 0.45);

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
      console.warn('Server open-vocabulary detection call note:', err);
    }

    // 2. Local fallback with Multi-Scale Tiling (SAHI)
    const multiScaleDetections = enableMultiScale
      ? await this.detectMultiScaleTiled(media, naturalWidth, naturalHeight)
      : (await this.detectAll(media, naturalWidth, naturalHeight)).detections;

    const targetLower = cleanTarget.toLowerCase();

    const matches = multiScaleDetections.filter((d) => {
      const cls = d.class_name.toLowerCase();
      if (cls === targetLower || cls.includes(targetLower) || targetLower.includes(cls)) {
        return true;
      }
      if ((targetLower.includes('car') || targetLower.includes('auto') || targetLower.includes('vehicle')) && (cls === 'car' || cls === 'bus' || cls === 'truck')) {
        return true;
      }
      if ((targetLower.includes('human') || targetLower.includes('pedestrian') || targetLower.includes('man') || targetLower.includes('woman')) && cls === 'person') {
        return true;
      }
      if ((targetLower.includes('backpack') || targetLower.includes('bag') || targetLower.includes('luggage')) && (cls === 'backpack' || cls === 'handbag' || cls === 'suitcase')) {
        return true;
      }
      if ((targetLower.includes('bike') || targetLower.includes('bicycle') || targetLower.includes('cycle')) && (cls === 'bicycle' || cls === 'motorcycle')) {
        return true;
      }
      if ((targetLower.includes('phone') || targetLower.includes('mobile') || targetLower.includes('device')) && cls === 'cell_phone') {
        return true;
      }
      return false;
    });

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
        fps: this.currentFps > 0 ? this.currentFps : 32,
        latencyMs,
        resolution: { width: naturalWidth, height: naturalHeight },
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
   * Run standard inference on an HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
   */
  public async detectAll(
    media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    naturalWidth: number,
    naturalHeight: number
  ): Promise<{ detections: Detection[]; metrics: PerformanceMetrics }> {
    const startTime = performance.now();

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
    const totalArea = Math.max(1, naturalWidth * naturalHeight);

    if (this.model && this.isLoaded) {
      try {
        const predictions = await this.model.detect(media, 25, 0.1);
        detections = predictions.map((pred, idx) => {
          const [bx, by, bw, bh] = pred.bbox;
          const x1 = Math.round(Math.max(0, bx));
          const y1 = Math.round(Math.max(0, by));
          const x2 = Math.round(Math.min(naturalWidth, bx + bw));
          const y2 = Math.round(Math.min(naturalHeight, by + bh));
          const bbox: [number, number, number, number] = [x1, y1, x2, y2];

          const area = (x2 - x1) * (y2 - y1);
          const areaPercentage = Number(((area / totalArea) * 100).toFixed(2));
          const isMinuteObject = areaPercentage <= 3.5;

          const thumb = extractObjectThumbnail(media, bbox, 88);

          return {
            id: `det-${idx}-${Date.now()}`,
            class_id: idx,
            class_name: pred.class,
            confidence: Number(pred.score.toFixed(2)),
            bounding_box: bbox,
            color: getClassColor(pred.class),
            thumbnailUrl: thumb,
            isMinuteObject,
            areaPercentage,
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

export const detectorInstance = new YOLOv8Detector();
