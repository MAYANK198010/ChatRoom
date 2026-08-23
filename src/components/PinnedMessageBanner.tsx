import React, { useState } from 'react';
import { Pin, ChevronLeft, ChevronRight, X, Image as ImageIcon, Mic, FileText, BarChart2, MapPin } from 'lucide-react';
import { Message } from '../types';

interface PinnedMessageBannerProps {
  pinnedMessages: Message[];
  onSelectPinnedMessage: (message: Message) => void;
  onUnpinMessage: (message: Message) => void;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  pinnedMessages,
  onSelectPinnedMessage,
  onUnpinMessage
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  // Clamp index in bounds
  const safeIndex = Math.min(currentIndex, pinnedMessages.length - 1);
  const currentMsg = pinnedMessages[safeIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const getMediaPreviewIcon = () => {
    if (currentMsg.type === 'image') return <ImageIcon className="w-3.5 h-3.5 text-[#0084ff]" />;
    if (currentMsg.type === 'voice') return <Mic className="w-3.5 h-3.5 text-purple-600" />;
    if (currentMsg.type === 'document') return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
    if (currentMsg.type === 'poll') return <BarChart2 className="w-3.5 h-3.5 text-amber-600" />;
    if (currentMsg.type === 'location') return <MapPin className="w-3.5 h-3.5 text-red-500" />;
    return null;
  };

  return (
    <div 
      onClick={() => onSelectPinnedMessage(currentMsg)}
      className="bg-white/95 backdrop-blur-xs border-b border-amber-200/80 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-2xs z-20 cursor-pointer hover:bg-amber-50/40 transition group animate-slide-down"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        {/* Pin Icon & Badge */}
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <Pin className="w-4 h-4 fill-current" />
        </div>

        {/* Content Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              Pinned Message
            </span>
            {pinnedMessages.length > 1 && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-md">
                {safeIndex + 1} of {pinnedMessages.length}
              </span>
            )}
            <span className="text-[11px] font-bold text-gray-800 truncate">
              {currentMsg.senderName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-600 truncate mt-0.5">
            {getMediaPreviewIcon()}
            <span className="truncate">
              {currentMsg.content || currentMsg.mediaFileName || `[${currentMsg.type} message]`}
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Next/Prev navigation and unpin button */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {pinnedMessages.length > 1 && (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mr-1">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-gray-800 transition cursor-pointer"
              title="Previous pinned message"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-gray-800 transition cursor-pointer"
              title="Next pinned message"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={() => onUnpinMessage(currentMsg)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
          title="Unpin message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
