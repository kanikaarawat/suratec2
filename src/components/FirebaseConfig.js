// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzpRo78lPJRv01Tv-wxD4Aq_Y-9TI69D0",
  authDomain: "surasoles-cloud.firebaseapp.com",
  databaseURL: "https://surasoles-cloud.firebaseio.com",
  projectId: "surasoles-cloud",
  storageBucket: "surasoles-cloud.appspot.com",
  messagingSenderId: "1000915057889",
  appId: "1:1000915057889:web:4d5fa8d7e098b0febf0ba0",
  measurementId: "G-M3FBWVBMKE"
};

const app = initializeApp(firebaseConfig);
export default app;