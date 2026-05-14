import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connected successfully");
  } catch (error: any) {
    if(error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
      // This is also a form of success for a connection test (server reached)
       console.log("Firestore reachability confirmed (permission denied as expected)");
    } else {
      console.error("Firestore connection error:", error);
      // Optional: use standard handler for non-offline/non-permission errors
      // handleFirestoreError(error, OperationType.GET, 'test/connection');
    }
  }
}

testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
 