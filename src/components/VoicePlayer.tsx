import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoicePlayerProps {
  audioUrl?: string;
  waveform?: number[];
  duration?: number;
  isSender?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  audioUrl,
  waveform = [20, 40, 60, 80, 50, 30, 70, 90, 60, 40, 30, 50, 75, 45, 25],
  duration = 12,
  isSender = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress(audio.currentTime / audio.duration);
        }
      };

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (!audioUrl) {
      if (isPlaying) {
        const stepMs = 50;
        const totalSteps = ((duration * 1000) / speed) / stepMs;
        
        timerRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 1) {
              setIsPlaying(false);
              return 0;
            }
            return prev + (1 / totalSteps);
          });
        }, stepMs);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isPlaying, duration, speed, audioUrl]);

  const togglePlay = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speed === 1) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2);
    else setSpeed(1);
  };

  const handleSeek = (index: number) => {
    const p = index / waveform.length;
    setProgress(p);
    if (audioUrl && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = p * audioRef.current.duration;
    }
  };

  const currentSeconds = Math.floor(progress * duration);
  const displayTime = isPlaying || progress > 0
    ? `${Math.floor(currentSeconds / 60)}:${(currentSeconds % 60).toString().padStart(2, '0')}`
    : `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-2xl min-w-[220px] max-w-[280px] ${
      isSender ? 'bg-blue-600/30' : 'bg-black/5'
    }`}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm shrink-0 cursor-pointer ${
          isSender
            ? 'bg-white text-[#0084ff] hover:bg-white/90'
            : 'bg-[#0084ff] text-white hover:bg-[#0073e6]'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Visualizer */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-0.5 h-6">
          {waveform.map((height, i) => {
            const barProgress = i / waveform.length;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                className={`flex-1 rounded-full cursor-pointer transition-all duration-75 ${
                  isPlayed
                    ? isSender ? 'bg-white' : 'bg-[#0084ff]'
                    : isSender ? 'bg-white/40' : 'bg-gray-300'
                }`}
                style={{ height: `${Math.max(20, (height / 100) * 24)}px` }}
              />
            );
          })}
        </div>

        {/* Duration & Speed */}
        <div className="flex items-center justify-between text-[10px]">
          <span className={`font-mono font-bold ${isSender ? 'text-white/80' : 'text-gray-500'}`}>
            {displayTime}
          </span>
          <button
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] cursor-pointer transition ${
              isSender
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {speed}x
          </button>
        </div>
      </div>

      {/* Mic Badge */}
      <div className={`p-1.5 rounded-full ${isSender ? 'text-white/60' : 'text-gray-400'}`}>
        <Mic className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
