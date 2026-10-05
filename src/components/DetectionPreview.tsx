/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Download, Trash2, Image as ImageIcon, Loader2, Play, Pause, VideoOff, RefreshCw } from 'lucide-react';
import { Detection, InputMode, MediaMeta, PerformanceMetrics } from '../detection/types';
import { drawDetections } from '../detection/visualization';
import { SampleMedia, SAMPLE_MEDIA } from '../detection/sampleData';

interface DetectionPreviewProps {
  inputMode: InputMode;
  currentMedia: SampleMedia | null;
  uploadedImageUrl: string | null;
  uploadedVideoUrl: string | null;
  mediaMeta: MediaMeta;
  filteredDetections: Detection[];
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  isProcessing: boolean;
  metrics: PerformanceMetrics;
  onClear: () => void;
  onSelectSample: (sample: SampleMedia) => void;
  webcamActive: boolean;
  webcamError: string | null;
  onRestartWebcam: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  isVideoPlaying: boolean;
  onTogglePlayVideo: () => void;
  activeTarget?: string;
}

export const DetectionPreview: React.FC<DetectionPreviewProps> = ({
  inputMode,
  currentMedia,
  uploadedImageUrl,
  uploadedVideoUrl,
  mediaMeta,
  filteredDetections,
  selectedDetectionId,
  onSelectDetection,
  isProcessing,
  metrics,
  onClear,
  onSelectSample,
  webcamActive,
  webcamError,
  onRestartWebcam,
  videoRef,
  canvasRef,
  imageRef,
  isVideoPlaying,
  onTogglePlayVideo,
  activeTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Redraw canvas whenever filtered detections or selection changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If in image mode and image is loaded, draw image then boxes
    if (inputMode === 'image' && imageRef.current && imageRef.current.complete) {
      canvas.width = imageRef.current.naturalWidth || 1920;
      canvas.height = imageRef.current.naturalHeight || 1080;
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      drawDetections(ctx, filteredDetections, selectedDetectionId);
    } else if (inputMode === 'video' || inputMode === 'webcam') {
      // In video/webcam mode, bounding boxes are drawn on top of the video feed
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        drawDetections(ctx, filteredDetections, selectedDetectionId);
      }
    }
  }, [inputMode, filteredDetections, selectedDetectionId, currentMedia, uploadedImageUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary export canvas if in video/webcam mode to combine video frame + boxes
    if (inputMode === 'video' || inputMode === 'webcam') {
      const video = videoRef.current;
      if (!video) return;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = video.videoWidth || 1280;
      exportCanvas.height = video.videoHeight || 720;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return;

      exportCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
      drawDetections(exportCtx, filteredDetections, selectedDetectionId);

      const link = document.createElement('a');
      link.download = `detection-capture-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
      return;
    }

    // Image mode download
    const link = document.createElement('a');
    link.download = `detection-${mediaMeta.name || 'preview'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isEmpty = !uploadedImageUrl && !currentMedia && !uploadedVideoUrl && !webcamActive;

  return (
    <div className="bg-[#121826] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/50">
        <h3 className="text-base font-semibold text-white">Detection Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Preset Samples Selector Bar (For Image Mode) */}
      {inputMode === 'image' && (
        <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 shrink-0">Sample Presets:</span>
          {SAMPLE_MEDIA.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                currentMedia?.id === sample.id && !uploadedImageUrl
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {sample.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative mt-2 w-full aspect-video bg-[#0b0f19] rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group"
      >
        {/* State: Empty */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">No media loaded</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select an image, video, or enable webcam from the controls above to start object detection.
              </p>
            </div>
          </div>
        )}

        {/* State: Image Input */}
        {inputMode === 'image' && (uploadedImageUrl || currentMedia?.url) && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              ref={imageRef}
              src={uploadedImageUrl || currentMedia?.url}
              alt="Input Feed"
              crossOrigin="anonymous"
              className="hidden"
              onLoad={() => {
                if (canvasRef.current && imageRef.current) {
                  canvasRef.current.width = imageRef.current.naturalWidth || 1920;
                  canvasRef.current.height = imageRef.current.naturalHeight || 1080;
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(imageRef.current, 0, 0);
                    drawDetections(ctx, filteredDetections, selectedDetectionId);
                  }
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain cursor-crosshair"
            />
          </div>
        )}

        {/* State: Video Input */}
        {inputMode === 'video' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={uploadedVideoUrl || undefined}
              playsInline
              loop
              muted
              className="max-w-full max-h-full object-contain"
            />
            {/* Overlay bounding box canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Video Play/Pause Overlay Control */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={onTogglePlayVideo}
                className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition-colors"
                title={isVideoPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        )}

        {/* State: Webcam Input */}
        {inputMode === 'webcam' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {webcamError ? (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <VideoOff className="w-8 h-8 text-rose-400" />
                <p className="text-sm font-semibold text-rose-300">{webcamError}</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Please enable camera permission in your browser or click retry below.
                </p>
                <button
                  onClick={onRestartWebcam}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-w-full max-h-full object-contain scale-x-[-1]"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-x-[-1]"
                />
              </>
            )}
          </div>
        )}

        {/* Floating Model & Performance Glass Overlay on Bottom Left */}
        {!isEmpty && (
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 shadow-2xl text-left pointer-events-none select-none z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Loader2 className={`w-3.5 h-3.5 text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
              <span className="text-xs font-medium text-slate-200">
                {isProcessing ? 'Analyzing Frame...' : 'VisionDetect Active'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Mode:</span>
              <span className="font-semibold text-white bg-blue-600/30 px-1.5 py-0.5 rounded border border-blue-500/40 text-[10px]">
                Open-Vocabulary
              </span>
            </div>
            {activeTarget && (
              <div className="text-[11px] text-slate-300 truncate max-w-[180px]">
                Target: <span className="text-blue-300 font-semibold">"{activeTarget}"</span>
              </div>
            )}
            <div className="text-[10px] font-mono text-slate-400 tabular-nums">
              FPS: <span className="text-emerald-400 font-semibold">{metrics.fps}</span> · Latency: <span className="text-sky-400 font-semibold">{metrics.latencyMs}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {mediaMeta.name || 'Sample Stream'}
            </p>
            <p className="text-[11px] text-slate-500">
              {mediaMeta.dimensions} {mediaMeta.size ? `• ${mediaMeta.size}` : ''}
            </p>
          </div>
        </div>

        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            filteredDetections.length > 0
              ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800/70 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${filteredDetections.length > 0 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>
              {activeTarget
                ? `${filteredDetections.length} ${filteredDetections.length === 1 ? 'match' : 'matches'} for "${activeTarget}"`
                : `${filteredDetections.length} objects detected`}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
