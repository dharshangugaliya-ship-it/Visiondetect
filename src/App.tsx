/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { OpenVocabularySearch } from './components/OpenVocabularySearch';
import { InputSourceControls } from './components/InputSourceControls';
import { DetectionPreview } from './components/DetectionPreview';
import { DetectionResults } from './components/DetectionResults';
import { FeatureHighlights } from './components/FeatureHighlights';
import { Detection, InputMode, MediaMeta, PerformanceMetrics, SearchResultSummary } from './detection/types';
import { filterByConfidence } from './detection/confidenceFilter';
import { SAMPLE_MEDIA, SampleMedia } from './detection/sampleData';
import { detectorInstance } from './detection/detector';
import { extractObjectThumbnail } from './detection/visualization';

export default function App() {
  // Navigation & Mode
  const [currentTab, setCurrentTab] = useState<'home' | InputMode>('home');
  const [inputMode, setInputMode] = useState<InputMode>('image');

  // Open-Vocabulary Search State
  const [activeTarget, setActiveTarget] = useState<string>('car');
  const [showAllObjects, setShowAllObjects] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchSummary, setSearchSummary] = useState<SearchResultSummary>({
    target: 'car',
    matchesFound: 1,
    confidence: 0.88,
    status: 'found',
  });

  // Confidence Threshold (Default 0.25 matching reference UI)
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);

  // Active Media State
  const [currentMedia, setCurrentMedia] = useState<SampleMedia | null>(SAMPLE_MEDIA[0]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [mediaMeta, setMediaMeta] = useState<MediaMeta>({
    name: SAMPLE_MEDIA[0].name,
    dimensions: SAMPLE_MEDIA[0].dimensions,
    size: SAMPLE_MEDIA[0].size,
  });

  // Detection & Inference State
  const [rawDetections, setRawDetections] = useState<Detection[]>(
    SAMPLE_MEDIA[0].defaultDetections || []
  );
  const [allSceneDetections, setAllSceneDetections] = useState<Detection[]>(
    SAMPLE_MEDIA[0].defaultDetections || []
  );
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 32,
    latencyMs: 28,
    resolution: { width: 1920, height: 1080 },
  });

  // Video & Webcam Controls
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Active detections based on mode (Target Only vs Detect All)
  const activeDetectionsList = useMemo(() => {
    if (showAllObjects) {
      return allSceneDetections;
    }
    return rawDetections;
  }, [showAllObjects, allSceneDetections, rawDetections]);

  // Modular Confidence Filter: Output = Valid Detections where confidence >= threshold
  const filteredDetections = useMemo(() => {
    return filterByConfidence(activeDetectionsList, confidenceThreshold);
  }, [activeDetectionsList, confidenceThreshold]);

  // Handle switching tabs from Sidebar
  const handleSelectTab = (tab: 'home' | InputMode) => {
    setCurrentTab(tab);
    if (tab !== 'home') {
      handleSelectMode(tab);
    }
  };

  // Handle changing Input Mode
  const handleSelectMode = (mode: InputMode) => {
    setInputMode(mode);
    if (currentTab !== 'home') {
      setCurrentTab(mode);
    }

    if (mode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
  };

  // Open-Vocabulary Search Handler
  const handleOpenVocabSearch = useCallback(
    async (targetQuery: string) => {
      const cleanTarget = targetQuery.trim();
      if (!cleanTarget) return;

      setActiveTarget(cleanTarget);
      setIsSearching(true);
      setIsProcessing(true);

      const mediaElement =
        inputMode === 'image'
          ? imageRef.current
          : videoRef.current;

      if (!mediaElement) {
        setIsSearching(false);
        setIsProcessing(false);
        return;
      }

      const naturalW =
        'naturalWidth' in mediaElement
          ? mediaElement.naturalWidth
          : mediaElement.videoWidth || 1280;
      const naturalH =
        'naturalHeight' in mediaElement
          ? mediaElement.naturalHeight
          : mediaElement.videoHeight || 720;

      try {
        const result = await detectorInstance.detectOpenVocabulary(
          mediaElement,
          naturalW || 1920,
          naturalH || 1080,
          cleanTarget,
          confidenceThreshold
        );

        setRawDetections(result.detections);
        setSearchSummary(result.summary);
        setMetrics(result.metrics);

        // Keep allSceneDetections updated as well
        if (result.detections.length > 0) {
          setAllSceneDetections((prev) => {
            const combined = [...result.detections, ...prev.filter((d) => !result.detections.some((rd) => rd.id === d.id))];
            return combined;
          });
        }
      } catch (err) {
        console.warn('Error during open-vocabulary search:', err);
        setSearchSummary({
          target: cleanTarget,
          matchesFound: 0,
          status: 'not_found',
        });
      } finally {
        setIsSearching(false);
        setIsProcessing(false);
      }
    },
    [inputMode, confidenceThreshold]
  );

  // Process full image scene
  const processImageDetections = useCallback(
    async (img: HTMLImageElement, target?: string) => {
      setIsProcessing(true);
      const start = performance.now();

      try {
        const query = target || activeTarget;
        const openVocabRes = await detectorInstance.detectOpenVocabulary(
          img,
          img.naturalWidth || 1920,
          img.naturalHeight || 1080,
          query,
          confidenceThreshold
        );

        const allRes = await detectorInstance.detectAll(
          img,
          img.naturalWidth || 1920,
          img.naturalHeight || 1080
        );

        setRawDetections(openVocabRes.detections);
        setSearchSummary(openVocabRes.summary);
        setAllSceneDetections(allRes.detections.length > 0 ? allRes.detections : openVocabRes.detections);
        setMetrics({
          fps: 32,
          latencyMs: openVocabRes.metrics.latencyMs || Math.round(performance.now() - start),
          resolution: {
            width: img.naturalWidth || 1920,
            height: img.naturalHeight || 1080,
          },
        });
      } catch (err) {
        console.warn('Detection processing note:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeTarget, confidenceThreshold]
  );

  // Initial load: generate thumbnails and default target state
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = SAMPLE_MEDIA[0].url;
    img.onload = () => {
      const allDets = (SAMPLE_MEDIA[0].defaultDetections || []).map((det) => ({
        ...det,
        thumbnailUrl: extractObjectThumbnail(img, det.bounding_box, 88),
      }));
      setAllSceneDetections(allDets);

      // Default target "car"
      const carMatches = allDets
        .filter((d) => d.class_name.toLowerCase() === 'car')
        .map((d) => ({ ...d, isTargetMatch: true }));

      setRawDetections(carMatches);
      setSearchSummary({
        target: 'car',
        matchesFound: carMatches.length,
        confidence: carMatches[0]?.confidence || 0.88,
        status: 'found',
      });
    };
  }, []);

  // Handle custom Image upload
  const handleImageUpload = (file: File) => {
    stopWebcam();
    setInputMode('image');
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setCurrentMedia(null);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setMediaMeta({
        name: file.name,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      processImageDetections(img, activeTarget);
    };
  };

  // Handle custom Video upload
  const handleVideoUpload = (file: File) => {
    stopWebcam();
    setInputMode('video');
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setCurrentMedia(null);
    setMediaMeta({
      name: file.name,
      dimensions: '1920 × 1080',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });
    setIsVideoPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(console.warn);
      }
    }, 100);
  };

  // Select Sample Media Preset
  const handleSelectSample = (sample: SampleMedia) => {
    stopWebcam();
    setInputMode('image');
    setUploadedImageUrl(null);
    setCurrentMedia(sample);
    setMediaMeta({
      name: sample.name,
      dimensions: sample.dimensions,
      size: sample.size,
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sample.url;
    img.onload = () => {
      processImageDetections(img, activeTarget);
    };
  };

  // Start Webcam stream
  const startWebcam = async () => {
    setWebcamError(null);
    setIsProcessing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      webcamStreamRef.current = stream;
      setWebcamActive(true);
      setMediaMeta({
        name: 'Live Camera Feed',
        dimensions: '1280 × 720',
        size: 'Live Webcam',
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      setWebcamError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Grant permission in your browser to test live detection.'
          : 'Unable to access camera. Please check your video input device.'
      );
      setWebcamActive(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop Webcam stream
  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setWebcamError(null);
  };

  // Continuous frame detection loop for Video and Webcam
  useEffect(() => {
    if (inputMode !== 'video' && inputMode !== 'webcam') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    let lastInferenceTime = 0;

    const runFrameInference = async () => {
      if (!isSubscribed) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && !video.paused && !video.ended) {
        const now = performance.now();
        // Inference interval throttled for smooth video streaming
        if (now - lastInferenceTime >= 90) {
          lastInferenceTime = now;
          try {
            const res = await detectorInstance.detectAll(
              video,
              video.videoWidth || 1280,
              video.videoHeight || 720
            );
            if (isSubscribed) {
              setAllSceneDetections(res.detections);
              setMetrics(res.metrics);

              // Filter for active target if in Target Only mode
              if (!showAllObjects && activeTarget) {
                const targetLower = activeTarget.toLowerCase();
                const matched = res.detections.filter((d) => {
                  const cls = d.class_name.toLowerCase();
                  return cls.includes(targetLower) || targetLower.includes(cls);
                }).map((d) => ({ ...d, isTargetMatch: true }));

                setRawDetections(matched);
                setSearchSummary({
                  target: activeTarget,
                  matchesFound: matched.length,
                  confidence: matched[0]?.confidence,
                  status: matched.length > 0 ? 'found' : 'not_found',
                });
              } else {
                setRawDetections(res.detections);
              }
            }
          } catch (e) {
            // ignore frame skip
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(runFrameInference);
    };

    animationFrameRef.current = requestAnimationFrame(runFrameInference);

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [inputMode, webcamActive, isVideoPlaying, showAllObjects, activeTarget]);

  // Clean / Reset state
  const handleClear = () => {
    stopWebcam();
    setUploadedImageUrl(null);
    setUploadedVideoUrl(null);
    setCurrentMedia(null);
    setRawDetections([]);
    setAllSceneDetections([]);
    setSelectedDetectionId(null);
    setSearchSummary({
      target: activeTarget,
      matchesFound: 0,
      status: 'idle',
    });
    setMediaMeta({
      name: 'No Media Selected',
      dimensions: '0 × 0',
      size: '0 KB',
    });
  };

  // Toggle Video Playback
  const handleTogglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex font-sans antialiased selection:bg-blue-600/30 selection:text-white">
      {/* 1. Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 px-6 lg:px-10 py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Section */}
          <Hero />

          {/* 1. UPLOAD IMAGE / VIDEO / SELECT INPUT */}
          <InputSourceControls
            inputMode={inputMode}
            onSelectMode={handleSelectMode}
            confidenceThreshold={confidenceThreshold}
            onThresholdChange={setConfidenceThreshold}
            onImageUpload={handleImageUpload}
            onVideoUpload={handleVideoUpload}
          />

          {/* 2. Open-Vocabulary Target Input: What do you want to detect? */}
          <OpenVocabularySearch
            onSearch={handleOpenVocabSearch}
            isSearching={isSearching}
            searchSummary={searchSummary}
            activeTarget={activeTarget}
            showAllObjects={showAllObjects}
            onToggleShowAll={setShowAllObjects}
          />

          {/* 3. OPEN-VOCABULARY DETECTION: Find matching regions -> Draw bounding boxes -> Show confidence + count */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 65%: Detection Preview */}
            <div className="lg:col-span-8">
              <DetectionPreview
                inputMode={inputMode}
                currentMedia={currentMedia}
                uploadedImageUrl={uploadedImageUrl}
                uploadedVideoUrl={uploadedVideoUrl}
                mediaMeta={mediaMeta}
                filteredDetections={filteredDetections}
                selectedDetectionId={selectedDetectionId}
                onSelectDetection={setSelectedDetectionId}
                isProcessing={isProcessing}
                metrics={metrics}
                onClear={handleClear}
                onSelectSample={handleSelectSample}
                webcamActive={webcamActive}
                webcamError={webcamError}
                onRestartWebcam={startWebcam}
                videoRef={videoRef}
                canvasRef={canvasRef}
                imageRef={imageRef}
                isVideoPlaying={isVideoPlaying}
                onTogglePlayVideo={handleTogglePlayVideo}
                activeTarget={!showAllObjects ? activeTarget : undefined}
              />
            </div>

            {/* Right 35%: Detection Results */}
            <div className="lg:col-span-4">
              <DetectionResults
                detections={filteredDetections}
                selectedDetectionId={selectedDetectionId}
                onSelectDetection={setSelectedDetectionId}
                confidenceThreshold={confidenceThreshold}
                isProcessing={isProcessing}
                searchSummary={!showAllObjects ? searchSummary : undefined}
              />
            </div>
          </div>

          {/* Bottom 4 Feature Cards */}
          <FeatureHighlights />
        </div>
      </main>
    </div>
  );
}
