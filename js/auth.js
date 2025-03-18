// Configurar o provedor do Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Função para fazer login com Google
function loginWithGoogle() {
  return auth.signInWithPopup(googleProvider)
    .then((result) => {
      // Usuário logado com sucesso
      const user = result.user;
      console.log("Usuário logado:", user.displayName);
      return user;
    })
    .catch((error) => {
      console.error("Erro no login:", error);
      throw error;
    });
}

// Função para fazer logout
function logout() {
  return auth.signOut()
    .then(() => {
      console.log("Usuário deslogado");
    })
    .catch((error) => {
      console.error("Erro no logout:", error);
    });
}

// Função para verificar o estado de autenticação
function checkAuthState(callback) {
  return auth.onAuthStateChanged(callback);
}

// Função para obter o usuário atual
function getCurrentUser() {
  return auth.currentUser;
}

// Função para salvar dados do usuário no Firestore
function saveUserData(userId, data) {
  return db.collection('users').doc(userId).set(data, { merge: true });
}

// Função para salvar dados do usuário no Firestore
function saveUserDataToFirestore(userId, data) {
    return db.collection('users').doc(userId).set(data, { merge: true });
  }
  
  // Função para obter dados do usuário do Firestore
  function getUserData(userId) {
    return db.collection('users').doc(userId).get()
      .then((doc) => {
        if (doc.exists) {
          return doc.data();
        } else {
          return null;
        }
      });
  }