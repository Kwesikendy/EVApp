import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Volume2, VolumeX, Play, Pause, Upload, CheckCircle2, Film } from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [videoSrc, setVideoSrc] = useState<string>('/Electric_vehicle_charging_at_sta…_20260917013218.mp4');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [hasCustomVideo, setHasCustomVideo] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attempt to autoplay video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => setIsVideoPlaying(false));
      }
    };

    attemptPlay();

    const onUserInteraction = () => {
      if (video.paused) {
        attemptPlay();
      }
    };

    window.addEventListener('click', onUserInteraction, { once: true });
    window.addEventListener('touchstart', onUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
    };
  }, [videoSrc]);

  // Handle local video file selection or drop
  const processVideoFile = async (file: File) => {
    if (!file || !file.type.startsWith('video/')) return;

    // 1. Instantly play file directly in the browser via ObjectURL
    const localUrl = URL.createObjectURL(file);
    setVideoSrc(localUrl);
    setHasCustomVideo(true);
    setIsVideoPlaying(true);

    if (videoRef.current) {
      videoRef.current.src = localUrl;
      videoRef.current.load();
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    }

    // 2. Upload to server in background so it permanently persists in the app container
    try {
      setIsUploading(true);
      const arrayBuffer = await file.arrayBuffer();
      await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'video/mp4' },
        body: arrayBuffer,
      });
    } catch {
      // Local Object URL continues playing seamlessly
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsVideoPlaying(true));
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  return (
    <div
      id="xcharge-splash-screen"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#070b10] text-white select-none overflow-hidden transition-all ${
        isDragOver ? 'ring-4 ring-[#22c55e] ring-inset' : ''
      }`}
    >
      {/* 1. Full-Screen Background Video Layer */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer"
        onClick={togglePlayback}
      >
        <video
          ref={videoRef}
          id="splash-bg-video"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/Electric_vehicle_charging_at_sta…_20260917013218.mp4" type="video/mp4" />
        </video>

        {/* 2. Visual Digital Twin of the exact uploaded video scene:
               Dark coupe-SUV charging at twilight with illuminated dual green cable and ground mist */}
        <div className="absolute inset-0 bg-[#070b10] -z-10 overflow-hidden pointer-events-none">
          {/* Twilight sky background with horizon gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b121c] via-[#0d1624] to-[#05080c]" />

          {/* Distant streetlamp / horizon flare */}
          <div className="absolute top-[28%] left-[22%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_24px_8px_rgba(180,220,255,0.7)]" />
          <div className="absolute top-[28%] left-[10%] right-[40%] h-[1px] bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />

          {/* SVG representation of the dark SUV rear quarter panel & charging port */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#151b24" />
                <stop offset="45%" stopColor="#0d1118" />
                <stop offset="100%" stopColor="#040608" />
              </linearGradient>

              <linearGradient id="cableCyanGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#16a34a" stopOpacity="0.4" />
                <stop offset="40%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="70%" stopColor="#4ade80" stopOpacity="1" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0.9" />
              </linearGradient>

              <filter id="neonFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur1" />
                <feGaussianBlur stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Car silhouette: rear window slope, roof spoiler, taillight */}
            <path
              d="M 280 800 C 350 680, 500 580, 750 560 C 950 580, 1080 620, 1080 750 L 1080 1500 C 900 1520, 700 1530, 500 1520 Z"
              fill="url(#carBodyGrad)"
              opacity="0.9"
            />

            {/* Rear wheel arch */}
            <circle cx="620" cy="1280" r="210" fill="#05070a" stroke="#1f2937" strokeWidth="8" />
            <circle cx="620" cy="1280" r="160" fill="#0c1017" stroke="#374151" strokeWidth="4" />

            {/* Red LED Taillight strip */}
            <path
              d="M 860 840 C 940 850, 1020 865, 1080 870"
              stroke="#ff2244"
              strokeWidth="10"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 16px #ff0033)' }}
            />

            {/* Charging inlet housing & handle */}
            <rect x="490" y="870" width="110" height="90" rx="20" fill="#0a0e14" stroke="#2a3342" strokeWidth="4" />
            <path
              d="M 520 900 L 460 970 C 450 985, 430 995, 410 990 L 390 980"
              stroke="#64748b"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* Glowing neon green charging cable (twin lines matching video) */}
            <path
              d="M 20 1520 C 140 1480, 260 1350, 340 1200 C 380 1120, 420 1040, 460 970"
              fill="none"
              stroke="#0a0e14"
              strokeWidth="36"
              strokeLinecap="round"
            />
            {/* Cable Green Core 1 */}
            <path
              d="M 20 1520 C 140 1480, 260 1350, 340 1200 C 380 1120, 420 1040, 460 970"
              fill="none"
              stroke="url(#cableCyanGlow)"
              strokeWidth="14"
              strokeLinecap="round"
              filter="url(#neonFilter)"
            />
            {/* Cable Green Core 2 */}
            <path
              d="M 30 1530 C 150 1490, 270 1360, 350 1210 C 390 1130, 430 1050, 470 980"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>

          {/* Rolling cold ground mist / fog effects */}
          <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-slate-900/90 via-emerald-950/20 to-transparent blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 -left-20 w-[600px] h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-4 right-0 w-[500px] h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Subtle Vignette Overlays for high-contrast mobile typography */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e14]/75 via-transparent to-[#0a0e14]/85 pointer-events-none" />
      </div>

      {/* 3. Top Header Branding Overlay */}
      <div className="relative z-20 p-5 sm:p-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <XChargeLogo size="md" variant="full" />
          <span className="text-[10px] text-[#4ade80] font-mono font-medium px-2 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30">
            CHARGELINK OS 4.0
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Audio toggle */}
          <button
            id="btn-toggle-splash-audio"
            onClick={(e) => {
              e.stopPropagation();
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              if (videoRef.current) {
                videoRef.current.muted = nextMute;
              }
            }}
            title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className="w-8 h-8 rounded-full bg-[#10141a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#4ade80]" />}
          </button>

          {/* Play/Pause toggle */}
          <button
            id="btn-toggle-play-video"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayback();
            }}
            title={isVideoPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 rounded-full bg-[#10141a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            {isVideoPlaying ? <Pause className="w-3.5 h-3.5 text-[#00e699]" /> : <Play className="w-3.5 h-3.5 text-[#4ade80] ml-0.5" />}
          </button>

          <div className="px-2.5 py-1 rounded-full bg-[#10141a]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#00e699] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e699] animate-pulse" />
            <span>CONNECTED</span>
          </div>
        </div>
      </div>

      {/* 4. Center Video Switcher / Telemetry Badge */}
      <div className="relative z-20 px-6 my-auto text-center space-y-4 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10141a]/85 backdrop-blur-md border border-[#22c55e]/40 text-xs text-[#4ade80] font-mono shadow-[0_0_20px_rgba(45,122,62,0.35)]">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
          <span>160 kW HIGH-SPEED EV CHARGING TELEMETRY</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
          Powering a Cleaner
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5c9e3a] via-[#4ade80] to-[#22c55e]">
            Tomorrow in Ghana.
          </span>
        </h1>
      </div>

      {/* 5. 'Enter Application' CTA Overlay */}
      <div className="relative z-20 p-5 sm:p-6 pb-10 sm:pb-12 max-w-md w-full mx-auto space-y-3 pointer-events-auto">
        <button
          id="btn-enter-application"
          onClick={onComplete}
          className="w-full h-13 py-3.5 bg-gradient-to-r from-[#2d7a3e] via-[#22c55e] to-[#2d7a3e] hover:brightness-110 text-white font-extrabold text-sm tracking-wider rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-xl shadow-black/60 cursor-pointer"
        >
          <span>ENTER CHARGELINK GH</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>GREENWOOD EVENT CENTER · KUMASI</span>
          <span>OCPP 1.6J · MAXPOWER VCP160</span>
        </div>
      </div>
    </div>
  );
};
