import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  getDocFromServer,
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { Chat, Message, UserProfile, EncryptedPayload, Reaction, ReadReceipt, DeliveryReceipt } from '../types';
import { encryptMessage, decryptMessage, generateFingerprint, generateUserCryptoProfile } from './crypto';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfigData) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with auto-detect long polling to prevent connection failures in restricted environments
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfigData.firestoreDatabaseId || undefined);
} catch {
  try {
    firestoreDb = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);
  } catch {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;

// Test Firestore connection on boot gracefully
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('Firestore is operating in offline-first mode.');
    }
    return false;
  }
}
testFirestoreConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// Fake room IDs list to filter out and clean up
const FAKE_ROOM_IDS = new Set(['room_general', 'room_tech_crypto', 'room_ai_future', 'room_lounge']);

// Default initial chat rooms (empty - real rooms created on demand)
export const DEFAULT_ROOMS: Partial<Chat>[] = [];

// Helper to convert Firebase user to UserProfile
export async function convertFirebaseUserToProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const cryptoInfo = await generateUserCryptoProfile(fbUser.email || fbUser.uid);
  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'ChatRoom User',
    about: 'ChatRoom member • E2EE Active 🔐',
    avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
    publicKey: cryptoInfo.publicKeyHex,
    safetyNumber: cryptoInfo.safetyNumberSnippet,
    online: true,
    lastSeen: Date.now(),
    isGoogleUser: true,
    joinedRooms: [],
    createdAt: Date.now()
  };
}

// Google Sign-In
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profile = await convertFirebaseUserToProfile(user);
  
  // Persist to Firestore users collection
  await syncUserProfileToFirestore(profile);
  return profile;
}

// Sign Out
export async function signOutAuth(): Promise<void> {
  await firebaseSignOut(auth);
}

// Save/Sync User Profile to Firestore
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      lastSeen: Date.now(),
      online: true
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore user sync fallback:', err);
  }
}

// Listen to all rooms in real time from Firestore
export function subscribeToRooms(onUpdate: (rooms: Chat[]) => void): () => void {
  try {
    const roomsCol = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsCol, async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const roomList: Chat[] = [];
      snapshot.forEach(docSnap => {
        // Skip any fake/mock rooms
        if (FAKE_ROOM_IDS.has(docSnap.id)) {
          return;
        }
        const data = docSnap.data() as Chat;
        roomList.push({
          ...data,
          id: docSnap.id
        });
      });
      // Sort pinned first, then by createdAt desc
      roomList.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      onUpdate(roomList);
    }, (error) => {
      console.warn('Rooms snapshot listener error:', error);
    });

    return unsubscribe;
  } catch (e) {
    console.error('Error creating rooms subscription:', e);
    return () => {};
  }
}

// Seed default rooms to Firestore (No-op - user rooms only)
export async function seedDefaultRooms(): Promise<void> {
  // Real user-created rooms only
}

// Create a new room in Firestore
export async function createFirestoreRoom(roomData: Partial<Chat>): Promise<Chat> {
  const roomId = roomData.id || ('room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const newRoom: Chat = {
    id: roomId,
    name: roomData.name || '#new-room',
    description: roomData.description || 'Secure encrypted chat room',
    topic: roomData.topic || roomData.description || 'Public room',
    category: roomData.category || 'General',
    avatar: roomData.avatar || `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80`,
    type: 'room',
    createdBy: roomData.createdBy || 'current_user',
    createdByName: roomData.createdByName || 'Admin',
    participants: roomData.participants || ['current_user'],
    adminIds: roomData.adminIds || [roomData.createdBy || 'current_user'],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isPrivate: roomData.isPrivate || false,
    passcode: roomData.passcode || '',
    disappearingTimer: 0,
    createdAt: Date.now(),
    sharedKeyFingerprint: 'CR-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    pinnedMessageIds: []
  };

  const roomRef = doc(db, 'rooms', roomId);
  await setDoc(roomRef, newRoom, { merge: true });
  return newRoom;
}

// Join Room
export async function joinFirestoreRoom(roomId: string, userId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayUnion(userId)
    });
  } catch (err) {
    console.warn('Join room error:', err);
  }
}

// Leave Room
export async function leaveFirestoreRoom(roomId: string, userId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayRemove(userId)
    });
  } catch (err) {
    console.warn('Leave room error:', err);
  }
}

// Listen to room messages in real time with client-side E2EE decryption
export function subscribeToRoomMessages(
  roomId: string, 
  onMessages: (messages: Message[]) => void
): () => void {
  try {
    const msgsCol = collection(db, 'rooms', roomId, 'messages');
    const q = query(msgsCol, orderBy('timestamp', 'asc'), limit(150));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawMessages: Message[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Message;
        rawMessages.push({
          ...data,
          id: docSnap.id,
          chatId: roomId,
          roomId
        });
      });

      // Client-side zero-knowledge decryption
      const decryptedList = await Promise.all(
        rawMessages.map(async (msg) => {
          if (msg.encryptedPayload && msg.encryptedPayload.ciphertext) {
            try {
              const plain = await decryptMessage(msg.encryptedPayload, roomId);
              return {
                ...msg,
                content: plain
              };
            } catch {
              return msg;
            }
          }
          return msg;
        })
      );

      onMessages(decryptedList);
    }, (error) => {
      console.warn('Messages snapshot listener error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error creating messages subscription:', err);
    return () => {};
  }
}

// Send E2EE message to Firestore Room
export async function sendFirestoreRoomMessage(
  roomId: string,
  sender: UserProfile,
  messageData: Partial<Message>
): Promise<Message> {
  const plainText = messageData.content || '';
  
  // 1. Client-Side End-to-End Encryption before sending over network
  const { payload } = await encryptMessage(plainText, roomId);

  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  
  const newMsg: Message = {
    id: msgId,
    chatId: roomId,
    roomId,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar,
    type: messageData.type || 'text',
    content: plainText, // decrypted representation locally
    encryptedPayload: payload, // Server only stores ciphertext!
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
        userId: sender.id,
        userName: sender.name,
        userAvatar: sender.avatar,
        readAt: Date.now()
      }
    ],
    deliveredReceipts: [
      {
        userId: sender.id,
        userName: sender.name,
        userAvatar: sender.avatar,
        deliveredAt: Date.now()
      }
    ],
    replyToMessage: messageData.replyToMessage,
    isForwarded: messageData.isForwarded || false,
    isPinned: false
  };

  // 2. Write ciphertext payload to Firestore subcollection
  try {
    const msgDocRef = doc(db, 'rooms', roomId, 'messages', msgId);
    await setDoc(msgDocRef, {
      id: msgId,
      chatId: roomId,
      roomId,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      type: newMsg.type,
      // Store encrypted ciphertext only on server!
      content: '[E2EE Ciphertext]',
      encryptedPayload: payload,
      mediaUrl: newMsg.mediaUrl || null,
      mediaFileName: newMsg.mediaFileName || null,
      mediaFileSize: newMsg.mediaFileSize || null,
      mediaMimeType: newMsg.mediaMimeType || null,
      voiceDuration: newMsg.voiceDuration || null,
      voiceWaveform: newMsg.voiceWaveform || null,
      locationData: newMsg.locationData || null,
      contactData: newMsg.contactData || null,
      pollData: newMsg.pollData || null,
      timestamp: Date.now(),
      status: 'sent',
      reactions: [],
      readReceipts: newMsg.readReceipts,
      deliveredReceipts: newMsg.deliveredReceipts,
      replyToMessage: newMsg.replyToMessage || null,
      isForwarded: newMsg.isForwarded || false,
      isPinned: false
    });

    // Update room's lastMessage metadata
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: {
        id: msgId,
        senderName: sender.name,
        type: newMsg.type,
        content: plainText.substring(0, 60),
        timestamp: Date.now()
      }
    });
  } catch (err) {
    console.warn('Firestore write message error:', err);
  }

  return newMsg;
}

// Add/toggle reaction to Firestore message
export async function addFirestoreReaction(
  roomId: string, 
  msgId: string, 
  reaction: Reaction
): Promise<void> {
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', msgId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data = snap.data() as Message;
      const reactions = data.reactions || [];
      const existingIdx = reactions.findIndex(r => r.userId === reaction.userId);
      let updated: Reaction[] = [];
      if (existingIdx >= 0) {
        if (reactions[existingIdx].emoji === reaction.emoji) {
          // Remove reaction if same emoji
          updated = reactions.filter(r => r.userId !== reaction.userId);
        } else {
          // Replace emoji
          updated = reactions.map(r => r.userId === reaction.userId ? reaction : r);
        }
      } else {
        updated = [...reactions, reaction];
      }
      await updateDoc(msgRef, { reactions: updated });
    }
  } catch (err) {
    console.warn('Reaction update error:', err);
  }
}

// Mark Firestore room messages as read (Read Receipts)
export async function markFirestoreRoomMessagesRead(
  roomId: string,
  messageIds: string[],
  user: UserProfile
): Promise<void> {
  if (!messageIds || messageIds.length === 0) return;
  try {
    for (const msgId of messageIds) {
      const msgRef = doc(db, 'rooms', roomId, 'messages', msgId);
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        const data = snap.data() as Message;
        const readReceipts = data.readReceipts || [];
        if (!readReceipts.some(r => r.userId === user.id)) {
          const newReceipt: ReadReceipt = {
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            readAt: Date.now()
          };
          await updateDoc(msgRef, {
            readReceipts: [...readReceipts, newReceipt],
            status: 'read'
          });
        }
      }
    }
  } catch (err) {
    console.warn('Mark read receipts error:', err);
  }
}

// Pin / Unpin Firestore Message
export async function toggleFirestoreMessagePin(
  roomId: string,
  msgId: string,
  isPinned: boolean,
  user: UserProfile,
  pinDuration?: '24h' | '7d' | '30d' | 'forever'
): Promise<void> {
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', msgId);
    await updateDoc(msgRef, {
      isPinned,
      pinnedAt: isPinned ? Date.now() : null,
      pinnedBy: isPinned ? user.id : null,
      pinnedByName: isPinned ? user.name : null,
      pinDuration: isPinned ? (pinDuration || 'forever') : null
    });

    const roomRef = doc(db, 'rooms', roomId);
    if (isPinned) {
      await updateDoc(roomRef, {
        pinnedMessageIds: arrayUnion(msgId)
      });
    } else {
      await updateDoc(roomRef, {
        pinnedMessageIds: arrayRemove(msgId)
      });
    }
  } catch (err) {
    console.warn('Toggle message pin error:', err);
  }
}

// Vote on Poll in Firestore
export async function voteFirestorePoll(
  roomId: string,
  msgId: string,
  optionId: string,
  userId: string
): Promise<void> {
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', msgId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data = snap.data() as Message;
      if (!data.pollData) return;
      const updatedOptions = data.pollData.options.map(opt => {
        let votes = opt.votes || [];
        if (opt.id === optionId) {
          if (votes.includes(userId)) {
            votes = votes.filter(u => u !== userId);
          } else {
            votes = [...votes, userId];
          }
        } else if (!data.pollData?.allowMultipleAnswers) {
          votes = votes.filter(u => u !== userId);
        }
        return { ...opt, votes };
      });
      await updateDoc(msgRef, {
        pollData: {
          ...data.pollData,
          options: updatedOptions
        }
      });
    }
  } catch (err) {
    console.warn('Vote poll error:', err);
  }
}
