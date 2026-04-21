import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  subscriptionStatus: 'free' | 'pro' | 'annual';
  plan: 'free' | 'pro' | 'annual';
  points: number;
  createdAt?: any;
  updatedAt?: any;
}

export const syncUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const newUser: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Analista',
      photoURL: firebaseUser.photoURL || '',
      subscriptionStatus: 'free',
      plan: 'free',
      points: 100, // Welcome points
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newUser);
    console.log("User registered");
    console.log("User synced with Firestore");
    return newUser;
  }

  const existingData = userDoc.data() as UserProfile;
  await updateDoc(userDocRef, {
    updatedAt: serverTimestamp()
  });
  console.log("User logged in");
  console.log("User synced with Firestore");

  return { ...existingData, updatedAt: new Date() };
};

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
};
