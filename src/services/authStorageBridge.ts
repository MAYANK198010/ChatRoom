import { storage } from './storage';
import { ensureFirebaseAuth } from './userDirectory';
import { UserProfile } from '../types';

// Firestore rules use Firebase Auth UID as the canonical identity. Older
// ChatRoom profiles used local ids, so normalize them before persistence.
const originalSetCurrentUser = storage.setCurrentUser.bind(storage);

storage.setCurrentUser = (async (profile: UserProfile) => {
  try {
    const firebaseUser = await ensureFirebaseAuth();
    const canonical: UserProfile = {
      ...profile,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
    };

    Object.assign(profile, canonical);
    await originalSetCurrentUser(canonical);
  } catch (error) {
    console.warn('Firebase authentication bootstrap failed; keeping local profile:', error);
    await originalSetCurrentUser(profile);
  }
}) as typeof storage.setCurrentUser;

// Migrate an already-saved local profile when the app is upgraded. This runs
// asynchronously so it never blocks the first React render.
const existingProfile = storage.getCurrentUser();
if (existingProfile) {
  void storage.setCurrentUser(existingProfile).catch((error) => {
    console.warn('Existing profile migration failed:', error);
  });
}
