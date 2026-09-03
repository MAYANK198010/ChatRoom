import { storage } from './storage';
import { ensureFirebaseAuth } from './userDirectory';
import { UserProfile } from '../types';

// The UI historically used local profile IDs (usr_..., user_sarah, etc.).
// Firestore security rules use Firebase Auth UID as the canonical identity.
// Normalize the profile before it reaches localStorage so room/message writes
// and the /users/{uid} document use the same identity.
const originalSetCurrentUser = storage.setCurrentUser.bind(storage);

storage.setCurrentUser = (async (profile: UserProfile) => {
  try {
    const firebaseUser = await ensureFirebaseAuth();
    const canonical: UserProfile = {
      ...profile,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
    };

    // Mutate the caller's object too. Existing auth handlers call sync after
    // setCurrentUser and then pass that same object to React state.
    Object.assign(profile, canonical);
    await originalSetCurrentUser(canonical);
  } catch (error) {
    console.warn('Firebase authentication bootstrap failed; keeping local profile:', error);
    await originalSetCurrentUser(profile);
  }
}) as typeof storage.setCurrentUser;
