import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fandomData from './src/lib/fandoms.json';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function uploadRegistry() {
  console.log("Starting SYNK_REGISTRY upload...");
  
  try {
    for (const group of fandomData) {
      console.log(`Uploading ${group.meta.displayName}...`);
      await setDoc(doc(db, 'fandom_registry', group.groupId), group);
    }
    console.log("Registry upload COMPLETE.");
    process.exit(0);
  } catch (err) {
    console.error("Registry upload FAILED:", err);
    process.exit(1);
  }
}

uploadRegistry();
