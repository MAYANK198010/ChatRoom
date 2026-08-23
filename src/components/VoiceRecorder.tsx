import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Lock, StopCircle } from 'lucide-react';
import { soundService } from '../services/audio';

interface VoiceRecorderProps {
  onSend: (data: { duration: number; waveform: number[]; mediaUrl?: string }) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const waveIntervalRef = useRef<any>(null);

  useEffect(() => {
    soundService.playRecordChime(true);

    // Start timer
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Start waveform animation
    waveIntervalRef.current = setInterval(() => {
      const randomAmp = Math.floor(Math.random() * 75) + 20;
      setWaveform(prev => {
        const next = [...prev, randomAmp];
        if (next.length > 28) next.shift();
        return next;
      });
    }, 100);

    // Attempt audio recording via getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mr = new MediaRecorder(stream);
          mr.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          mr.start();
          setMediaRecorder(mr);
        })
        .catch(err => {
          console.debug('Microphone access note:', err.message);
        });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  const handleFinishAndSend = () => {
    soundService.playRecordChime(false);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }

    const finalDuration = Math.max(1, seconds);
    const finalWaveform = waveform.length > 0 ? waveform : [30, 60, 90, 70, 40, 80, 50, 60, 30];

    onSend({
      duration: finalDuration,
      waveform: finalWaveform
    });
  };

  const handleAbort = () => {
    soundService.playRecordChime(false);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    onCancel();
  };

  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-between w-full bg-white px-4 py-2.5 rounded-2xl border border-gray-200 animate-fade-in shadow-md font-sans">
      
      {/* Delete / Cancel */}
      <button
        onClick={handleAbort}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
        title="Cancel voice recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Timer & Pulsing Recording Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-mono text-xs font-bold text-[#1c1e21]">{minutes}:{secs}</span>
        </div>

        {/* Live Audio Visualizer Wave */}
        <div className="hidden sm:flex items-center gap-1 h-6 w-32 overflow-hidden">
          {waveform.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="w-1 bg-[#0084ff] rounded-full transition-all duration-75"
            />
          ))}
        </div>
      </div>

      {/* Send Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleFinishAndSend}
          className="w-9 h-9 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl flex items-center justify-center transition shadow-md shadow-blue-100 cursor-pointer"
          title="Send voice note"
        >
          <Send className="w-4 h-4 fill-current ml-0.5" />
        </button>
      </div>

    </div>
  );
};
