import { initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import data
const fandomDataPath = path.resolve(__dirname, '../src/lib/fandoms.json');
const fandomData = JSON.parse(fs.readFileSync(fandomDataPath, 'utf8'));

// Load config
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

let app;
try {
  app = getApp();
} catch (e) {
  // Try to use service account if it exists, otherwise use project ID (ADC)
  const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: config.projectId,
    });
  } else {
    app = initializeApp({
      projectId: config.projectId,
    });
  }
}

const db = getFirestore(app, config.firestoreDatabaseId);

async function uploadFandoms(fandomData: any[]) {
  console.log("Starting persistence seeding for SYNKIFY Registry...");
  
  for (const group of fandomData) {
    const docRef = db.collection('fandom_registry').doc(group.groupId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Only upload if the record doesn't exist to prevent overriding image seeds
      await docRef.set({
        ...group,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      });
      console.log(`Success: Registered ${group.groupId} (${group.meta.displayName})`);
    } else {
      console.log(`Skip: ${group.groupId} already exists in registry.`);
    }
  }
  
  console.log("Seeding complete.");
}

uploadFandoms(fandomData).catch((err) => {
  console.error("Critical Error during seeding:");
  console.error(err);
  process.exit(1);
});
