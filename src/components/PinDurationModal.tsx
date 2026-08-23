import React, { useState } from 'react';
import { Pin, X, Clock, Shield } from 'lucide-react';
import { Message } from '../types';

interface PinDurationModalProps {
  message: Message;
  onConfirmPin: (duration: '24h' | '7d' | '30d' | 'forever') => void;
  onClose: () => void;
}

export const PinDurationModal: React.FC<PinDurationModalProps> = ({
  message,
  onConfirmPin,
  onClose
}) => {
  const [duration, setDuration] = useState<'24h' | '7d' | '30d' | 'forever'>('forever');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans text-[#1c1e21]">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Pin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1c1e21]">Pin Message</h2>
              <p className="text-[11px] text-gray-500 font-medium">Keep this message visible at the top</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message snippet preview */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100">
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Selected Message</div>
          <div className="text-xs text-gray-800 italic bg-white p-2.5 rounded-xl border border-gray-200 truncate">
            <span className="font-semibold text-[#0084ff] not-italic">{message.senderName}: </span>
            {message.content || '[Media message]'}
          </div>
        </div>

        {/* Duration options */}
        <div className="p-4 space-y-2">
          <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0084ff]" />
            <span>Pin Duration</span>
          </div>

          {[
            { id: 'forever', title: 'Until unpinned', desc: 'Stays pinned until someone unpins it' },
            { id: '24h', title: '24 Hours', desc: 'Automatically unpins after 1 day' },
            { id: '7d', title: '7 Days', desc: 'Automatically unpins after 1 week' },
            { id: '30d', title: '30 Days', desc: 'Automatically unpins after 1 month' }
          ].map(opt => (
            <label
              key={opt.id}
              onClick={() => setDuration(opt.id as any)}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                duration === opt.id
                  ? 'bg-blue-50/70 border-[#0084ff] text-[#0084ff]'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <input
                type="radio"
                name="pin_duration"
                checked={duration === opt.id}
                onChange={() => setDuration(opt.id as any)}
                className="mt-0.5 accent-[#0084ff]"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold">{opt.title}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#fafafa] border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/70 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmPin(duration)}
            className="px-5 py-2 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-blue-100 flex items-center gap-1.5"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pin to Chat</span>
          </button>
        </div>

      </div>
    </div>
  );
};
