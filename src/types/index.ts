export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'voice' 
  | 'document' 
  | 'video' 
  | 'location' 
  | 'contact' 
  | 'poll' 
  | 'system';

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

export interface ReadReceipt {
  userId: string;
  userName: string;
  userAvatar?: string;
  readAt: number;
}

export interface DeliveryReceipt {
  userId: string;
  userName: string;
  userAvatar?: string;
  deliveredAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactData {
  name: string;
  phone: string;
  about?: string;
  avatar?: string;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
  authTag?: string;   // base64 (if separate)
  algorithm: string;  // e.g. 'AES-GCM-256'
  fingerprint: string;// short hash of recipient/session key
  encryptedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  roomId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string; // Plaintext when decrypted, or displayed fallback
  encryptedPayload?: EncryptedPayload; // Raw cryptographic payload
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaMimeType?: string;
  voiceDuration?: number; // in seconds
  voiceWaveform?: number[]; // normalized amplitude array [0..100]
  locationData?: LocationData;
  contactData?: ContactData;
  pollData?: PollData;
  timestamp: number;
  status: MessageStatus;
  reactions: Reaction[];
  readReceipts?: ReadReceipt[];
  deliveredReceipts?: DeliveryReceipt[];
  replyToMessage?: {
    id: string;
    senderName: string;
    type: MessageType;
    content: string;
    mediaUrl?: string;
  };
  isForwarded?: boolean;
  isStarred?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean; // "This message was deleted"
  deletedForEveryone?: boolean;
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
  pinnedByName?: string;
  pinDuration?: '24h' | '7d' | '30d' | 'forever';
  expiresAt?: number; // For disappearing messages (timestamp)
}

export interface UserProfile {
  id: string;
  uid?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  name: string;
  about: string;
  avatar: string;
  publicKey?: string;
  safetyNumber?: string;
  online: boolean;
  lastSeen: number;
  customWallpaper?: string;
  disappearingTimerDefault?: number;
  joinedRooms?: string[];
  isGoogleUser?: boolean;
  createdAt?: number;
}

export type ChatType = 'room' | 'direct' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar: string;
  about?: string;
  topic?: string;
  category?: string;
  description?: string;
  createdBy?: string;
  createdByName?: string;
  participants: string[]; // User IDs
  adminIds?: string[];    // User IDs
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isPrivate?: boolean;
  passcode?: string;
  disappearingTimer: number; // 0 = off
  createdAt: number;
  customWallpaper?: string;
  draft?: string;
  sharedKeyFingerprint: string;
  pinnedMessageIds?: string[];
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'image' | 'text';
  content: string;
  caption?: string;
  backgroundColor?: string;
  fontStyle?: string;
  timestamp: number;
  expiresAt: number;
  viewers: {
    userId: string;
    userName: string;
    userAvatar: string;
    viewedAt: number;
  }[];
}

export interface CallSession {
  id: string;
  chatId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId?: string;
  receiverName?: string;
  receiverAvatar?: string;
  isGroup: boolean;
  type: 'voice' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed';
  startTime?: number;
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export type AppTheme = 'dark' | 'light' | 'oled';
export type WallpaperStyle = 'default' | 'doodle-dark' | 'doodle-light' | 'emerald' | 'navy' | 'charcoal' | 'custom';
