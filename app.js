// === Config Firebase (à remplacer par la tienne) ===
const firebaseConfig = {
  apiKey: "AIzaSyBN5lO0zt_zI3qdh2vzJ30TEOdx16tpRbI",
  authDomain: "fallmapsv2.firebaseapp.com",
  projectId: "fallmapsv2",
  storageBucket: "fallmapsv2.firebasestorage.app",
  messagingSenderId: "6916105475",
  appId: "1:6916105475:web:76afeb37e2d466c7dff536",
  measurementId: "G-TES1TH5SPM"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// === Elements ===
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const mapForm = document.getElementById("mapForm");
const mapsList = document.getElementById("mapsList");

let currentUser = null;

// === Auth ===
loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

logoutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    currentUser = null;
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
});

// === Publier une map ===
mapForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Connecte-toi pour publier !");
    return;
  }

  const code = document.getElementById("code").value.trim();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const type = document.getElementById("type").value;
  const difficulty = document.getElementById("difficulty").value;
  const file = document.getElementById("image").files[0];

  // Vérif du format XXXX-XXXX-XXXX
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!regex.test(code)) {
    alert("Le code doit être au format XXXX-XXXX-XXXX !");
    return;
  }

  let imageUrl = "";
  if (file) {
    const storageRef = storage.ref("maps/" + Date.now() + "-" + file.name);
    await storageRef.put(file);
    imageUrl = await storageRef.getDownloadURL();
  }

  await db.collection("maps").add({
    code, title, description, type, difficulty,
    imageUrl,
    creator: currentUser.displayName,
    creatorId: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  mapForm.reset();
});

// === Afficher les maps ===
db.collection("maps").orderBy("createdAt", "desc").onSnapshot(snapshot => {
  mapsList.innerHTML = "";
  snapshot.forEach(doc => {
    const map = doc.data();
    const div = document.createElement("div");
    div.className = "card pad";
    div.innerHTML = `
      ${map.imageUrl ? `<img src="${map.imageUrl}" class="img-hero">` : ""}
      <h3>${map.title}</h3>
      <p class="muted">${map.description || ""}</p>
      <p><span class="badge">${map.type}</span> Difficulté : ${"⭐".repeat(map.difficulty)}</p>
      <p class="small">Code : <b>${map.code}</b></p>
      <p class="small">Créateur : ${map.creator}</p>
    `;
    mapsList.appendChild(div);
  });
});
