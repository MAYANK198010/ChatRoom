import { 
  Chat, Message, StatusItem, UserProfile, AppTheme, 
  WallpaperStyle, PollOption, ReadReceipt, DeliveryReceipt, Reaction 
} from '../types';
import { INITIAL_CHATS, INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_STATUSES, SMART_AUTO_REPLIES } from './mockData';
import { encryptMessage, generateUserCryptoProfile } from './crypto';
import { soundService } from './audio';

const STORAGE_KEYS = {
  CURRENT_USER: 'cipherchat_current_user',
  CHATS: 'cipherchat_chats',
  CONTACTS: 'cipherchat_contacts',
  STATUSES: 'cipherchat_statuses',
  THEME: 'cipherchat_theme',
  WALLPAPER: 'cipherchat_wallpaper',
  BLOCKED_USERS: 'cipherchat_blocked',
  SETTINGS: 'cipherchat_settings',
  ALL_ACCOUNTS: 'cipherchat_accounts'
};

// Broadcast channel for multi-tab synchronization
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('cipherchat_sync_channel')
  : null;

const FAKE_ROOM_IDS = new Set(['room_general', 'room_tech_crypto', 'room_ai_future', 'room_lounge']);

export class StorageService {
  private listeners: Set<(event: { type: string; data: any }) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDefaultData();
      this.startDisappearingMessageCleaner();

      if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
          this.notifyListeners(event.data.type, event.data.data, false);
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('cipherchat_')) {
          this.notifyListeners('storage_update', { key: e.key });
        }
      });
    }
  }

  public subscribe(callback: (event: { type: string; data: any }) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(type: string, data: any, broadcast = true) {
    this.listeners.forEach(cb => {
      try {
        cb({ type, data });
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });

    if (broadcast && broadcastChannel) {
      broadcastChannel.postMessage({ type, data });
    }
  }

  private initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    }
    
    // Sanitize any existing cached chats to purge fake rooms
    const existingRawChats = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (existingRawChats) {
      try {
        const parsed: Chat[] = JSON.parse(existingRawChats);
        const sanitized = parsed.filter(c => c && !FAKE_ROOM_IDS.has(c.id));
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sanitized));
      } catch {
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(INITIAL_CHATS));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(INITIAL_CHATS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.STATUSES)) {
      localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(INITIAL_STATUSES));
    }

    // Init initial messages for each chat if not present
    Object.entries(INITIAL_MESSAGES).forEach(([chatId, msgs]) => {
      const msgKey = `cipherchat_msgs_${chatId}`;
      if (!localStorage.getItem(msgKey)) {
        localStorage.setItem(msgKey, JSON.stringify(msgs));
      }
    });

    // Remove legacy fake room message stores
    FAKE_ROOM_IDS.forEach(fakeId => {
      localStorage.removeItem(`cipherchat_msgs_${fakeId}`);
    });
  }

  // --- Current User Auth & Profile ---
  public getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public async setCurrentUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    // Save to all accounts list
    const accounts = this.getAllAccounts();
    const existingIdx = accounts.findIndex(a => a.id === user.id);
    if (existingIdx >= 0) {
      accounts[existingIdx] = user;
    } else {
      accounts.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.ALL_ACCOUNTS, JSON.stringify(accounts));

    this.notifyListeners('user_updated', user);
  }

  public getAllAccounts(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_ACCOUNTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notifyListeners('user_logged_out', null);
  }

  // --- Contacts ---
  public getContacts(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public addContact(contact: UserProfile) {
    const contacts = this.getContacts();
    contacts.push(contact);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    this.notifyListeners('contacts_updated', contacts);
  }

  // --- Chats ---
  public getChats(): Chat[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!raw) return [];
    try {
      const list: Chat[] = JSON.parse(raw);
      return Array.isArray(list) ? list.filter(c => c && !FAKE_ROOM_IDS.has(c.id)) : [];
    } catch {
      return [];
    }
  }

  public saveChats(chats: Chat[]) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    this.notifyListeners('chats_updated', chats);
  }

  public getChat(chatId: string): Chat | undefined {
    return this.getChats().find(c => c.id === chatId);
  }

  public updateChat(chatId: string, updates: Partial<Chat>) {
    const chats = this.getChats();
    const idx = chats.findIndex(c => c.id === chatId);
    if (idx >= 0) {
      chats[idx] = { ...chats[idx], ...updates };
      this.saveChats(chats);
    }
  }

  public createChat(chat: Chat) {
    const chats = this.getChats();
    const existing = chats.find(c => c.id === chat.id);
    if (!existing) {
      chats.unshift(chat);
      this.saveChats(chats);
    }
    return chat;
  }

  // --- Messages ---
  public getMessages(chatId: string): Message[] {
    const key = `cipherchat_msgs_${chatId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const msgs: Message[] = JSON.parse(raw);
      // Filter out expired disappearing messages
      const now = Date.now();
      const valid = msgs.filter(m => !m.expiresAt || m.expiresAt > now);
      if (valid.length !== msgs.length) {
        localStorage.setItem(key, JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  }

  public saveMessages(chatId: string, messages: Message[]) {
    const key = `cipherchat_msgs_${chatId}`;
    localStorage.setItem(key, JSON.stringify(messages));
    this.notifyListeners('messages_updated', { chatId, messages });
  }

  public async sendMessage(chatId: string, messageData: Partial<Message>): Promise<Message> {
    const currentUser = this.getCurrentUser();
    const chat = this.getChat(chatId);

    const senderId = currentUser?.id || 'current_user';
    const senderName = currentUser?.name || 'You';
    const senderAvatar = currentUser?.avatar;

    const fullMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      chatId,
      senderId,
      senderName,
      senderAvatar,
      type: messageData.type || 'text',
      content: messageData.content || '',
      mediaUrl: messageData.mediaUrl,
      mediaFileName: messageData.mediaFileName,
      mediaFileSize: messageData.mediaFileSize,
      mediaMimeType: messageData.mediaMimeType,
      voiceDuration: messageData.voiceDuration,
      voiceWaveform: messageData.voiceWaveform,
      locationData: messageData.locationData,
      contactData: messageData.contactData,
      pollData: messageData.pollData,
      timestamp: Date.now(),
      status: 'sent',
      reactions: [],
      readReceipts: [
        {
          userId: senderId,
          userName: senderName,
          userAvatar: senderAvatar,
          readAt: Date.now()
        }
      ],
      deliveredReceipts: [
        {
          userId: senderId,
          userName: senderName,
          userAvatar: senderAvatar,
          deliveredAt: Date.now()
        }
      ],
      replyToMessage: messageData.replyToMessage,
      isForwarded: messageData.isForwarded,
      isPinned: false,
      expiresAt: chat?.disappearingTimer && chat.disappearingTimer > 0 
        ? Date.now() + chat.disappearingTimer * 1000 
        : undefined
    };

    // Encrypt payload with Web Crypto AES-GCM
    try {
      const plainPayload = fullMessage.content || fullMessage.mediaFileName || 'encrypted-data';
      const encResult = await encryptMessage(plainPayload, chatId);
      fullMessage.encryptedPayload = encResult.payload;
    } catch (e) {
      console.warn('Encryption step error:', e);
    }

    const messages = this.getMessages(chatId);
    messages.push(fullMessage);
    this.saveMessages(chatId, messages);

    // Update chat last message
    this.updateChat(chatId, {
      lastMessage: fullMessage,
      draft: ''
    });

    // Sound effect
    soundService.playSentSound();

    // Trigger simulated reply if chatting with virtual contact or group
    this.scheduleSimulatedContactReply(chatId, fullMessage);

    return fullMessage;
  }

  public updateMessage(chatId: string, messageId: string, updates: Partial<Message>) {
    const messages = this.getMessages(chatId);
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      messages[idx] = { ...messages[idx], ...updates };
      this.saveMessages(chatId, messages);
    }
  }

  public deleteMessage(chatId: string, messageId: string, forEveryone: boolean) {
    const messages = this.getMessages(chatId);
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      if (forEveryone) {
        messages[idx] = {
          ...messages[idx],
          isDeleted: true,
          deletedForEveryone: true,
          content: 'This message was deleted',
          mediaUrl: undefined,
          voiceWaveform: undefined,
          pollData: undefined,
          locationData: undefined
        };
      } else {
        messages.splice(idx, 1);
      }
      this.saveMessages(chatId, messages);

      // Update chat lastMessage if needed
      const chat = this.getChat(chatId);
      if (chat && chat.lastMessage?.id === messageId) {
        const remaining = this.getMessages(chatId);
        this.updateChat(chatId, {
          lastMessage: remaining[remaining.length - 1]
        });
      }
    }
  }

  // --- Message Pinning ---
  public togglePinMessage(
    chatId: string, 
    messageId: string, 
    isPinned: boolean, 
    user?: UserProfile,
    duration?: '24h' | '7d' | '30d' | 'forever'
  ) {
    const currentUser = user || this.getCurrentUser();
    const messages = this.getMessages(chatId);
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      messages[idx] = {
        ...messages[idx],
        isPinned,
        pinnedAt: isPinned ? Date.now() : undefined,
        pinnedBy: isPinned ? (currentUser?.id || 'current_user') : undefined,
        pinnedByName: isPinned ? (currentUser?.name || 'You') : undefined,
        pinDuration: isPinned ? (duration || 'forever') : undefined
      };
      this.saveMessages(chatId, messages);

      // Update chat pinnedMessageIds
      const chat = this.getChat(chatId);
      if (chat) {
        let pinnedIds = chat.pinnedMessageIds || [];
        if (isPinned) {
          if (!pinnedIds.includes(messageId)) pinnedIds = [...pinnedIds, messageId];
        } else {
          pinnedIds = pinnedIds.filter(id => id !== messageId);
        }
        this.updateChat(chatId, { pinnedMessageIds: pinnedIds });
      }
    }
  }

  // --- Message Reactions ---
  public addReaction(chatId: string, messageId: string, emoji: string, user?: UserProfile) {
    const currentUser = user || this.getCurrentUser();
    const userId = currentUser?.id || 'current_user';
    const userName = currentUser?.name || 'You';
    const userAvatar = currentUser?.avatar;

    const messages = this.getMessages(chatId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    msg.reactions = msg.reactions || [];
    const existingReactionIdx = msg.reactions.findIndex(r => r.userId === userId);

    if (existingReactionIdx >= 0) {
      if (msg.reactions[existingReactionIdx].emoji === emoji) {
        // Toggle off (remove reaction)
        msg.reactions.splice(existingReactionIdx, 1);
      } else {
        // Replace reaction with new emoji
        msg.reactions[existingReactionIdx].emoji = emoji;
        msg.reactions[existingReactionIdx].timestamp = Date.now();
      }
    } else {
      // Add new reaction
      msg.reactions.push({
        emoji,
        userId,
        userName,
        userAvatar,
        timestamp: Date.now()
      });
    }

    this.saveMessages(chatId, messages);
  }

  public votePoll(chatId: string, messageId: string, optionId: string) {
    const currentUser = this.getCurrentUser();
    const userId = currentUser?.id || 'current_user';

    const messages = this.getMessages(chatId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.pollData) return;

    const poll = msg.pollData;
    poll.options.forEach((opt: PollOption) => {
      if (opt.id === optionId) {
        if (opt.votes.includes(userId)) {
          opt.votes = opt.votes.filter(id => id !== userId);
        } else {
          opt.votes.push(userId);
        }
      } else if (!poll.allowMultipleAnswers) {
        opt.votes = opt.votes.filter(id => id !== userId);
      }
    });

    this.saveMessages(chatId, messages);
  }

  // --- Read Receipts ---
  public markChatAsRead(chatId: string, user?: UserProfile) {
    const currentUser = user || this.getCurrentUser();
    const userId = currentUser?.id || 'current_user';
    const userName = currentUser?.name || 'You';
    const userAvatar = currentUser?.avatar;

    const messages = this.getMessages(chatId);
    let changed = false;

    messages.forEach(m => {
      if (m.senderId !== userId) {
        m.readReceipts = m.readReceipts || [];
        if (!m.readReceipts.some(r => r.userId === userId)) {
          m.readReceipts.push({
            userId,
            userName,
            userAvatar,
            readAt: Date.now()
          });
          changed = true;
        }

        m.deliveredReceipts = m.deliveredReceipts || [];
        if (!m.deliveredReceipts.some(d => d.userId === userId)) {
          m.deliveredReceipts.push({
            userId,
            userName,
            userAvatar,
            deliveredAt: Date.now()
          });
          changed = true;
        }

        if (m.status !== 'read') {
          m.status = 'read';
          changed = true;
        }
      }
    });

    if (changed) {
      this.saveMessages(chatId, messages);
    }

    // Reset unread count on chat
    this.updateChat(chatId, { unreadCount: 0 });
  }

  // --- Status Stories ---
  public getStatuses(): StatusItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STATUSES);
    if (!raw) return [];
    try {
      const all: StatusItem[] = JSON.parse(raw);
      const now = Date.now();
      const valid = all.filter(s => s.expiresAt > now);
      if (valid.length !== all.length) {
        localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  }

  public addStatus(status: Partial<StatusItem>): StatusItem {
    const currentUser = this.getCurrentUser();
    const newStatus: StatusItem = {
      id: 'st_' + Date.now(),
      userId: currentUser?.id || 'current_user',
      userName: currentUser?.name || 'You',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: status.type || 'text',
      content: status.content || '',
      caption: status.caption,
      backgroundColor: status.backgroundColor || '#075E54',
      fontStyle: status.fontStyle || 'sans',
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewers: []
    };

    const statuses = this.getStatuses();
    statuses.unshift(newStatus);
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
    this.notifyListeners('statuses_updated', statuses);
    return newStatus;
  }

  public createStatus(status: Partial<StatusItem>) {
    return this.addStatus(status);
  }

  public deleteStatus(statusId: string) {
    const statuses = this.getStatuses().filter(s => s.id !== statusId);
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
    this.notifyListeners('statuses_updated', statuses);
  }

  public markStatusAsViewed(statusId: string) {
    const currentUser = this.getCurrentUser();
    const userId = currentUser?.id || 'current_user';
    const userName = currentUser?.name || 'You';
    const userAvatar = currentUser?.avatar || '';

    const statuses = this.getStatuses();
    const status = statuses.find(s => s.id === statusId);
    if (status && status.userId !== userId) {
      if (status.viewers.some(v => v.userId === userId)) return;
      status.viewers.push({
        userId,
        userName,
        userAvatar,
        viewedAt: Date.now()
      });
      localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
      this.notifyListeners('statuses_updated', statuses);
    }
  }

  // --- Settings & Themes ---
  public getTheme(): AppTheme {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'dark';
  }

  public setTheme(theme: AppTheme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.remove('dark', 'light', 'oled');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    if (theme === 'oled') document.documentElement.classList.add('dark', 'oled');
    this.notifyListeners('theme_updated', theme);
  }

  public getWallpaper(): WallpaperStyle {
    return (localStorage.getItem(STORAGE_KEYS.WALLPAPER) as WallpaperStyle) || 'doodle-dark';
  }

  public setWallpaper(wallpaper: WallpaperStyle) {
    localStorage.setItem(STORAGE_KEYS.WALLPAPER, wallpaper);
    this.notifyListeners('wallpaper_updated', wallpaper);
  }

  public getBlockedUsers(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public toggleBlockUser(userId: string): boolean {
    const blocked = this.getBlockedUsers();
    let isBlocked = false;
    if (blocked.includes(userId)) {
      const filtered = blocked.filter(id => id !== userId);
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(filtered));
      isBlocked = false;
    } else {
      blocked.push(userId);
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(blocked));
      isBlocked = true;
    }
    this.notifyListeners('blocked_updated', isBlocked);
    return isBlocked;
  }

  public clearAllData() {
    localStorage.clear();
    this.initDefaultData();
  }

  // --- Background Cleaner for Disappearing Messages ---
  private startDisappearingMessageCleaner() {
    setInterval(() => {
      const chats = this.getChats();
      const now = Date.now();
      chats.forEach(chat => {
        const msgs = this.getMessages(chat.id);
        const valid = msgs.filter(m => !m.expiresAt || m.expiresAt > now);
        if (valid.length !== msgs.length) {
          this.saveMessages(chat.id, valid);
        }
      });
    }, 60000);
  }

  // --- Interactive Smart Automated Simulator for Demo Realism ---
  private scheduleSimulatedContactReply(chatId: string, outgoingMsg: Message) {
    const chat = this.getChat(chatId);
    if (!chat) return;

    // Direct chats or group chats
    let targetUserId = '';
    if (chat.type === 'direct') {
      targetUserId = chat.participants.find(p => p !== 'current_user' && p !== outgoingMsg.senderId) || '';
    } else {
      // Pick random participant from group
      const otherParts = chat.participants.filter(p => p !== 'current_user' && p !== outgoingMsg.senderId);
      targetUserId = otherParts[Math.floor(Math.random() * otherParts.length)] || '';
    }

    if (!targetUserId) return;

    const contact = this.getContacts().find(c => c.id === targetUserId);
    if (!contact) return;

    // 1. Mark as Delivered (Double grey ticks)
    setTimeout(() => {
      const msgs = this.getMessages(chatId);
      const msg = msgs.find(m => m.id === outgoingMsg.id);
      if (msg) {
        msg.status = 'delivered';
        msg.deliveredReceipts = msg.deliveredReceipts || [];
        if (!msg.deliveredReceipts.some(d => d.userId === contact.id)) {
          msg.deliveredReceipts.push({
            userId: contact.id,
            userName: contact.name,
            userAvatar: contact.avatar,
            deliveredAt: Date.now()
          });
        }
        this.saveMessages(chatId, msgs);
      }
    }, 900);

    // 2. Mark as Read (Double blue ticks)
    setTimeout(() => {
      const msgs = this.getMessages(chatId);
      const msg = msgs.find(m => m.id === outgoingMsg.id);
      if (msg) {
        msg.status = 'read';
        msg.readReceipts = msg.readReceipts || [];
        if (!msg.readReceipts.some(r => r.userId === contact.id)) {
          msg.readReceipts.push({
            userId: contact.id,
            userName: contact.name,
            userAvatar: contact.avatar,
            readAt: Date.now()
          });
        }
        this.saveMessages(chatId, msgs);
      }
    }, 1800);

    // 3. Typing indicator
    setTimeout(() => {
      this.notifyListeners('user_typing', { chatId, userId: targetUserId, userName: contact.name });
    }, 2200);

    // 4. Send incoming reply + possible reaction
    setTimeout(async () => {
      this.notifyListeners('user_stop_typing', { chatId, userId: targetUserId });

      // Occasionally add a reaction to the outgoing message
      if (Math.random() > 0.4) {
        const reactionEmojis = ['🔥', '👍', '❤️', '👏', '🎉', '🔒'];
        const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        this.addReaction(chatId, outgoingMsg.id, randomEmoji, contact);
      }

      const replyPool = SMART_AUTO_REPLIES[targetUserId] || [
        "Received loud and clear! 🔒",
        "Awesome, looks great! Synced in real-time.",
        "Thanks for the update! E2EE verified.",
        "Let's sync up on this in the room."
      ];

      const replyText = replyPool[Math.floor(Math.random() * replyPool.length)];

      const incomingMsg: Message = {
        id: 'msg_reply_' + Date.now(),
        chatId,
        senderId: contact.id,
        senderName: contact.name,
        senderAvatar: contact.avatar,
        type: 'text',
        content: replyText,
        timestamp: Date.now(),
        status: 'read',
        reactions: [],
        readReceipts: [
          {
            userId: contact.id,
            userName: contact.name,
            userAvatar: contact.avatar,
            readAt: Date.now()
          }
        ],
        deliveredReceipts: [
          {
            userId: contact.id,
            userName: contact.name,
            userAvatar: contact.avatar,
            deliveredAt: Date.now()
          }
        ],
        replyToMessage: outgoingMsg.type === 'image' || outgoingMsg.type === 'voice' ? {
          id: outgoingMsg.id,
          senderName: outgoingMsg.senderName,
          type: outgoingMsg.type,
          content: outgoingMsg.content,
          mediaUrl: outgoingMsg.mediaUrl
        } : undefined
      };

      try {
        const encResult = await encryptMessage(incomingMsg.content, chatId);
        incomingMsg.encryptedPayload = encResult.payload;
      } catch (e) {
        console.warn('Reply encryption error:', e);
      }

      const msgs = this.getMessages(chatId);
      msgs.push(incomingMsg);
      this.saveMessages(chatId, msgs);

      this.updateChat(chatId, {
        lastMessage: incomingMsg,
        unreadCount: (chat.unreadCount || 0) + 1
      });

      soundService.playReceivedSound();
    }, 3800);
  }
}

export const storage = new StorageService();
