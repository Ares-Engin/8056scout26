import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "scout.html";
  } catch (e) {
    error.innerText = e.message;
  }
};

window.register = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "scout.html";
  } catch (e) {
    error.innerText = e.message;
  }
};
