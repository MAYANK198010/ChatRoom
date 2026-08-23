import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Video, Search, MoreVertical, Paperclip, 
  Smile, Mic, Send, Image, FileText, Camera, MapPin, 
  BarChart2, ShieldCheck, ArrowLeft, X, Sparkles, Clock, Check, 
  Lock, CheckCircle2, Shield, Info, Pin, Users
} from 'lucide-react';
import { Chat, Message, UserProfile, LocationData, PollData, WallpaperStyle } from '../types';
import { MessageBubble } from './MessageBubble';
import { VoiceRecorder } from './VoiceRecorder';
import { PinnedMessageBanner } from './PinnedMessageBanner';
import { MessageInfoModal } from './MessageInfoModal';
import { ReactionsDetailModal } from './ReactionsDetailModal';
import { PinDurationModal } from './PinDurationModal';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  typingUser: { chatId: string; userName: string } | null;
  wallpaper: WallpaperStyle;
  onBack: () => void;
  onSendMessage: (content: string, type?: any, extra?: any) => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onOpenContactInfo: () => void;
  onOpenVerifySecurityCode: () => void;
  onOpenEncryptionInspector: (message: Message) => void;
  onOpenMediaViewer: (url: string, fileName?: string) => void;
  onOpenCameraModal: () => void;
  onOpenLocationModal: () => void;
  onOpenPollModal: () => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onStarMessage: (messageId: string) => void;
  onForwardMessage: (message: Message) => void;
  onEditMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onTogglePinMessage?: (message: Message, duration?: any) => void;
  onMarkChatRead?: (chatId: string) => void;
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤟', '🤘',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '✨', '🌟', '💫', '💥', '💯', '🎉', '🎊', '🚀', '🔒'
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages = [],
  currentUser,
  allUsers = [],
  typingUser,
  wallpaper,
  onBack,
  onSendMessage,
  onStartCall,
  onOpenContactInfo,
  onOpenVerifySecurityCode,
  onOpenEncryptionInspector,
  onOpenMediaViewer,
  onOpenCameraModal,
  onOpenLocationModal,
  onOpenPollModal,
  onReactToMessage,
  onStarMessage,
  onForwardMessage,
  onEditMessage,
  onDeleteMessage,
  onVotePoll,
  onTogglePinMessage,
  onMarkChatRead
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchInChat, setSearchInChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopMenu, setShowTopMenu] = useState(false);

  // Modals for read receipts, reactions detail, pin selector
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [reactionsMessage, setReactionsMessage] = useState<Message | null>(null);
  const [pinPromptMessage, setPinPromptMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const safeMessages = Array.isArray(messages) ? messages : [];

  // Filter pinned messages safely
  const pinnedMessages = safeMessages.filter(m => m && m.isPinned && !m.isDeleted);

  // Auto-mark chat as read when opening or new messages arrive
  useEffect(() => {
    if (onMarkChatRead && chat?.id) {
      onMarkChatRead(chat.id);
    }
  }, [chat?.id, safeMessages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages.length, typingUser]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (editingMessage) {
      onEditMessage({
        ...editingMessage,
        content: inputText.trim(),
        isEdited: true
      });
      setEditingMessage(null);
    } else {
      onSendMessage(inputText.trim(), 'text', {
        replyToMessage: replyingMessage ? {
          id: replyingMessage.id,
          senderName: replyingMessage.senderName,
          type: replyingMessage.type,
          content: replyingMessage.content,
          mediaUrl: replyingMessage.mediaUrl
        } : undefined
      });
    }

    setInputText('');
    setReplyingMessage(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSendMessage(file.name, 'image', {
            mediaUrl: event.target.result as string,
            mediaFileName: file.name,
            mediaFileSize: file.size,
            mediaMimeType: file.type
          });
        }
      };
      reader.readAsDataURL(file);
      setShowAttachMenu(false);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSendMessage(file.name, 'document', {
            mediaUrl: event.target.result as string,
            mediaFileName: file.name,
            mediaFileSize: file.size,
            mediaMimeType: file.type
          });
        }
      };
      reader.readAsDataURL(file);
      setShowAttachMenu(false);
    }
  };

  const handleVoiceSend = (data: { duration: number; waveform: number[]; mediaUrl?: string }) => {
    onSendMessage('Voice Note', 'voice', {
      mediaUrl: data.mediaUrl || '',
      voiceDuration: data.duration,
      voiceWaveform: data.waveform
    });
    setIsRecordingVoice(false);
  };

  // Scroll to pinned message and highlight
  const handleSelectPinnedMessage = (msg: Message) => {
    const el = document.getElementById(`msg-${msg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#0084ff]', 'bg-blue-50/50', 'rounded-2xl');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-[#0084ff]', 'bg-blue-50/50');
      }, 2000);
    }
  };

  const handleTogglePinTrigger = (msg: Message) => {
    if (msg.isPinned) {
      // Unpin immediately
      if (onTogglePinMessage) {
        onTogglePinMessage(msg, false);
      }
    } else {
      // Open duration selector
      setPinPromptMessage(msg);
    }
  };

  const handleConfirmPinWithDuration = (duration: '24h' | '7d' | '30d' | 'forever') => {
    if (pinPromptMessage && onTogglePinMessage) {
      onTogglePinMessage(pinPromptMessage, duration);
    }
    setPinPromptMessage(null);
  };

  const filteredMessages = searchQuery.trim()
    ? safeMessages.filter(m => m && m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : safeMessages;

  if (!chat) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] p-6 text-center select-none">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0084ff] flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">CipherChat Secure Messenger</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Select a direct conversation from the sidebar or click <span className="font-semibold text-gray-700">+ Create Room</span> to start a new end-to-end encrypted room.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <Lock className="w-3.5 h-3.5" />
            <span>Web Crypto AES-GCM-256 Enabled</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-white relative font-sans text-[#1c1e21] h-full overflow-hidden">
      
      {/* 1. SLEEK HEADER */}
      <header className="h-20 border-b border-[#e4e6eb] px-4 md:px-6 flex items-center justify-between bg-white shrink-0 z-10 shadow-xs">
        
        {/* Contact / Room Info & Back */}
        <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-[#1c1e21] rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={onOpenContactInfo}
            className="flex items-center space-x-3 cursor-pointer group min-w-0"
          >
            <div className="relative shrink-0">
              {chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover border border-[#e4e6eb] group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-10 h-10 md:w-11 md:h-11 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600 text-sm">
                  {chat.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm md:text-base leading-none text-[#1c1e21] truncate group-hover:text-[#0084ff] transition flex items-center gap-1.5">
                <span>{chat.name}</span>
                {pinnedMessages.length > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" title={`${pinnedMessages.length} Pinned messages`}>
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    <span>{pinnedMessages.length}</span>
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-green-600 font-semibold mt-1 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 inline-block animate-pulse"></span>
                <span>{chat.type === 'room' ? `${chat.participants?.length || 2} members online` : 'Online'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Badges */}
        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          
          {/* E2EE Encrypted Badge */}
          <div 
            onClick={onOpenVerifySecurityCode}
            className="hidden sm:flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200/50 rounded-lg cursor-pointer transition"
            title="Click to verify end-to-end security number"
          >
            <ShieldCheck className="h-4 w-4 text-green-600 mr-1.5" />
            <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest">
              Encrypted
            </span>
          </div>

          {/* Voice Call Button */}
          <button
            onClick={() => onStartCall('voice')}
            className="p-2.5 text-gray-400 hover:text-[#0084ff] hover:bg-blue-50 rounded-full transition cursor-pointer"
            title="Start Encrypted Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Video Call Button */}
          <button
            onClick={() => onStartCall('video')}
            className="p-2.5 text-gray-400 hover:text-[#0084ff] hover:bg-blue-50 rounded-full transition cursor-pointer"
            title="Start Encrypted Video Call"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Search in Chat Button */}
          <button
            onClick={() => setSearchInChat(!searchInChat)}
            className={`p-2.5 rounded-full transition cursor-pointer ${
              searchInChat ? 'bg-blue-50 text-[#0084ff]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Direct Details & Members Button */}
          <button
            onClick={onOpenContactInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-[#0084ff] rounded-xl transition cursor-pointer text-xs font-semibold border border-gray-200/70 hover:border-blue-200"
            title={chat.type === 'room' ? 'Room info & member roster' : chat.type === 'group' ? 'Group details & members' : 'Contact info & media'}
          >
            {chat.type === 'room' || chat.type === 'group' ? (
              <Users className="w-4 h-4 text-[#0084ff]" />
            ) : (
              <Info className="w-4 h-4 text-[#0084ff]" />
            )}
            <span className="hidden sm:inline">
              {chat.type === 'room' ? 'Members & Info' : chat.type === 'group' ? 'Group Members' : 'Details'}
            </span>
          </button>

          {/* Top Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showTopMenu && (
              <div className="absolute right-0 top-12 z-50 bg-white border border-[#e4e6eb] rounded-2xl shadow-2xl p-1.5 w-56 space-y-1 text-xs animate-scale-up text-[#1c1e21]">
                <button
                  onClick={() => { onOpenContactInfo(); setShowTopMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <Info className="w-4 h-4 text-[#0084ff]" />
                  <span>Chat details & members</span>
                </button>

                <button
                  onClick={() => { onOpenVerifySecurityCode(); setShowTopMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Verify safety number</span>
                </button>

                <button
                  onClick={() => { setSearchInChat(true); setShowTopMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <Search className="w-4 h-4 text-gray-500" />
                  <span>Search in conversation</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. PINNED MESSAGES BANNER */}
      {pinnedMessages.length > 0 && (
        <PinnedMessageBanner
          pinnedMessages={pinnedMessages}
          onSelectPinnedMessage={handleSelectPinnedMessage}
          onUnpinMessage={(m) => {
            if (onTogglePinMessage) onTogglePinMessage(m, false);
          }}
        />
      )}

      {/* Optional Search Bar in Chat */}
      {searchInChat && (
        <div className="px-6 py-2 bg-blue-50/70 border-b border-[#e4e6eb] flex items-center justify-between text-xs animate-slide-down">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-white rounded-xl px-3 py-1.5 border border-blue-200">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Find in chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-xs"
              autoFocus
            />
          </div>
          <button
            onClick={() => { setSearchInChat(false); setSearchQuery(''); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. MESSAGES STREAM CONTAINER */}
      <div 
        className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-[#fafafa] relative"
        style={{
          backgroundImage: wallpaper === 'doodle-light' 
            ? 'radial-gradient(#d1d5db 1px, transparent 1px)' 
            : undefined,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Date Chip */}
        <div className="flex justify-center my-2">
          <span className="text-[10px] bg-white border border-gray-100 text-gray-400 px-3.5 py-1 rounded-full uppercase tracking-wider font-semibold shadow-2xs">
            Today
          </span>
        </div>

        {/* E2EE Safety Reminder Card */}
        <div className="max-w-md mx-auto my-3 bg-white border border-gray-100 p-3 rounded-2xl text-center shadow-2xs">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5 text-green-600" />
            <span>Messages are end-to-end encrypted with AES-GCM-256. No one outside of this chat can read them.</span>
          </div>
        </div>

        {/* Message Bubble Stream */}
        {filteredMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUser.id}
            isGroup={chat.type === 'group' || chat.type === 'room'}
            onReply={(m) => setReplyingMessage(m)}
            onReact={onReactToMessage}
            onStar={onStarMessage}
            onForward={onForwardMessage}
            onEdit={(m) => {
              setEditingMessage(m);
              setInputText(m.content);
            }}
            onDelete={onDeleteMessage}
            onInspectEncryption={onOpenEncryptionInspector}
            onOpenMedia={onOpenMediaViewer}
            onVotePoll={onVotePoll}
            onOpenMessageInfo={(m) => setInfoMessage(m)}
            onOpenReactionsDetail={(m) => setReactionsMessage(m)}
            onTogglePin={handleTogglePinTrigger}
          />
        ))}

        {/* Typing indicator bubble */}
        {typingUser && typingUser.chatId === chat.id && (
          <div className="flex items-center space-x-2 bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-tl-none w-max shadow-2xs animate-fade-in">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-[#0084ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-[#0084ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-[#0084ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-xs text-gray-400 font-medium">{typingUser.userName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner Preview */}
      {replyingMessage && (
        <div className="px-6 py-2.5 bg-blue-50/80 border-t border-[#e4e6eb] flex items-center justify-between animate-slide-up">
          <div className="border-l-3 border-[#0084ff] pl-3">
            <div className="text-xs font-bold text-[#0084ff]">
              Replying to {replyingMessage.senderName}
            </div>
            <div className="text-xs text-gray-600 truncate max-w-md">
              {replyingMessage.content || '[Media file]'}
            </div>
          </div>
          <button
            onClick={() => setReplyingMessage(null)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner Preview */}
      {editingMessage && (
        <div className="px-6 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <span className="font-semibold">Editing message...</span>
          <button
            onClick={() => { setEditingMessage(null); setInputText(''); }}
            className="text-amber-800 hover:underline cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 4. SLEEK FOOTER BAR */}
      <footer className="p-4 px-4 md:px-6 border-t border-[#e4e6eb] bg-white relative shrink-0">
        
        {/* Attachment Floating Menu */}
        {showAttachMenu && (
          <div className="absolute bottom-20 left-6 z-50 bg-white border border-[#e4e6eb] rounded-3xl shadow-2xl p-3 grid grid-cols-3 gap-3 w-72 animate-scale-up">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f0f2f5] transition cursor-pointer group"
            >
              <div className="w-11 h-11 bg-blue-50 text-[#0084ff] rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Image className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Photos</span>
            </button>

            <button
              onClick={() => docInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f0f2f5] transition cursor-pointer group"
            >
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Document</span>
            </button>

            <button
              onClick={() => { onOpenCameraModal(); setShowAttachMenu(false); }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f0f2f5] transition cursor-pointer group"
            >
              <div className="w-11 h-11 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Camera</span>
            </button>

            <button
              onClick={() => { onOpenLocationModal(); setShowAttachMenu(false); }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f0f2f5] transition cursor-pointer group"
            >
              <div className="w-11 h-11 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Location</span>
            </button>

            <button
              onClick={() => { onOpenPollModal(); setShowAttachMenu(false); }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-[#f0f2f5] transition cursor-pointer group"
            >
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <BarChart2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Poll</span>
            </button>
          </div>
        )}

        {/* Hidden inputs for file/photo uploads */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={docInputRef}
          onChange={handleDocUpload}
          accept=".pdf,.doc,.docx,.txt,.zip"
          className="hidden"
        />

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 bg-white border border-[#e4e6eb] rounded-3xl shadow-2xl p-4 w-80 max-h-72 overflow-y-auto animate-scale-up">
            <div className="grid grid-cols-7 gap-2 text-xl">
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    textareaRef.current?.focus();
                  }}
                  className="hover:scale-125 transition p-1 cursor-pointer rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice Recorder Overlay */}
        {isRecordingVoice ? (
          <VoiceRecorder
            onCancel={() => setIsRecordingVoice(false)}
            onSend={handleVoiceSend}
          />
        ) : (
          /* Main Input Pill Bar */
          <div className="flex items-center space-x-3 md:space-x-4 bg-[#f0f2f5] rounded-2xl px-4 py-2">
            
            {/* Attachment Pin */}
            <button
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className="text-gray-400 hover:text-[#0084ff] transition cursor-pointer p-1"
              title="Attach media or files"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Emoji Trigger */}
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className="text-gray-400 hover:text-[#0084ff] transition cursor-pointer p-1"
              title="Insert emoji"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* Textarea Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a secure message..."
              className="flex-1 bg-transparent border-none py-1.5 text-sm focus:ring-0 focus:outline-none placeholder-gray-400 text-[#1c1e21] resize-none max-h-32"
            />

            {/* Mic OR Send Button */}
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-[#0084ff] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-[#0073e6] active:scale-95 transition cursor-pointer shrink-0"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecordingVoice(true)}
                className="w-10 h-10 bg-[#0084ff] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-[#0073e6] active:scale-95 transition cursor-pointer shrink-0"
                title="Hold or click to record voice note"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

      </footer>

      {/* 5. MODALS */}

      {/* Read Receipts & Message Info Modal */}
      {infoMessage && (
        <MessageInfoModal
          message={infoMessage}
          allUsers={allUsers}
          currentUserId={currentUser.id}
          onClose={() => setInfoMessage(null)}
        />
      )}

      {/* Reactions Detail Modal */}
      {reactionsMessage && (
        <ReactionsDetailModal
          message={reactionsMessage}
          currentUserId={currentUser.id}
          allUsers={allUsers}
          onRemoveReaction={(emoji) => {
            onReactToMessage(reactionsMessage.id, emoji);
            setReactionsMessage(null);
          }}
          onClose={() => setReactionsMessage(null)}
        />
      )}

      {/* Pin Duration Modal */}
      {pinPromptMessage && (
        <PinDurationModal
          message={pinPromptMessage}
          onConfirmPin={handleConfirmPinWithDuration}
          onClose={() => setPinPromptMessage(null)}
        />
      )}

    </main>
  );
};
