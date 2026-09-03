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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storage.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !storage.getCurrentUser());
  const [chats, setChats] = useState<Chat[]>(() => storage.getChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const list = storage.getChats();
    return list.length > 0 ? list[0].id : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<UserProfile[]>(() => storage.getContacts());
  const [statuses, setStatuses] = useState<StatusItem[]>(() => storage.getStatuses());
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => storage.getBlockedUsers());
  const [theme, setTheme] = useState<AppTheme>(() => storage.getTheme());
  const [wallpaper, setWallpaper] = useState<WallpaperStyle>(() => storage.getWallpaper());
  const [typingUser, setTypingUser] = useState<{ chatId: string; userName: string } | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showExploreRoomsModal, setShowExploreRoomsModal] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video' } | null>(null);
  const [inspectorMessage, setInspectorMessage] = useState<Message | null>(null);
  const [securityCodeContact, setSecurityCodeContact] = useState<{ id: string; name: string } | null>(null);
  const [mediaViewerData, setMediaViewerData] = useState<{ url: string; fileName?: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  useEffect(() => {
    const unsubRooms = subscribeToRooms((firestoreRooms) => {
      setChats(prev => {
        if (!firestoreRooms || firestoreRooms.length === 0) return prev;
        const merged = [...firestoreRooms];
        prev.forEach(localChat => {
          if (!merged.some(m => m.id === localChat.id)) merged.push(localChat);
        });
        storage.saveChats(merged);
        return merged;
      });
    });
    return () => unsubRooms();
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const localMsgs = storage.getMessages(activeChatId);
    setMessages(localMsgs);
    storage.markChatAsRead(activeChatId);
    const active = chats.find(c => c.id === activeChatId);
    const isRoom = activeChatId.startsWith('room_') || active?.type === 'room';
    if (isRoom) {
      const unsubMsgs = subscribeToRoomMessages(activeChatId, (liveMessages) => {
        setMessages(liveMessages);
        storage.saveMessages(activeChatId, liveMessages);
      });
      return () => unsubMsgs();
    }
  }, [activeChatId, chats]);

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
        if (event.data.chatId === activeChatId) setMessages(event.data.messages);
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
    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    storage.setTheme(theme);
  }, [theme]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeContact = activeChat && activeChat.type === 'direct'
    ? contacts.find(c => activeChat.participants.includes(c.id) && c.id !== currentUser?.id)
    : undefined;

  const handleSelectChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    setShowRightDrawer(false);
  };

  const handleSendMessage = async (content: string, type: any = 'text', extra: any = {}) => {
    if (!activeChatId || !currentUser) return;
    const isRoom = activeChatId.startsWith('room_') || activeChat?.type === 'room';
    if (isRoom) {
      await sendFirestoreRoomMessage(activeChatId, currentUser, { type, content, ...extra });
      storage.sendMessage(activeChatId, { type, content, ...extra });
    } else {
      await storage.sendMessage(activeChatId, { type, content, ...extra });
      setMessages(storage.getMessages(activeChatId));
      setChats(storage.getChats());
    }
  };

  const handleStartCall = (type: 'voice' | 'video') => setActiveCall({ type });
  const handleOpenVerifySecurityCode = () => {
    if (activeChat) {
      const targetId = activeChat.type === 'direct'
        ? activeChat.participants.find(p => p !== currentUser?.id) || 'user_sarah'
        : activeChat.id;
      setSecurityCodeContact({ id: targetId, name: activeChat.name });
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
      storage.updateChat(room.id, { participants: Array.from(new Set([...room.participants, currentUser.id])) });
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
      id: 'usr_c_' + Date.now(), phone, countryCode: '+1', name,
      about: 'ChatRoom member 🔐',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      online: true, lastSeen: Date.now()
    };
    storage.addContact(newContact);
    setContacts(storage.getContacts());
    const newChat: Chat = {
      id: 'chat_' + newContact.id, type: 'direct', name: newContact.name,
      avatar: newContact.avatar, about: newContact.about,
      participants: [currentUser?.id || 'current_user', newContact.id], unreadCount: 0,
      isPinned: false, isMuted: false, isArchived: false, disappearingTimer: 0,
      createdAt: Date.now(), sharedKeyFingerprint: 'CC-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase()
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
          id: 'chat_' + contact.id, type: 'direct', name: contact.name, avatar: contact.avatar,
          about: contact.about, participants: [currentUser?.id || 'current_user', contact.id],
          unreadCount: 0, isPinned: false, isMuted: false, isArchived: false,
          disappearingTimer: 0, createdAt: Date.now(), sharedKeyFingerprint: 'CC-AES-ST'
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
    chatIds.forEach(cId => storage.sendMessage(cId, {
      type: forwardingMessage.type, content: forwardingMessage.content,
      mediaUrl: forwardingMessage.mediaUrl, mediaFileName: forwardingMessage.mediaFileName,
      mediaFileSize: forwardingMessage.mediaFileSize, voiceDuration: forwardingMessage.voiceDuration,
      voiceWaveform: forwardingMessage.voiceWaveform, locationData: forwardingMessage.locationData,
      pollData: forwardingMessage.pollData, isForwarded: true
    }));
    setChats(storage.getChats());
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f0f2f5] text-[#1c1e21] font-sans">
      <header className="h-10 bg-white border-b border-[#e4e6eb] px-4 flex items-center justify-between text-xs shrink-0 select-none z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#1c1e21]"><div className="w-5 h-5 bg-gradient-to-tr from-[#0084ff] to-indigo-600 rounded-md flex items-center justify-center text-white text-[10px]"><Hash className="w-3.5 h-3.5" /></div><span className="text-sm font-black tracking-tight">ChatRoom</span></div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-green-200/50"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span>Firestore Live Sync</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExploreRoomsModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0084ff] font-bold rounded-lg transition cursor-pointer text-xs"><Compass className="w-3.5 h-3.5" /><span>Explore Rooms</span></button>
          {currentUser && <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition cursor-pointer text-xs font-semibold text-gray-700" title="Click to view profile & settings"><img src={currentUser.avatar} alt={currentUser.name} className="w-4 h-4 rounded-md object-cover" /><span className="max-w-[120px] truncate">{currentUser.name}</span></button>}
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`h-full ${activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
          {currentUser && <Sidebar currentUser={currentUser} chats={chats} contacts={contacts} statuses={statuses} activeChatId={activeChatId} typingUser={typingUser} onSelectChat={handleSelectChat} onSelectContact={(c) => { const contactExists = contacts.some(ct => ct.id === c.id || (ct.phone && c.phone && ct.phone === c.phone)); if (!contactExists) return; let chat = chats.find(ch => ch.type === 'direct' && ch.participants.includes(c.id)); if (!chat) { chat = storage.createChat({ id: 'chat_' + c.id, type: 'direct', name: c.name, avatar: c.avatar, about: c.about, participants: [currentUser.id, c.id], unreadCount: 0, isPinned: false, isMuted: false, isArchived: false, disappearingTimer: 0, createdAt: Date.now(), sharedKeyFingerprint: 'CC-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase() }); setChats(storage.getChats()); } setActiveChatId(chat.id); }} onOpenNewChat={() => setShowNewChatModal(true)} onOpenNewGroup={() => setShowNewGroupModal(true)} onOpenCreateRoom={() => setShowCreateRoomModal(true)} onOpenExploreRooms={() => setShowExploreRoomsModal(true)} onOpenStatusViewer={() => setShowStatusViewer(true)} onOpenStatusCreator={() => setShowStatusCreator(true)} onOpenSettings={() => setShowSettings(true)} onLogout={() => { storage.logout(); setCurrentUser(null); setShowAuthModal(true); }} />}
        </div>
        <div className={`flex-1 h-full flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChat && currentUser ? <div className="flex-1 flex h-full overflow-hidden"><ChatArea chat={activeChat} messages={messages} currentUser={currentUser} allUsers={[...contacts, currentUser]} typingUser={typingUser} wallpaper={wallpaper} onBack={() => setActiveChatId(null)} onSendMessage={handleSendMessage} onStartCall={handleStartCall} onOpenContactInfo={() => setShowRightDrawer(!showRightDrawer)} onOpenVerifySecurityCode={handleOpenVerifySecurityCode} onOpenEncryptionInspector={(msg) => setInspectorMessage(msg)} onOpenMediaViewer={(url, fileName) => setMediaViewerData({ url, fileName })} onOpenCameraModal={() => setShowCameraModal(true)} onOpenLocationModal={() => setShowLocationModal(true)} onOpenPollModal={() => setShowPollModal(true)} onReactToMessage={(msgId, emoji) => { const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_'); if (isRoom) addFirestoreReaction(activeChat.id, msgId, { emoji, userId: currentUser.id, userName: currentUser.name, timestamp: Date.now() }); storage.addReaction(activeChat.id, msgId, emoji, currentUser); }} onStarMessage={(msgId) => { const m = messages.find(msg => msg.id === msgId); if (m) storage.updateMessage(activeChat.id, msgId, { isStarred: !m.isStarred }); }} onForwardMessage={(msg) => setForwardingMessage(msg)} onEditMessage={(msg) => storage.updateMessage(activeChat.id, msg.id, { content: msg.content, isEdited: true })} onDeleteMessage={(msgId, forEveryone) => storage.deleteMessage(activeChat.id, msgId, forEveryone)} onVotePoll={(msgId, optId) => { const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_'); if (isRoom) voteFirestorePoll(activeChat.id, msgId, optId, currentUser.id); storage.votePoll(activeChat.id, msgId, optId); }} onTogglePin={(msgId, isPinned, duration) => { const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_'); if (isRoom) toggleFirestoreMessagePin(activeChat.id, msgId, isPinned, currentUser); storage.togglePinMessage(activeChat.id, msgId, isPinned, currentUser, duration); }} onMarkAsRead={(msgIds) => { const isRoom = activeChat.type === 'room' || activeChat.id.startsWith('room_'); if (isRoom) markFirestoreRoomMessagesRead(activeChat.id, msgIds, currentUser); storage.markChatAsRead(activeChat.id, currentUser); }} />{showRightDrawer && (activeChat.type === 'direct' ? <ContactInfoDrawer contact={activeContact} currentUser={currentUser} onClose={() => setShowRightDrawer(false)} onBlock={(id) => { storage.blockUser(id); setBlockedUsers(storage.getBlockedUsers()); }} onUnblock={(id) => { storage.unblockUser(id); setBlockedUsers(storage.getBlockedUsers()); }} /> : activeChat.type === 'group' ? <GroupInfoDrawer chat={activeChat} currentUser={currentUser} contacts={contacts} onClose={() => setShowRightDrawer(false)} /> : <RoomInfoDrawer chat={activeChat} currentUser={currentUser} contacts={contacts} onClose={() => setShowRightDrawer(false)} onLeave={() => handleLeaveRoom(activeChat.id)} />)}</div> : <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]"><div className="text-center"><div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mx-auto mb-5 text-[#0084ff]"><Hash className="w-10 h-10" /></div><h2 className="text-xl font-black">ChatRoom</h2><p className="text-xs text-gray-500 mt-1">Select a chat to start messaging</p></div></div>}
        </div>
      </div>
      {showNewChatModal && <NewChatModal contacts={contacts} onClose={() => setShowNewChatModal(false)} onStartChat={(chat) => { storage.createChat(chat); setChats(storage.getChats()); setActiveChatId(chat.id); setShowNewChatModal(false); }} />}
      {showNewGroupModal && <NewGroupModal contacts={contacts} currentUser={currentUser} onClose={() => setShowNewGroupModal(false)} onCreateGroup={handleCreateNewGroup} />}
      {showCreateRoomModal && <CreateRoomModal currentUser={currentUser} onClose={() => setShowCreateRoomModal(false)} onCreate={handleCreateRoom} />}
      {showExploreRoomsModal && <ExploreRoomsModal currentUser={currentUser} onClose={() => setShowExploreRoomsModal(false)} onJoin={handleJoinRoom} />}
      {showSettings && currentUser && <SettingsModal currentUser={currentUser} onClose={() => setShowSettings(false)} onUpdate={(u) => { storage.setCurrentUser(u); syncUserProfileToFirestore(u); }} onThemeChange={setTheme} onWallpaperChange={setWallpaper} />}
      {activeCall && <CallModal type={activeCall.type} contactName={activeChat?.name || 'Contact'} onClose={() => setActiveCall(null)} />}
      {showStatusViewer && <StatusViewerModal statuses={statuses} contacts={contacts} currentUser={currentUser} onClose={() => setShowStatusViewer(false)} onReply={handleStatusReply} />}
      {showStatusCreator && currentUser && <StatusCreatorModal currentUser={currentUser} onClose={() => setShowStatusCreator(false)} onCreated={(s) => { storage.addStatus(s); setStatuses(storage.getStatuses()); }} />}
      {inspectorMessage && <EncryptionInspectorModal message={inspectorMessage} onClose={() => setInspectorMessage(null)} />}
      {securityCodeContact && <SecurityCodeModal contact={securityCodeContact} onClose={() => setSecurityCodeContact(null)} />}
      {mediaViewerData && <MediaViewer url={mediaViewerData.url} fileName={mediaViewerData.fileName} onClose={() => setMediaViewerData(null)} />}
      {showCameraModal && <CameraCaptureModal onClose={() => setShowCameraModal(false)} onCapture={(url) => { setShowCameraModal(false); handleSendMessage(url, 'image', { mediaUrl: url }); }} />}
      {showLocationModal && <LocationPickerModal onClose={() => setShowLocationModal(false)} onSend={(location: LocationData) => { setShowLocationModal(false); handleSendMessage('Shared location', 'location', { locationData: location }); }} />}
      {showPollModal && <PollModal onClose={() => setShowPollModal(false)} onCreate={(poll: PollData) => { setShowPollModal(false); handleSendMessage(poll.question, 'poll', { pollData: poll }); }} />}
      {forwardingMessage && <ForwardModal message={forwardingMessage} chats={chats} currentUser={currentUser} onClose={() => setForwardingMessage(null)} onForward={handleForwardToMultiple} />}
      {!currentUser && showAuthModal && <AuthModal onSuccess={(user) => { setCurrentUser(user); setShowAuthModal(false); }} />}
    </div>
  );
}
