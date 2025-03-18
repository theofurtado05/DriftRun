// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA5ftdQgU7gAejVQ_clkAcePMmLO01u9hM",
    authDomain: "driftrun-bdb54.firebaseapp.com",
    projectId: "driftrun-bdb54",
    storageBucket: "driftrun-bdb54.firebasestorage.app",
    messagingSenderId: "951022738374",
    appId: "1:951022738374:web:b144fb24392b2ffbb830c7",
    measurementId: "G-6FBEP1VJ9Y"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Referências para serviços do Firebase
  const auth = firebase.auth();
  const db = firebase.firestore();