import React from 'react';
import { 
  X, Check, CheckCheck, Clock, ShieldCheck, 
  User, Image as ImageIcon, Mic, FileText, MapPin, BarChart2 
} from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessageInfoModalProps {
  message: Message;
  allUsers: UserProfile[];
  currentUserId: string;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  message,
  allUsers,
  currentUserId,
  onClose
}) => {
  const isSender = message.senderId === currentUserId || message.senderId === 'current_user';

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const readReceipts = message.readReceipts || [];
  const deliveredReceipts = message.deliveredReceipts || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans text-[#1c1e21]">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-scale-up flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0084ff] flex items-center justify-center font-bold">
              <CheckCheck className="w-4 h-4 text-[#0084ff]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1c1e21]">Message Info & Read Receipts</h2>
              <p className="text-[11px] text-gray-500 font-medium">Delivery & read confirmations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Card */}
        <div className="p-4 border-b border-gray-100 bg-[#f8fafc]">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Message Preview
          </div>
          <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xs text-[#0084ff]">{message.senderName}</span>
              <span className="text-[10px] text-gray-400">• {formatTimestamp(message.timestamp)}</span>
            </div>

            {message.type === 'text' && (
              <p className="text-xs text-gray-800 leading-relaxed break-words font-normal">
                {message.content}
              </p>
            )}

            {message.type === 'image' && (
              <div className="space-y-1.5">
                {message.mediaUrl && (
                  <img
                    src={message.mediaUrl}
                    alt="preview"
                    className="w-full max-h-32 object-cover rounded-xl border border-gray-100"
                  />
                )}
                {message.content && <p className="text-xs text-gray-700">{message.content}</p>}
              </div>
            )}

            {message.type === 'voice' && (
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl">
                <Mic className="w-4 h-4 text-[#0084ff]" />
                <span>Voice Note ({message.voiceDuration || 0}s)</span>
              </div>
            )}

            {message.type === 'poll' && (
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl">
                <BarChart2 className="w-4 h-4 text-[#0084ff]" />
                <span className="font-medium">Poll: {message.pollData?.question}</span>
              </div>
            )}

            {message.type === 'document' && (
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl">
                <FileText className="w-4 h-4 text-[#0084ff]" />
                <span className="font-medium truncate">{message.mediaFileName || 'Document'}</span>
              </div>
            )}

            {message.type === 'location' && (
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-medium">{message.locationData?.address || 'Shared Location'}</span>
              </div>
            )}

            {/* Cryptographic Footprint */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>E2EE AES-GCM-256</span>
              </span>
              <span className="font-mono">{message.encryptedPayload?.fingerprint || 'CR-AES-GEN'}</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown (Read By / Delivered To / Sent) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. READ BY SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <CheckCheck className="w-4 h-4 text-[#0084ff]" />
                <span>Read by ({readReceipts.length})</span>
              </div>
              <span className="text-[10px] font-semibold text-[#0084ff] bg-blue-50 px-2 py-0.5 rounded-full">
                Double Blue Ticks
              </span>
            </div>

            {readReceipts.length > 0 ? (
              <div className="space-y-2">
                {readReceipts.map((r, idx) => {
                  const userMatch = allUsers.find(u => u.id === r.userId);
                  const avatar = r.userAvatar || userMatch?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.userId}`;
                  const isSelf = r.userId === currentUserId || r.userId === 'current_user';

                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50/40 border border-gray-100 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={avatar}
                          alt={r.userName}
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate flex items-center gap-1">
                            <span>{r.userName}</span>
                            {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTimestamp(r.readAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[#0084ff]">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
                Not read yet by other participants
              </div>
            )}
          </div>

          {/* 2. DELIVERED TO SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <CheckCheck className="w-4 h-4 text-gray-400" />
                <span>Delivered to ({deliveredReceipts.length})</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Double Grey Ticks
              </span>
            </div>

            {deliveredReceipts.length > 0 ? (
              <div className="space-y-2">
                {deliveredReceipts.map((d, idx) => {
                  const userMatch = allUsers.find(u => u.id === d.userId);
                  const avatar = d.userAvatar || userMatch?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.userId}`;
                  const isSelf = d.userId === currentUserId || d.userId === 'current_user';

                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={avatar}
                          alt={d.userName}
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate flex items-center gap-1">
                            <span>{d.userName}</span>
                            {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTimestamp(d.deliveredAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
                Pending delivery confirmation
              </div>
            )}
          </div>

          {/* 3. SENT TIMESTAMP */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-gray-400" />
              <span>Sent:</span>
            </span>
            <span className="font-semibold text-gray-700">{formatTimestamp(message.timestamp)}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#fafafa] border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-blue-100"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
