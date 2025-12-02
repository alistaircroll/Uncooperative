import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUIcXSmo0kJtIS7n15j50mQzU12sMrbDE",
    authDomain: "uncooperative-v1.firebaseapp.com",
    databaseURL: "https://uncooperative-v1-default-rtdb.firebaseio.com",
    projectId: "uncooperative-v1",
    storageBucket: "uncooperative-v1.firebasestorage.app",
    messagingSenderId: "440987989948",
    appId: "1:440987989948:web:9e27a8d3489b985ebc5db9",
    measurementId: "G-WD2S4BVHFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
