import React, { useState, useRef } from 'react';
import { 
  Check, CheckCheck, Clock, Star, Smile, Reply, 
  Share2, Edit3, Trash2, ShieldCheck, MapPin, FileText, 
  Download, MoreVertical, Ban, CheckCircle2, Shield,
  Pin, Info, Plus
} from 'lucide-react';
import { Message, Reaction } from '../types';
import { VoicePlayer } from './VoicePlayer';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGroup?: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onStar: (messageId: string) => void;
  onForward: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string, forEveryone: boolean) => void;
  onInspectEncryption: (message: Message) => void;
  onOpenMedia: (url: string, fileName?: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onOpenMessageInfo: (message: Message) => void;
  onOpenReactionsDetail: (message: Message) => void;
  onTogglePin: (message: Message) => void;
}

const POPULAR_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '💯', '🚀', '🔒'];

const ALL_EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😂', '🥹', '😍', '😎', '🥳', '🤔', '🤯', '😴', '😭'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '🙏', '👊'] },
  { name: 'Hearts & Fire', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '🔥', '✨'] },
  { name: 'Celebration', emojis: ['🎉', '🎊', '🎁', '🚀', '💯', '⭐', '🌟', '🏆', '🎯', '🔒'] }
];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  isGroup = false,
  onReply,
  onReact,
  onStar,
  onForward,
  onEdit,
  onDelete,
  onInspectEncryption,
  onOpenMedia,
  onVotePoll,
  onOpenMessageInfo,
  onOpenReactionsDetail,
  onTogglePin
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  const isSender = message.senderId === currentUserId || message.senderId === 'current_user';

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate read receipt status
  const readCount = message.readReceipts?.length || 0;
  const isReadByOthers = (message.readReceipts || []).some(r => r.userId !== currentUserId && r.userId !== 'current_user');

  // Render Status Ticks with interactive info trigger
  const renderStatusTicks = () => {
    if (!isSender) return null;

    if (message.status === 'sending') {
      return (
        <span title="Sending...">
          <Clock className="w-3 h-3 text-white/70 animate-spin" />
        </span>
      );
    }
    if (message.status === 'sent') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenMessageInfo(message); }}
          className="hover:scale-110 transition cursor-pointer"
          title="Sent (Single check)"
        >
          <Check className="w-3.5 h-3.5 text-white/80" />
        </button>
      );
    }
    if (message.status === 'delivered') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenMessageInfo(message); }}
          className="hover:scale-110 transition cursor-pointer"
          title="Delivered (Double grey check)"
        >
          <CheckCheck className="w-3.5 h-3.5 text-white/80" />
        </button>
      );
    }
    if (message.status === 'read' || isReadByOthers) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenMessageInfo(message); }}
          className="hover:scale-110 transition cursor-pointer"
          title="Read (Double blue check) • Click for details"
        >
          <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
        </button>
      );
    }
    return null;
  };

  // If message was deleted
  if (message.isDeleted) {
    return (
      <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} my-1 select-none`}>
        <div className="bg-gray-100 border border-gray-200 text-gray-400 italic text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-2xs">
          <Ban className="w-3.5 h-3.5 text-gray-400" />
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  // Check if current user reacted
  const userReaction = (message.reactions || []).find(r => r.userId === currentUserId || r.userId === 'current_user');

  return (
    <div 
      id={`msg-${message.id}`}
      className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} my-1.5 group relative select-text transition-all duration-300`}
    >
      
      {/* Sender Name for Groups */}
      {isGroup && !isSender && (
        <span className="text-[11px] font-bold text-[#0084ff] ml-3 mb-1">
          {message.senderName}
        </span>
      )}

      {/* Main Bubble Container */}
      <div
        className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-2xl transition-all ${
          message.isPinned ? 'ring-2 ring-amber-400 shadow-md' : ''
        } ${
          isSender
            ? 'bg-[#0084ff] text-white rounded-tr-none shadow-md shadow-blue-100'
            : 'bg-white border border-gray-100 text-[#1c1e21] rounded-tl-none shadow-sm'
        }`}
      >
        {/* Pinned Pill Header */}
        {message.isPinned && (
          <div className={`flex items-center gap-1 text-[10px] mb-1.5 font-bold ${
            isSender ? 'text-amber-200' : 'text-amber-600'
          }`}>
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned {message.pinnedByName ? `by ${message.pinnedByName}` : ''}</span>
          </div>
        )}

        {/* Forwarded Indicator */}
        {message.isForwarded && (
          <div className={`flex items-center gap-1 text-[10px] mb-1.5 italic font-medium ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
            <Share2 className="w-2.5 h-2.5" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Quoted / Reply Preview */}
        {message.replyToMessage && (
          <div className={`p-2.5 mb-2.5 rounded-xl text-xs border-l-4 ${
            isSender
              ? 'bg-blue-600/50 border-white text-white'
              : 'bg-blue-50 border-[#0084ff] text-[#1c1e21]'
          }`}>
            <div className={`font-bold text-[11px] ${isSender ? 'text-white' : 'text-[#0084ff]'}`}>
              {message.replyToMessage.senderName}
            </div>
            <div className={`truncate text-[11px] mt-0.5 ${isSender ? 'text-blue-100' : 'text-gray-600'}`}>
              {message.replyToMessage.content || '[Media preview]'}
            </div>
          </div>
        )}

        {/* Content based on type */}

        {/* 1. Image Message */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="space-y-2">
            <div
              onClick={() => onOpenMedia(message.mediaUrl!, message.mediaFileName)}
              className="rounded-xl overflow-hidden cursor-pointer max-h-72 bg-gray-100 border border-black/5"
            >
              <img
                src={message.mediaUrl}
                alt={message.mediaFileName || 'Image'}
                className="w-full h-full object-cover hover:scale-102 transition duration-200"
              />
            </div>
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        )}

        {/* 2. Voice Note Message */}
        {message.type === 'voice' && message.mediaUrl && (
          <div className="py-1">
            <VoicePlayer
              audioUrl={message.mediaUrl}
              duration={message.voiceDuration || 0}
              waveform={message.voiceWaveform}
              isSender={isSender}
            />
          </div>
        )}

        {/* 3. Document / File Message */}
        {message.type === 'document' && (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            isSender ? 'bg-blue-600/40 border-blue-400/30' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`p-2.5 rounded-xl ${isSender ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#0084ff]'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate">
                {message.mediaFileName || message.content}
              </div>
              <div className={`text-[10px] ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.mediaFileSize ? `${(message.mediaFileSize / 1024).toFixed(1)} KB` : 'Document'}
              </div>
            </div>
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                download={message.mediaFileName || 'file'}
                className={`p-2 rounded-xl transition ${isSender ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* 4. Location Message */}
        {message.type === 'location' && message.locationData && (
          <div className="space-y-2">
            <div className={`rounded-xl overflow-hidden p-3 border ${
              isSender ? 'bg-blue-600/30 border-blue-400/30' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className={`w-4 h-4 ${isSender ? 'text-white' : 'text-red-500'}`} />
                <span className="font-semibold text-xs">Shared Location</span>
              </div>
              <p className="text-xs opacity-90">{message.locationData.address || message.content}</p>
              <div className="mt-2 text-[10px] opacity-75 font-mono">
                {message.locationData.latitude.toFixed(4)}, {message.locationData.longitude.toFixed(4)}
              </div>
            </div>
          </div>
        )}

        {/* 5. Interactive Poll Message */}
        {message.type === 'poll' && message.pollData && (
          <div className="space-y-2.5 min-w-[220px]">
            <div className="font-bold text-sm leading-snug">
              📊 {message.pollData.question}
            </div>
            <div className="space-y-1.5">
              {message.pollData.options.map((opt) => {
                const totalVotes = message.pollData!.options.reduce((acc, o) => acc + o.votes.length, 0);
                const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                const hasVoted = opt.votes.includes(currentUserId);

                return (
                  <button
                    key={opt.id}
                    onClick={() => onVotePoll(message.id, opt.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition relative overflow-hidden cursor-pointer ${
                      isSender
                        ? 'bg-blue-600/30 border-blue-300/30 hover:bg-blue-600/50'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {/* Progress Fill */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
                        isSender ? 'bg-white/20' : 'bg-blue-100'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                        {opt.text}
                      </span>
                      <span className="text-[11px] opacity-80 font-bold">{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Standard Text Message */}
        {message.type === 'text' && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-normal">
            {message.content}
          </p>
        )}

        {/* Message Meta: Timestamp, Status Ticks, Star, Edited, Pin, E2EE Shield, Info */}
        <div className={`flex justify-end items-center mt-1.5 space-x-1.5 text-[10px] ${
          isSender ? 'text-white/75' : 'text-gray-400'
        }`}>
          {message.isPinned && <Pin className="w-2.5 h-2.5 fill-current" />}
          {message.isStarred && <Star className="w-3 h-3 text-amber-300 fill-amber-300" />}
          {message.isEdited && <span className="italic text-[9px]">(edited)</span>}
          <span>{timeStr}</span>
          
          {/* Status Ticks (Sent/Delivered/Read) */}
          {renderStatusTicks()}
          
          {/* Message Info / Read Receipts Trigger */}
          <button
            onClick={() => onOpenMessageInfo(message)}
            className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded cursor-pointer ${
              isSender ? 'hover:text-white' : 'hover:text-[#0084ff]'
            }`}
            title="Read receipts & message info"
          >
            <Info className="w-3 h-3" />
          </button>

          {/* E2EE Inspector Trigger */}
          <button
            onClick={() => onInspectEncryption(message)}
            className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded cursor-pointer ${
              isSender ? 'hover:text-white' : 'hover:text-[#0084ff]'
            }`}
            title="Inspect cryptographic payload"
          >
            <Shield className="w-3 h-3" />
          </button>
        </div>

        {/* Reactions Display Pill Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div 
            onClick={(e) => { e.stopPropagation(); onOpenReactionsDetail(message); }}
            className="absolute -bottom-3.5 right-2 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm text-xs select-none hover:shadow-md transition cursor-pointer z-10"
            title="View who reacted"
          >
            {Array.from(new Set((message.reactions || []).map(r => r.emoji))).map((emoji) => {
              const count = (message.reactions || []).filter(r => r.emoji === emoji).length;
              const hasUserReacted = userReaction?.emoji === emoji;

              return (
                <span 
                  key={emoji} 
                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full transition ${
                    hasUserReacted ? 'bg-blue-50 text-[#0084ff] font-bold ring-1 ring-blue-300' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xs">{emoji}</span>
                  {count > 1 && <span className="text-[10px] font-bold text-gray-500">{count}</span>}
                </span>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Hover Action Toolbar & Reaction Bar */}
      <div className={`absolute top-0 ${isSender ? 'right-[100%] mr-2' : 'left-[100%] ml-2'} hidden group-hover:flex items-center bg-white border border-gray-100 shadow-xl rounded-2xl p-1 gap-1 z-30 animate-fade-in`}>
        
        {/* Quick Reaction Bar Trigger & Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReactionMenu(!showReactionMenu);
              setShowAllEmojis(false);
            }}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              showReactionMenu ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
            }`}
            title="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Interactive Emoji Reactions Bar */}
          {showReactionMenu && (
            <div 
              className={`absolute bottom-9 ${isSender ? 'right-0' : 'left-0'} bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up text-[#1c1e21]`}
              style={{ minWidth: showAllEmojis ? '280px' : 'auto' }}
            >
              {!showAllEmojis ? (
                <div className="flex items-center gap-1">
                  {POPULAR_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowReactionMenu(false);
                      }}
                      className={`text-lg p-1.5 rounded-xl transition hover:scale-130 active:scale-95 cursor-pointer ${
                        userReaction?.emoji === emoji ? 'bg-blue-100 ring-2 ring-[#0084ff]' : 'hover:bg-gray-100'
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                  
                  {/* Plus More Emojis */}
                  <button
                    onClick={() => setShowAllEmojis(true)}
                    className="p-1.5 text-gray-400 hover:text-[#0084ff] hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="More emojis"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Full Categorized Emoji Picker */
                <div className="space-y-3 p-1">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-xs font-bold text-gray-700">Choose Reaction</span>
                    <button
                      onClick={() => setShowAllEmojis(false)}
                      className="text-[10px] text-[#0084ff] font-bold hover:underline cursor-pointer"
                    >
                      Back to popular
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {ALL_EMOJI_CATEGORIES.map(cat => (
                      <div key={cat.name}>
                        <div className="text-[10px] font-semibold text-gray-400 mb-1">{cat.name}</div>
                        <div className="grid grid-cols-5 gap-1">
                          {cat.emojis.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => {
                                onReact(message.id, emoji);
                                setShowReactionMenu(false);
                                setShowAllEmojis(false);
                              }}
                              className={`text-lg p-1.5 rounded-xl hover:scale-125 transition hover:bg-gray-100 cursor-pointer ${
                                userReaction?.emoji === emoji ? 'bg-blue-100 ring-2 ring-[#0084ff]' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pin / Unpin Message */}
        <button
          onClick={() => onTogglePin(message)}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            message.isPinned ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
          }`}
          title={message.isPinned ? 'Unpin message' : 'Pin message'}
        >
          <Pin className="w-4 h-4" />
        </button>

        {/* Reply */}
        <button
          onClick={() => onReply(message)}
          className="p-1.5 text-gray-400 hover:text-[#0084ff] hover:bg-gray-100 rounded-xl transition cursor-pointer"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>

        {/* Star */}
        <button
          onClick={() => onStar(message.id)}
          className={`p-1.5 hover:bg-gray-100 rounded-xl transition cursor-pointer ${
            message.isStarred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
          }`}
          title="Star"
        >
          <Star className="w-4 h-4" />
        </button>

        {/* Forward */}
        <button
          onClick={() => onForward(message)}
          className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          title="Forward"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            title="More"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-2xl shadow-2xl p-1.5 w-48 space-y-1 text-xs z-50 animate-scale-up text-[#1c1e21]">
              
              {/* Message Info & Read Receipts */}
              <button
                onClick={() => { onOpenMessageInfo(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
              >
                <Info className="w-3.5 h-3.5 text-[#0084ff]" />
                <span>Read receipts & info</span>
              </button>

              {/* Pin / Unpin */}
              <button
                onClick={() => { onTogglePin(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
              >
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span>{message.isPinned ? 'Unpin message' : 'Pin message'}</span>
              </button>

              {isSender && message.type === 'text' && (
                <button
                  onClick={() => { onEdit(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0084ff]" />
                  <span>Edit message</span>
                </button>
              )}

              <button
                onClick={() => { onInspectEncryption(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Crypto payload</span>
              </button>

              <button
                onClick={() => { onDelete(message.id, false); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-xl transition text-left cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete for me</span>
              </button>

              {isSender && (
                <button
                  onClick={() => { onDelete(message.id, true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
