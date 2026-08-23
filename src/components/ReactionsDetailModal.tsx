import React, { useState } from 'react';
import { X, Smile, Trash2, Clock } from 'lucide-react';
import { Message, Reaction, UserProfile } from '../types';

interface ReactionsDetailModalProps {
  message: Message;
  currentUserId: string;
  allUsers: UserProfile[];
  onRemoveReaction: (emoji: string) => void;
  onClose: () => void;
}

export const ReactionsDetailModal: React.FC<ReactionsDetailModalProps> = ({
  message,
  currentUserId,
  allUsers,
  onRemoveReaction,
  onClose
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string>('all');

  const reactions = message.reactions || [];

  // Group emojis with counts
  const emojiCounts: Record<string, number> = {};
  reactions.forEach(r => {
    emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
  });

  const uniqueEmojis = Object.keys(emojiCounts);

  const filteredReactions = selectedEmoji === 'all'
    ? reactions
    : reactions.filter(r => r.emoji === selectedEmoji);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans text-[#1c1e21]">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-scale-up flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1c1e21]">Message Reactions</h2>
              <p className="text-[11px] text-gray-500 font-medium">{reactions.length} total reaction{reactions.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-[#f8fafc] overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setSelectedEmoji('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
              selectedEmoji === 'all'
                ? 'bg-[#0084ff] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-200/70 border border-gray-200/60'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80">({reactions.length})</span>
          </button>

          {uniqueEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedEmoji === emoji
                  ? 'bg-[#0084ff] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-200/70 border border-gray-200/60'
              }`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-[10px] opacity-80">{emojiCounts[emoji]}</span>
            </button>
          ))}
        </div>

        {/* Reactions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredReactions.length > 0 ? (
            filteredReactions.map((r, idx) => {
              const userMatch = allUsers.find(u => u.id === r.userId);
              const avatar = r.userAvatar || userMatch?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.userId}`;
              const isSelf = r.userId === currentUserId || r.userId === 'current_user';

              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={avatar}
                      alt={r.userName}
                      className="w-9 h-9 rounded-full object-cover border border-white shadow-2xs"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-800 truncate flex items-center gap-1">
                        <span>{r.userName}</span>
                        {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTimestamp(r.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1 bg-white rounded-xl shadow-2xs border border-gray-100">
                      {r.emoji}
                    </span>
                    {isSelf && (
                      <button
                        onClick={() => onRemoveReaction(r.emoji)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Remove your reaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">
              No reactions in this category
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#fafafa] border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
