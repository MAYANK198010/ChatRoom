import React, { useState } from 'react';
import { Share2, X, Check, Search } from 'lucide-react';
import { Chat, Message } from '../types';

interface ForwardModalProps {
  message: Message;
  chats: Chat[];
  onForwardToChats: (chatIds: string[]) => void;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  message,
  chats = [],
  onForwardToChats,
  onClose
}) => {
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const safeChats = Array.isArray(chats) ? chats : [];
  const filtered = safeChats.filter(c => c && c.name && c.name.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id: string) => {
    if (selectedChatIds.includes(id)) {
      setSelectedChatIds((selectedChatIds || []).filter(i => i !== id));
    } else {
      setSelectedChatIds([...(selectedChatIds || []), id]);
    }
  };

  const handleForward = () => {
    if (selectedChatIds.length > 0) {
      onForwardToChats(selectedChatIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">Forward Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 bg-gray-50 border-b border-[#e4e6eb] text-xs text-gray-600 truncate font-mono">
          ↪ "{message.content || message.mediaFileName || '[Media content]'}"
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-[#e4e6eb] bg-[#fafafa]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-[#1c1e21] pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.map(c => {
            const isSelected = selectedChatIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleSelect(c.id)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-xl object-cover border border-[#e4e6eb]" />
                  <div>
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff]">{c.name}</div>
                    <div className="text-[10px] text-gray-500">{c.type === 'group' ? 'Group' : 'Direct Conversation'}</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                  isSelected ? 'bg-[#0084ff] border-[#0084ff] text-white' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Forward Action Button */}
        <div className="p-4 bg-[#fafafa] border-t border-[#e4e6eb] flex justify-end">
          <button
            disabled={selectedChatIds.length === 0}
            onClick={handleForward}
            className="px-6 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
          >
            <span>Forward ({selectedChatIds.length})</span>
            <Share2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
