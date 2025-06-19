// setup-face-models.js
// Script to download face-api.js models

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`Created directory: ${MODELS_DIR}`);
}

// List of model files to download
const modelFiles = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1.weights',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1.weights',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1.weights',
  'face_recognition_model-shard2.weights'
];

// Download a file
function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(MODELS_DIR, filename);
    const fileUrl = `${BASE_URL}/${filename}`;
    
    console.log(`Downloading ${filename}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all model files
async function downloadAllModels() {
  console.log('Starting download of face-api.js models...');
  
  try {
    for (const file of modelFiles) {
      await downloadFile(file);
    }
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
  }
}

downloadAllModels();