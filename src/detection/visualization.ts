/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Detection } from './types';

// Color map for common COCO / YOLO classes matching the reference UI
export const CLASS_COLORS: Record<string, string> = {
  person: '#22c55e', // Green
  car: '#3b82f6',    // Blue
  bus: '#f59e0b',    // Orange/Amber
  bicycle: '#a855f7', // Purple/Magenta
  motorcycle: '#06b6d4', // Cyan
  truck: '#0ea5e9',
  traffic_light: '#ef4444',
  dog: '#ec4899',
  cat: '#f43f5e',
  backpack: '#8b5cf6',
  cell_phone: '#10b981',
  laptop: '#6366f1',
  chair: '#14b8a6',
};

export function getClassColor(className: string): string {
  const normalized = className.toLowerCase().replace(/\s+/g, '_');
  if (CLASS_COLORS[normalized]) {
    return CLASS_COLORS[normalized];
  }
  // Deterministic fallback color from class name string
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [210, 142, 38, 271, 187, 330, 48, 168];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 85%, 60%)`;
}

/**
 * Draws bounding boxes, class labels, and confidence scores onto an HTMLCanvasElement
 */
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  selectedId: string | null = null,
  renderOptions: {
    showLabels?: boolean;
    showScores?: boolean;
    boxLineWidth?: number;
  } = {}
) {
  const {
    showLabels = true,
    showScores = true,
    boxLineWidth = 2.5,
  } = renderOptions;

  for (const det of detections) {
    const [x1, y1, x2, y2] = det.bounding_box;
    const width = Math.max(1, x2 - x1);
    const height = Math.max(1, y2 - y1);
    const color = det.color || getClassColor(det.class_name);
    const isSelected = selectedId === det.id;

    ctx.save();

    // Subtle box fill
    ctx.fillStyle = isSelected ? `${color}33` : `${color}18`;
    ctx.fillRect(x1, y1, width, height);

    // Box stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? boxLineWidth + 1.5 : boxLineWidth;
    ctx.strokeRect(x1, y1, width, height);

    // Corner accents or highlight glow if selected
    if (isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x1, y1, width, height);
      ctx.shadowBlur = 0;
    }

    // Label and confidence badge
    if (showLabels) {
      const scoreText = showScores ? ` ${det.confidence.toFixed(2)}` : '';
      const labelText = `${det.class_name}${scoreText}`;

      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      const paddingX = 8;
      const paddingY = 4;
      const badgeWidth = textWidth + paddingX * 2;
      const badgeHeight = textHeight + paddingY * 2;

      // Position badge at top-left, clamped within canvas
      let badgeX = x1;
      let badgeY = y1 - badgeHeight;

      if (badgeY < 0) {
        badgeY = y1;
      }
      if (badgeX + badgeWidth > ctx.canvas.width) {
        badgeX = ctx.canvas.width - badgeWidth;
      }

      // Badge background
      ctx.fillStyle = color;
      ctx.beginPath();
      const radius = 4;
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX + paddingX, badgeY + badgeHeight / 2 + 1);
    }

    ctx.restore();
  }
}

/**
 * Extracts a cropped thumbnail data URL for a given bounding box from an image or video
 */
export function extractObjectThumbnail(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  bbox: [number, number, number, number],
  targetSize: number = 96
): string {
  try {
    const [x1, y1, x2, y2] = bbox;
    const sourceW = Math.max(1, x2 - x1);
    const sourceH = Math.max(1, y2 - y1);

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw with slight padding if possible
    const padX = sourceW * 0.05;
    const padY = sourceH * 0.05;
    const cropX = Math.max(0, x1 - padX);
    const cropY = Math.max(0, y1 - padY);
    const naturalW = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const naturalH = 'naturalHeight' in source ? source.naturalHeight : source.height;
    const cropW = Math.min(naturalW - cropX, sourceW + padX * 2);
    const cropH = Math.min(naturalH - cropY, sourceH + padY * 2);

    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, targetSize, targetSize);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('Failed to extract thumbnail', err);
    return '';
  }
}
