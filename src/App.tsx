/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppTheme, Chat, Message, StatusItem, UserProfile, 
  WallpaperStyle, LocationData, PollData 
} from './types';
import { storage } from './services/storage';
import { 
  subscribeToRooms, 
  subscribeToRoomMessages, 
  sendFirestoreRoomMessage,
  createFirestoreRoom,
  joinFirestoreRoom,
  leaveFirestoreRoom,
  addFirestoreReaction,
  voteFirestorePoll,
  syncUserProfileToFirestore,
  toggleFirestoreMessagePin,
  markFirestoreRoomMessagesRead
} from './services/firebase';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ContactInfoDrawer } from './components/ContactInfoDrawer';
import { GroupInfoDrawer } from './components/GroupInfoDrawer';
import { RoomInfoDrawer } from './components/RoomInfoDrawer';
import { NewChatModal } from './components/NewChatModal';
import { NewGroupModal } from './components/NewGroupModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { ExploreRoomsModal } from './components/ExploreRoomsModal';
import { SettingsModal } from './components/SettingsModal';
import { CallModal } from './components/CallModal';
import { StatusViewerModal } from './components/StatusViewerModal';
import { StatusCreatorModal } from './components/StatusCreatorModal';
import { EncryptionInspectorModal } from './components/EncryptionInspectorModal';
import { SecurityCodeModal } from './components/SecurityCodeModal';
import { MediaViewer } from './components/MediaViewer';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { PollModal } from './components/PollModal';
import { ForwardModal } from './components/ForwardModal';
import { Hash, Compass, ShieldCheck, Sparkles, User, Users } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storage.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !storage.getCurrentUser());

  // Core Messenger State
  const [chats, setChats] = useState<Chat[]>(() => storage.getChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const list = storage.getChats();
    return list.length > 0 ? list[0].id : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<UserProfile[]>(() => storage.getContacts());
  const [statuses, setStatuses] = useState<StatusItem[]>(() => storage.getStatuses());
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => storage.getBlockedUsers());

  // Preferences & Appearance
  const [theme, setTheme] = useState<AppTheme>(() => storage.getTheme());
  const [wallpaper, setWallpaper] = useState<WallpaperStyle>(() => storage.getWallpaper());

  // Real-time Indicators
  const [typingUser, setTypingUser] = useState<{ chatId: string; userName: string } | null>(null);

  // Modals & Drawers State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showExploreRoomsModal, setShowExploreRoomsModal] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // Feature Modals
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video' } | null>(null);
  const [inspectorMessage, setInspectorMessage] = useState<Message | null>(null);
  const [securityCodeContact, setSecurityCodeContact] = useState<{ id: string; name: string } | null>(null);
  const [mediaViewerData, setMediaViewerData] = useState<{ url: string; fileName?: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  // 1. Subscribe to Firestore Real-Time Rooms
  useEffect(() => {
    const unsubRooms = subscribeToRooms((firestoreRooms) => {
      if (firestoreRooms && firestoreRooms.length > 0) {
        // Merge with local state
        setChats(prev => {
          const merged = [...firestoreRooms];
          // Preserve any purely local direct chats
          prev.forEach(localChat => {
            if (!merged.some(m => m.id === localChat.id)) {
              merged.push(localChat);
            }
          });
          storage.saveChats(merged);
          return merged;
        });
      }
    });

    return () => {
      unsubRooms();
    };
  }, []);

  // 2. Subscribe to Real-Time Messages for Active Room / Chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Load cached/initial messages
    const localMsgs = storage.getMessages(activeChatId);
    setMessages(localMsgs);
    storage.markChatAsRead(activeChatId);

    // Subscribe to Firestore for real-time room messages
    const isRoom = activeChatId.startsWith('room_') || activeChatId.startsWith('#');
    if (isRoom) {
      const unsubMsgs = subscribeToRoomMessages(activeChatId, (liveMessages) => {
        if (liveMessages && liveMessages.length > 0) {
          setMessages(liveMessages);
          storage.saveMessages(activeChatId, liveMessages);
        }
      });
      return () => {
        unsubMsgs();
      };
    }
  }, [activeChatId]);

  // 3. Local Event Subscriptions
  useEffect(() => {
    const unsubscribe = storage.subscribe((event) => {
      if (event.type === 'user_updated') {
        setCurrentUser(event.data);
      } else if (event.type === 'user_logged_out') {
        setCurrentUser(null);
        setShowAuthModal(true);
      } else if (event.type === 'chats_updated') {
        setChats(event.data);
      } else if (event.type === 'messages_updated') {
        if (event.data.chatId === activeChatId) {
          setMessages(event.data.messages);
        }
        setChats(storage.getChats());
      } else if (event.type === 'statuses_updated') {
        setStatuses(event.data);
      } else if (event.type === 'theme_updated') {
        setTheme(event.data);
      } else if (event.type === 'wallpaper_updated') {
        setWallpaper(event.data);
      } else if (event.type === 'user_typing') {
        setTypingUser({ chatId: event.data.chatId, userName: event.data.userName });
      } else if (event.type === 'user_stop_typing') {
        setTypingUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeChatId]);

  // Apply Theme to DOM
  useEffect(() => {
    storage.setTheme(theme);
  }, [theme]);

  // Active Chat Object
  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeContact = activeChat && activeChat.type === 'direct'
    ? contacts.find(c => activeChat.participants.includes(c.id) && c.id !== currentUser?.id)
    : undefined;

  // Handlers
  const handleSelectChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    setShowRightDrawer(false);
  };

  const handleSendMessage = async (content: string, type: any = 'text', extra: any = {}) => {
    if (!activeChatId || !currentUser) return;

    const isRoom = activeChatId.startsWith('room_') || activeChat?.type === 'room';

    if (isRoom) {
      // Send encrypted message to Firestore Real-Time Room
      const newMsg = await sendFirestoreRoomMessage(activeChatId, currentUser, {
        type,
        content,
        ...extra
      });
      // Also update local storage for immediate optimistic responsiveness
      storage.sendMessage(activeChatId, {
        type,
        content,
        ...extra
      });
    } else {
      // Direct / Group Chat
      await storage.sendMessage(activeChatId, {
        type,
        content,
        ...extra
      });
      setMessages(storage.getMessages(activeChatId));
      setChats(storage.getChats());
    }
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    setActiveCall({ type });
  };

  const handleOpenVerifySecurityCode = () => {
    if (activeChat) {
      const targetId = activeChat.type === 'direct'
        ? activeChat.participants.find(p => p !== currentUser?.id) || 'user_sarah'
        : activeChat.id;
      setSecurityCodeContact({
        id: targetId,
        name: activeChat.name
      });
    }
  };

  const handleCreateRoom = async (roomData: Partial<Chat>) => {
    const newRoom = await createFirestoreRoom(roomData);
    storage.createChat(newRoom);
    setChats(storage.getChats());
    setActiveChatId(newRoom.id);
  };

  const handleJoinRoom = async (room: Chat) => {
    if (currentUser) {
      await joinFirestoreRoom(room.id, currentUser.id);
      storage.updateChat(room.id, {
        participants: Array.from(new Set([...room.participants, currentUser.id]))
      });
    }
    setActiveChatId(room.id);
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (currentUser) {
      await leaveFirestoreRoom(roomId, currentUser.id);
      const updatedParts = (activeChat?.participants || []).filter(id => id !== currentUser.id);
      storage.updateChat(roomId, { participants: updatedParts });
      const remaining = chats.filter(c => c.id !== roomId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      setShowRightDrawer(false);
    }
  };

  const handleCreateNewGroup = (newChat: Chat) => {
    storage.createChat(newChat);
    setChats(storage.getChats());
    setActiveChatId(newChat.id);
  };

  const handleAddNewContact = (phone: string, name: string) => {
    const newContact: UserProfile = {
      id: 'usr_c_' + Date.now(),
      phone,
      countryCode: '+1',
      name,
      about: 'ChatRoom member 🔐',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      online: true,
      lastSeen: Date.now()
    };
    storage.addContact(newContact);
    setContacts(storage.getContacts());

    // Create 1-on-1 chat
    const newChat: Chat = {
      id: 'chat_' + newContact.id,
      type: 'direct',
      name: newContact.name,
      avatar: newContact.avatar,
      about: newContact.about,
      participants: [currentUser?.id || 'current_user', newContact.id],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      disappearingTimer: 0,
      createdAt: Date.now(),
      sharedKeyFingerprint: 'CC-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    storage.createChat(newChat);
    setChats(storage.getChats());
    setActiveChatId(newChat.id);
  };

  const handleStatusReply = (userId: string, replyText: string) => {
    let chat = chats.find(c => c.type === 'direct' && c.participants.includes(userId));
    if (!chat) {
      const contact = contacts.find(c => c.id === userId);
      if (contact) {
        chat = storage.createChat({
          id: 'chat_' + contact.id,
          type: 'direct',
          name: contact.name,
          avatar: contact.avatar,
          about: contact.about,
          participants: [currentUser?.id || 'current_user', contact.id],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          disappearingTimer: 0,
          createdAt: Date.now(),
          sharedKeyFingerprint: 'CC-AES-ST'
        });
      }
    }

    if (chat) {
      setActiveChatId(chat.id);
      storage.sendMessage(chat.id, { content: replyText, type: 'text' });
    }
  };

  const handleForwardToMultiple = (chatIds: string[]) => {
    if (!forwardingMessage) return;
    chatIds.forEach(cId => {
      storage.sendMessage(cId, {
        type: forwardingMessage.type,
        content: forwardingMessage.content,
        mediaUrl: forwardingMessage.mediaUrl,
        mediaFileName: forwardingMessage.mediaFileName,
        mediaFileSize: forwardingMessage.mediaFileSize,
        voiceDuration: forwardingMessage.voiceDuration,
        voiceWaveform: forwardingMessage.voiceWaveform,
        locationData: forwardingMessage.locationData,
        pollData: forwardingMessage.pollData,
        isForwarded: true
      });
    });
    setChats(storage.getChats());
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f0f2f5] text-[#1c1e21] font-sans">
      
      {/* Top App Header & Real-Time Sync Bar */}
      <header className="h-10 bg-white border-b border-[#e4e6eb] px-4 flex items-center justify-between text-xs shrink-0 select-none z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#1c1e21]">
            <div className="w-5 h-5 bg-gradient-to-tr from-[#0084ff] to-indigo-600 rounded-md flex items-center justify-center text-white text-[10px]">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-black tracking-tight">ChatRoom</span>
          </div>

          <span className="text-gray-300">|</span>

          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-green-200/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Firestore Live Sync</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Explore Rooms Quick Button */}
          <button
            onClick={() => setShowExploreRoomsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0084ff] font-bold rounded-lg transition cursor-pointer text-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Rooms</span>
          </button>

          {/* User Persona Chip */}
          {currentUser && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition cursor-pointer text-xs font-semibold text-gray-700"
              title="Click to view profile & settings"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-4 h-4 rounded-md object-cover"
              />
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main App Window Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR */}
        <div className={`h-full ${activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
          {currentUser && (
            <Sidebar
              currentUser={currentUser}
              chats={chats}
              contacts={contacts}
              statuses={statuses}
              activeChatId={activeChatId}
              typingUser={typingUser}
              onSelectChat={handleSelectChat}
              onSelectContact={(c) => {
                // Ensure the user actually exists in registered contacts
                const contactExists = contacts.some(ct => ct.id === c.id || (ct.phone && c.phone && ct.phone === c.phone));
                if (!contactExists) {
                  return;
                }
                let chat = chats.find(ch => ch.type === 'direct' && ch.participants.includes(c.id));
                if (!chat) {
                  chat = storage.createChat({
                    id: 'chat_' + c.id,
                    type: 'direct',
                    name: c.name,
                    avatar: c.avatar,
                    about: c.about,
                    participants: [currentUser.id, c.id],
                    unreadCount: 0,
                    isPinned: false,
                    isMuted: false,
                    isArchived: false,
                    disappearingTimer: 0,
                    createdAt: Date.now(),
                    sharedKeyFingerprint: 'CC-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase()
                  });
                  setChats(storage.getChats());
                }
                setActiveChatId(chat.id);
              }}
              onOpenNewChat={() => setShowNewChatModal(true)}
              onOpenNewGroup={() => setShowNewGroupModal(true)}
              onOpenCreateRoom={() => setShowCreateRoomModal(true)}
              onOpenExploreRooms={() => setShowExploreRoomsModal(true)}
              onOpenStatusViewer={() => setShowStatusViewer(true)}
              onOpenStatusCreator={() => setShowStatusCreator(true)}
              onOpenSettings={() => setShowSettings(true)}
              onLogout={() => { storage.logout(); setCurrentUser(null); setShowAuthModal(true); }}
            />
          )}
        </div>

        {/* CHAT AREA */}
        <div className={`flex-1 h-full flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChat && currentUser ? (
            <div className="flex-1 flex h-full overflow-hidden">
              <ChatArea
                chat={activeChat}
                messages={messages}
                currentUser={currentUser}
                allUsers={[...contacts, currentUser]}
                typingUser={typingUser}
                wallpaper={wallpaper}
                onBack={() => setActiveChatId(null)}
                onSendMessage={handleSendMessage}
                onStartCall={handleStartCall}
                onOpenContactInfo={() => setShowRightDrawer(!showRightDrawer)}
                onOpenVerifySecurityCode={handleOpenVerifySecurityCode}
                onOpenEncryptionInspector={(msg) => setInspectorMessage(msg)}
                onOpenMediaViewer={(url, fileName) => setMediaViewerData({ url, fileName })}
                onOpenCameraModal={() => setShowCameraModal(true)}
                onOpenLocationModal={() => setShowLocationModal(true)}
                onOpenPollModal={() => setShowPollModal(true)}
                onReactToMessage={(msgId, emoji) => {
                  const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_');
                  if (isRoom) {
                    addFirestoreReaction(activeChat.id, msgId, {
                      emoji,
                      userId: currentUser.id,
                      userName: currentUser.name,
                      timestamp: Date.now()
                    });
                  }
                  storage.addReaction(activeChat.id, msgId, emoji, currentUser);
                }}
                onStarMessage={(msgId) => {
                  const m = messages.find(msg => msg.id === msgId);
                  if (m) storage.updateMessage(activeChat.id, msgId, { isStarred: !m.isStarred });
                }}
                onForwardMessage={(msg) => setForwardingMessage(msg)}
                onEditMessage={(msg) => storage.updateMessage(activeChat.id, msg.id, { content: msg.content, isEdited: true })}
                onDeleteMessage={(msgId, forEveryone) => storage.deleteMessage(activeChat.id, msgId, forEveryone)}
                onVotePoll={(msgId, optId) => {
                  const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_');
                  if (isRoom) {
                    voteFirestorePoll(activeChat.id, msgId, optId, currentUser.id);
                  }
                  storage.votePoll(activeChat.id, msgId, optId);
                }}
                onTogglePinMessage={(msg, duration) => {
                  const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_');
                  const newPinnedState = !msg.isPinned;
                  const pinDuration = (typeof duration === 'string' && ['24h', '7d', '30d', 'forever'].includes(duration))
                    ? (duration as '24h' | '7d' | '30d' | 'forever')
                    : 'forever';
                  if (isRoom) {
                    toggleFirestoreMessagePin(
                      activeChat.id, 
                      msg.id, 
                      newPinnedState, 
                      currentUser, 
                      pinDuration
                    );
                  }
                  storage.togglePinMessage(
                    activeChat.id, 
                    msg.id, 
                    newPinnedState, 
                    currentUser, 
                    pinDuration
                  );
                  setMessages(storage.getMessages(activeChat.id));
                  setChats(storage.getChats());
                }}
                onMarkChatRead={(chatId) => {
                  const isRoom = chatId.startsWith('room_') || activeChat?.type === 'room';
                  const safeMsgs = Array.isArray(messages) ? messages : [];
                  const unreadMsgs = safeMsgs.filter(
                    m => m && m.senderId !== currentUser.id && !(m.readReceipts || []).some(r => r.userId === currentUser.id)
                  );
                  if (isRoom && unreadMsgs.length > 0) {
                    markFirestoreRoomMessagesRead(chatId, unreadMsgs.map(m => m.id), currentUser);
                  }
                  storage.markChatAsRead(chatId, currentUser);
                }}
              />

              {/* RIGHT DRAWER: Room Info OR Contact Info OR Group Info */}
              {showRightDrawer && (
                activeChat.type === 'room' || activeChat.name.startsWith('#') ? (
                  <RoomInfoDrawer
                    chat={activeChat}
                    allUsers={[...contacts, currentUser]}
                    currentUserId={currentUser.id}
                    onClose={() => setShowRightDrawer(false)}
                    onLeaveRoom={() => handleLeaveRoom(activeChat.id)}
                    onClearRoom={() => {
                      storage.saveMessages(activeChat.id, []);
                      setMessages([]);
                    }}
                  />
                ) : activeChat.type === 'group' ? (
                  <GroupInfoDrawer
                    chat={activeChat}
                    allContacts={contacts}
                    currentUserId={currentUser.id}
                    onClose={() => setShowRightDrawer(false)}
                    onAddMember={(uId) => {
                      const updatedParts = [...(activeChat.participants || []), uId];
                      storage.updateChat(activeChat.id, { participants: updatedParts });
                    }}
                    onRemoveMember={(uId) => {
                      const updatedParts = (activeChat.participants || []).filter(id => id !== uId);
                      storage.updateChat(activeChat.id, { participants: updatedParts });
                    }}
                    onToggleAdmin={(uId) => {
                      const admins = activeChat.adminIds || [];
                      const nextAdmins = admins.includes(uId)
                        ? admins.filter(id => id !== uId)
                        : [...admins, uId];
                      storage.updateChat(activeChat.id, { adminIds: nextAdmins });
                    }}
                    onLeaveGroup={() => {
                      const updatedParts = (activeChat.participants || []).filter(id => id !== currentUser.id);
                      storage.updateChat(activeChat.id, { participants: updatedParts });
                      setActiveChatId(null);
                    }}
                    onClearChat={() => {
                      storage.saveMessages(activeChat.id, []);
                      setMessages([]);
                    }}
                    onUpdateDisappearingTimer={(seconds) => {
                      storage.updateChat(activeChat.id, { disappearingTimer: seconds });
                    }}
                  />
                ) : (
                  <ContactInfoDrawer
                    contact={activeContact || {
                      id: 'user_unknown',
                      name: activeChat.name,
                      phone: '+1 555-0100',
                      countryCode: '+1',
                      about: activeChat.about || 'ChatRoom member',
                      avatar: activeChat.avatar,
                      online: true,
                      lastSeen: Date.now()
                    }}
                    chat={activeChat}
                    messages={messages}
                    onClose={() => setShowRightDrawer(false)}
                    onClearChat={() => {
                      storage.saveMessages(activeChat.id, []);
                      setMessages([]);
                    }}
                    onToggleMute={() => {
                      storage.updateChat(activeChat.id, { isMuted: !activeChat.isMuted });
                      setChats(storage.getChats());
                    }}
                    onBlockUser={() => {
                      if (activeContact) {
                        storage.toggleBlockUser(activeContact.id);
                        setBlockedUsers(storage.getBlockedUsers());
                      }
                    }}
                    onUpdateDisappearingTimer={(seconds) => {
                      storage.updateChat(activeChat.id, { disappearingTimer: seconds });
                    }}
                    onVerifySecurityCode={handleOpenVerifySecurityCode}
                    isBlocked={blockedUsers.includes(activeContact?.id || '')}
                  />
                )
              )}
            </div>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fafafa]">
              <div className="w-16 h-16 bg-blue-50 text-[#0084ff] rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                <Hash className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#1c1e21]">Welcome to ChatRoom</h2>
              <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
                Explore encrypted community chat rooms or start a direct conversation. All messages are encrypted with zero-knowledge AES-256.
              </p>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowExploreRoomsModal(true)}
                  className="px-4 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Rooms</span>
                </button>

                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <Hash className="w-4 h-4 text-[#0084ff]" />
                  <span>Create Room</span>
                </button>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200/60 font-semibold">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Web Crypto AES-GCM-256 + Firestore Database Connected</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}

      {/* Auth / Login Modal with Google Sign-In */}
      {showAuthModal && (
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Explore Chat Rooms Modal */}
      {showExploreRoomsModal && (
        <ExploreRoomsModal
          rooms={(chats || []).filter(c => c && (c.type === 'room' || (c.name && c.name.startsWith('#'))))}
          currentUserId={currentUser?.id || 'current_user'}
          onJoinRoom={handleJoinRoom}
          onOpenCreateRoom={() => setShowCreateRoomModal(true)}
          onClose={() => setShowExploreRoomsModal(false)}
        />
      )}

      {/* Create Chat Room Modal */}
      {showCreateRoomModal && currentUser && (
        <CreateRoomModal
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          onCreateRoom={handleCreateRoom}
          onClose={() => setShowCreateRoomModal(false)}
        />
      )}

      {/* New Direct Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          contacts={contacts}
          onSelectContact={(c) => {
            // Ensure contact exists
            const contactExists = contacts.some(ct => ct.id === c.id || (ct.phone && c.phone && ct.phone === c.phone));
            if (!contactExists) {
              return;
            }
            let chat = chats.find(ch => ch.type === 'direct' && ch.participants.includes(c.id));
            if (!chat) {
              chat = storage.createChat({
                id: 'chat_' + c.id,
                type: 'direct',
                name: c.name,
                avatar: c.avatar,
                about: c.about,
                participants: [currentUser?.id || 'current_user', c.id],
                unreadCount: 0,
                isPinned: false,
                isMuted: false,
                isArchived: false,
                disappearingTimer: 0,
                createdAt: Date.now(),
                sharedKeyFingerprint: 'CC-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase()
              });
              setChats(storage.getChats());
            }
            setActiveChatId(chat.id);
            setShowNewChatModal(false);
          }}
          onNewGroupClick={() => {
            setShowNewChatModal(false);
            setShowNewGroupModal(true);
          }}
          onClose={() => setShowNewChatModal(false)}
        />
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <NewGroupModal
          contacts={contacts}
          currentUserId={currentUser?.id || 'current_user'}
          onCreateGroup={handleCreateNewGroup}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}

      {/* Status Viewer Modal */}
      {showStatusViewer && (
        <StatusViewerModal
          statuses={statuses}
          currentUser={currentUser}
          onClose={() => setShowStatusViewer(false)}
          onReply={handleStatusReply}
        />
      )}

      {/* Status Creator Modal */}
      {showStatusCreator && currentUser && (
        <StatusCreatorModal
          onPostStatus={(status) => {
            storage.createStatus(status);
            setStatuses(storage.getStatuses());
            setShowStatusCreator(false);
          }}
          onClose={() => setShowStatusCreator(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && currentUser && (
        <SettingsModal
          currentUser={currentUser}
          theme={theme}
          wallpaper={wallpaper}
          blockedUsers={blockedUsers}
          allContacts={contacts}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={(up) => {
            const next = { ...currentUser, ...up };
            storage.setCurrentUser(next);
            syncUserProfileToFirestore(next);
            setCurrentUser(next);
          }}
          onUpdateTheme={(t) => storage.setTheme(t)}
          onUpdateWallpaper={(w) => storage.setWallpaper(w)}
          onLogout={() => {
            storage.logout();
            setCurrentUser(null);
            setShowSettings(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Audio / Video Call Modal */}
      {activeCall && activeChat && currentUser && (
        <CallModal
          contactName={activeChat.name}
          contactAvatar={activeChat.avatar}
          isGroup={activeChat.type === 'group' || activeChat.type === 'room'}
          initialType={activeCall.type}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* Cryptographic Inspector Modal */}
      {inspectorMessage && (
        <EncryptionInspectorModal
          message={inspectorMessage}
          onClose={() => setInspectorMessage(null)}
        />
      )}

      {/* Security Safety Number Modal */}
      {securityCodeContact && (
        <SecurityCodeModal
          contactName={securityCodeContact.name}
          contactId={securityCodeContact.id}
          currentUserId={currentUser?.id || 'current_user'}
          onClose={() => setSecurityCodeContact(null)}
        />
      )}

      {/* Media Viewer Modal */}
      {mediaViewerData && (
        <MediaViewer
          mediaUrl={mediaViewerData.url}
          fileName={mediaViewerData.fileName}
          onClose={() => setMediaViewerData(null)}
        />
      )}

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <ForwardModal
          chats={chats}
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          onForwardToChats={handleForwardToMultiple}
        />
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <CameraCaptureModal
          onCapture={(dataUrl) => {
            handleSendMessage('Photo', 'image', { mediaUrl: dataUrl });
            setShowCameraModal(false);
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationModal && (
        <LocationPickerModal
          onSend={(loc) => {
            handleSendMessage(loc.name || 'Shared Location', 'location', { locationData: loc });
            setShowLocationModal(false);
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {/* Poll Creation Modal */}
      {showPollModal && (
        <PollModal
          onSend={(poll) => {
            handleSendMessage(poll.question, 'poll', { pollData: poll });
            setShowPollModal(false);
          }}
          onClose={() => setShowPollModal(false)}
        />
      )}

    </div>
  );
}
