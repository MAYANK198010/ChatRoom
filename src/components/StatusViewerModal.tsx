import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Lock, Heart } from 'lucide-react';
import { StatusItem, UserProfile } from '../types';
import { storage } from '../services/storage';

interface StatusViewerModalProps {
  statuses: StatusItem[];
  initialIndex?: number;
  currentUser: UserProfile | null;
  onClose: () => void;
  onReply: (userId: string, replyText: string) => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  statuses,
  initialIndex = 0,
  currentUser,
  onClose,
  onReply
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);

  const currentStatus = statuses[currentIndex];
  const isOwnStatus = currentStatus?.userId === currentUser?.id || currentStatus?.userId === 'current_user';

  // Mark viewed
  useEffect(() => {
    if (currentStatus) {
      storage.markStatusAsViewed(currentStatus.id);
    }
  }, [currentIndex, currentStatus]);

  // Story Progress Timer (5 seconds = 5000ms)
  useEffect(() => {
    if (!currentStatus || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // updates every 100ms => 50 steps = 5000ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, statuses.length, currentStatus, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStatus) return;
    onReply(currentStatus.userId, `Replied to status: "${replyText.trim()}"`);
    setReplyText('');
    onClose();
  };

  if (!currentStatus) return null;

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in">
      
      {/* Top Controls & Multi-segment Progress Bars */}
      <div className="p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
        {/* Progress Bars */}
        <div className="flex items-center gap-1 mb-3">
          {statuses.map((s, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={s.id} className="flex-1 h-1 bg-gray-600/60 rounded-full overflow-hidden">
                <div
                  style={{
                    width: isCompleted ? '100%' : isCurrent ? `${progress}%` : '0%'
                  }}
                  className="h-full bg-emerald-400 transition-all duration-75 ease-linear"
                />
              </div>
            );
          })}
        </div>

        {/* User Info & Close */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <img
              src={currentStatus.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentStatus.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
            />
            <div>
              <div className="font-semibold text-sm">{currentStatus.userName}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>{timeAgo(currentStatus.timestamp)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <Lock className="w-2.5 h-2.5" /> E2EE
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer text-gray-300 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Status Visual Container (Interactive Left/Right tap + hold to pause) */}
      <div
        className="flex-1 relative flex items-center justify-center p-4"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Navigation tap areas */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-start pl-4 group"
        >
          {currentIndex > 0 && (
            <div className="p-2 rounded-full bg-black/40 text-white/50 group-hover:text-white group-hover:bg-black/60 transition hidden md:block">
              <ChevronLeft className="w-6 h-6" />
            </div>
          )}
        </div>

        <div
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-end pr-4 group"
        >
          <div className="p-2 rounded-full bg-black/40 text-white/50 group-hover:text-white group-hover:bg-black/60 transition hidden md:block">
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>

        {/* Content Render: Text or Image */}
        {currentStatus.type === 'text' ? (
          <div
            style={{ backgroundColor: currentStatus.backgroundColor || '#075E54' }}
            className="w-full max-w-md aspect-9/16 max-h-[75vh] rounded-3xl p-8 flex items-center justify-center text-center shadow-2xl transition-all"
          >
            <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed drop-shadow-md">
              {currentStatus.content}
            </p>
          </div>
        ) : (
          <div className="relative max-h-[75vh] max-w-md flex flex-col items-center justify-center">
            <img
              src={currentStatus.content}
              alt="Status"
              className="max-h-[70vh] rounded-3xl object-contain shadow-2xl"
            />
            {currentStatus.caption && (
              <div className="mt-3 px-4 py-2 bg-black/70 backdrop-blur-xs rounded-xl text-sm text-gray-200 text-center max-w-sm">
                {currentStatus.caption}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action: Reply or Viewers count */}
      <div className="p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
        {isOwnStatus ? (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowViewersSheet(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs text-gray-200 backdrop-blur-xs transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{currentStatus.viewers?.length || 0} views</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="w-full max-w-md flex items-center gap-2">
            <input
              type="text"
              placeholder="Reply to status..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-white/15 backdrop-blur-md text-white placeholder:text-gray-400 px-4 py-2.5 rounded-full text-xs border border-white/20 focus:outline-hidden focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 bg-[#00a884] disabled:opacity-40 text-gray-950 rounded-full transition cursor-pointer"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </form>
        )}
      </div>

      {/* Viewers Bottom Sheet if own status */}
      {showViewersSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="bg-[#111b21] w-full max-w-md rounded-3xl border border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-sm text-gray-100">
                  Viewed by ({currentStatus.viewers?.length || 0})
                </h4>
              </div>
              <button
                onClick={() => setShowViewersSheet(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {currentStatus.viewers?.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No views yet</div>
              ) : (
                currentStatus.viewers?.map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={v.userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-gray-200">{v.userName}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{timeAgo(v.viewedAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
