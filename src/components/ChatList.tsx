import React, { useState } from 'react';
import { 
  Pin, VolumeX, Check, CheckCheck, Clock, 
  Users, MessageSquare 
} from 'lucide-react';
import { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  typingUser: { chatId: string; userName: string } | null;
  onSelectChat: (chat: Chat) => void;
}

// Deterministic pastel color mapping for initials if avatar is not set or for sleek styling
const AVATAR_COLORS = [
  { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { bg: 'bg-green-100', text: 'text-green-600' },
  { bg: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' }
];

export const ChatList: React.FC<ChatListProps> = ({
  chats = [],
  activeChatId,
  typingUser,
  onSelectChat
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');

  const safeChats = Array.isArray(chats) ? chats : [];

  const filteredChats = safeChats.filter(chat => {
    if (!chat) return false;
    if (filter === 'unread') return (chat.unreadCount || 0) > 0;
    if (filter === 'favorites') return !!chat.isPinned;
    if (filter === 'groups') return chat.type === 'group';
    return true;
  });

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const now = new Date();
    const date = new Date(ts);
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const renderLastMessagePreview = (chat: Chat) => {
    if (typingUser && typingUser.chatId === chat.id) {
      return (
        <span className="text-[#0084ff] font-semibold italic flex items-center gap-1 text-xs">
          <span>typing...</span>
        </span>
      );
    }

    if (chat.draft) {
      return (
        <span className="text-red-500 font-medium text-xs">
          Draft: <span className="text-gray-500">{chat.draft}</span>
        </span>
      );
    }

    const msg = chat.lastMessage;
    if (!msg) return <span className="text-gray-400 italic text-xs">No messages yet</span>;

    const isOwn = msg.senderId === 'current_user';

    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
        {isOwn && (
          <span className="shrink-0 inline-flex items-center">
            {msg.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#0084ff] inline" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-gray-400 inline" />
            ) : (
              <Check className="w-3.5 h-3.5 text-gray-400 inline" />
            )}
          </span>
        )}
        <span className="truncate">
          {msg.type === 'image' ? '📷 Photo' :
           msg.type === 'voice' ? '🎤 Voice message' :
           msg.type === 'document' ? '📄 Document' :
           msg.type === 'location' ? '📍 Location' :
           msg.type === 'poll' ? '📊 Poll' :
           msg.content}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden select-none bg-white">
      
      {/* Filter Tabs Chips */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-[#e4e6eb] no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'favorites', label: 'Favorites' },
          { id: 'groups', label: 'Groups' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === tab.id
                ? 'bg-[#0084ff] text-white shadow-xs'
                : 'bg-[#f0f2f5] text-gray-600 hover:text-[#1c1e21] hover:bg-gray-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat Items List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
            <p className="font-medium">No conversations found</p>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = chat.id === activeChatId;
            const colorScheme = getColor(chat.name);
            const initials = getInitials(chat.name);

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`p-2.5 flex items-center space-x-3 rounded-2xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50 shadow-xs'
                    : 'hover:bg-[#f0f2f5]/80'
                }`}
              >
                {/* Avatar with Rounded-xl Sleek Styling */}
                <div className="relative shrink-0">
                  {chat.avatar ? (
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#e4e6eb]"
                    />
                  ) : (
                    <div className={`w-12 h-12 ${colorScheme.bg} rounded-xl flex items-center justify-center font-semibold ${colorScheme.text} text-sm`}>
                      {initials}
                    </div>
                  )}

                  {chat.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-xs">
                      <div className="p-0.5 bg-blue-100 text-[#0084ff] rounded-full">
                        <Users className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold truncate text-sm ${isActive ? 'text-[#0084ff]' : 'text-[#1c1e21]'}`}>
                      {chat.name}
                    </h3>
                    <span className={`text-[10px] font-medium shrink-0 ml-2 ${isActive ? 'text-[#0084ff]' : 'text-gray-400'}`}>
                      {formatTimestamp(chat.lastMessage?.timestamp || chat.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="truncate flex-1 pr-1">
                      {renderLastMessagePreview(chat)}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {chat.isMuted && (
                        <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      {chat.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-gray-400 rotate-45" />
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-[#0084ff] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
