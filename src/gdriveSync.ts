import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { BellSchedule, BellSettings } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If logged in but no token, we can sign out or handle gracefully.
        // Usually, in-memory is cleared on reload, so user must log in again
        // to populate token, or we sign out to stay in sync.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Pop-up
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Kesalahan masuk Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign Out
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export interface SyncData {
  schedules: BellSchedule[];
  settings: BellSettings;
  lastSynced: number;
}

const FILE_NAME = 'bel_sekolah_sync.json';

/**
 * Searches for 'bel_sekolah_sync.json' in user's Drive.
 * Returns the file ID if found, or null otherwise.
 */
export async function findSyncFile(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Error finding sync file:', errText);
      return null;
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Error in findSyncFile:', err);
    return null;
  }
}

/**
 * Downloads the JSON content of the sync file.
 */
export async function downloadSyncFile(token: string, fileId: string): Promise<SyncData | null> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Error downloading sync file:', errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error downloading sync file:', err);
    return null;
  }
}

/**
 * Uploads (creates or updates) the sync file content.
 */
export async function uploadSyncFile(token: string, schedules: BellSchedule[], settings: BellSettings): Promise<boolean> {
  try {
    const fileId = await findSyncFile(token);
    const syncData: SyncData = {
      schedules,
      settings,
      lastSynced: Date.now()
    };
    const bodyStr = JSON.stringify(syncData, null, 2);

    if (fileId) {
      // Update existing file content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: bodyStr
      });
      return res.ok;
    } else {
      // Create new file metadata first
      const metadataUrl = 'https://www.googleapis.com/drive/v3/files';
      const metaRes = await fetch(metadataUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: FILE_NAME,
          mimeType: 'application/json'
        })
      });

      if (!metaRes.ok) {
        const errText = await metaRes.text();
        console.error('Failed to create file metadata in Drive:', errText);
        return false;
      }

      const metaData = await metaRes.json();
      const newFileId = metaData.id;

      // Upload content to the newly created file
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: bodyStr
      });
      return res.ok;
    }
  } catch (err) {
    console.error('Error uploading sync file:', err);
    return false;
  }
}
