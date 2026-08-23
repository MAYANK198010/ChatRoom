import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, ScreenShare, 
  Minimize2, Maximize2, ShieldCheck, Lock, Volume2 
} from 'lucide-react';
import { soundService } from '../services/audio';

interface CallModalProps {
  contactName: string;
  contactAvatar: string;
  isGroup?: boolean;
  initialType: 'voice' | 'video';
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  contactName,
  contactAvatar,
  isGroup = false,
  initialType = 'voice',
  onEndCall
}) => {
  const [callType, setCallType] = useState<'voice' | 'video'>(initialType);
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(initialType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    soundService.startCallRinging();

    // Connect call automatically after 2.5s
    const connectTimer = setTimeout(() => {
      soundService.stopCallRinging();
      setStatus('connected');
    }, 2500);

    return () => {
      soundService.stopCallRinging();
      clearTimeout(connectTimer);
    };
  }, []);

  // Duration timer when connected
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Handle local camera stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isVideoOn && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          activeStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.debug('Video stream note:', err.message);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoOn]);

  const handleEnd = () => {
    soundService.stopCallRinging();
    onEndCall();
  };

  const formattedTime = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  // Minimized Floating Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#111b21] border border-emerald-500/40 rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-fade-in text-gray-100">
        <img
          src={contactAvatar}
          alt={contactName}
          className="w-10 h-10 rounded-full object-cover border border-emerald-400"
        />
        <div>
          <div className="text-xs font-semibold text-gray-200">{contactName}</div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {status === 'ringing' ? 'Ringing...' : formattedTime}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 transition cursor-pointer"
            title="Expand Call"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleEnd}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-lg flex flex-col justify-between p-6 animate-fade-in select-none text-gray-100">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs text-emerald-400 font-medium">End-to-End Encrypted Call</span>
        </div>

        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-gray-300 transition cursor-pointer"
          title="Minimize Call"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Avatar / Video Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {isVideoOn ? (
          <div className="relative w-full max-w-2xl aspect-16/9 bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center">
            {/* Simulated Remote Video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-slate-950">
              <img
                src={contactAvatar}
                alt={contactName}
                className="w-24 h-24 rounded-full object-cover border-2 border-emerald-400 mb-3 shadow-xl"
              />
              <div className="text-base font-semibold text-gray-200">{contactName}</div>
              <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" /> HD Audio & Video Connected
              </div>
            </div>

            {/* Local Video Picture-in-Picture */}
            <div className="absolute bottom-4 right-4 w-32 md:w-40 aspect-4/3 bg-gray-950 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-emerald-500/30 overflow-hidden shadow-2xl p-1">
                <img
                  src={contactAvatar}
                  alt={contactName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {status === 'ringing' && (
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-30" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-100">{contactName}</h3>
              <div className="text-sm font-semibold text-emerald-400 mt-1 font-mono">
                {status === 'ringing' ? 'Ringing...' : formattedTime}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-center gap-4 max-w-md mx-auto w-full pb-4">
        {/* Toggle Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition cursor-pointer ${
            isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Toggle Video */}
        <button
          onClick={() => {
            setIsVideoOn(!isVideoOn);
            setCallType(isVideoOn ? 'voice' : 'video');
          }}
          className={`p-4 rounded-full transition cursor-pointer ${
            isVideoOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200'
          }`}
          title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEnd}
          className="p-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full transition shadow-xl cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};
