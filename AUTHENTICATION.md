# Autentizační systém GURMAO.cz

## 📋 Současný stav (MVP v1.0)

### ❌ Co NENÍ implementováno:
- Backend server
- Databáze uživatelů
- Autentizace API
- Synchronizace mezi zařízeními
- Email verifikace
- Reset hesla funkčnost

### ✅ Co JE implementováno:
- UI pro přihlášení/registraci (login.html)
- Mock přihlášení do localStorage
- Základní formuláře
- Google SSO tlačítko (nefunkční - jen UI)

---

## 🎯 Plán implementace autentizace

### Fáze 1: Backend výběr

#### Možnost A: Firebase Authentication (Doporučeno pro rychlý start)

**Výhody:**
- ✅ Rychlá integrace (2-3 hodiny)
- ✅ Zdarma do 10k uživatelů
- ✅ Built-in Google SSO
- ✅ Email/password out of box
- ✅ Reset hesla automaticky
- ✅ SDK pro JavaScript

**Implementace:**
```javascript
// 1. Přidat Firebase SDK
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>

// 2. Initialize
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gurmao-cz.firebaseapp.com",
  projectId: "gurmao-cz",
};
firebase.initializeApp(firebaseConfig);

// 3. Login
firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Přihlášeno
    const user = userCredential.user;
  });

// 4. Google SSO
const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider);
```

#### Možnost B: Supabase (Doporučeno pro komplexní aplikace)

**Výhody:**
- ✅ Open source
- ✅ PostgreSQL databáze
- ✅ Real-time subscriptions
- ✅ Row Level Security
- ✅ REST API automaticky
- ✅ Zdarma tier

**Implementace:**
```javascript
// 1. Přidat Supabase SDK
import { createClient } from '@supabase/supabase-js'

// 2. Initialize
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// 3. Signup
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
})

// 4. Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})

// 5. Google SSO
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})
```

#### Možnost C: Vlastní backend (Node.js + Express)

**Pro pokročilé použití:**
```javascript
// Backend: Express + JWT
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Ověř heslo v DB
  const user = await db.findUserByEmail(email);
  const valid = await bcrypt.compare(password, user.passwordHash);
  
  if (valid) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    res.json({ token });
  }
});
```

---

## 🔧 Implementační kroky (Firebase - nejrychlejší)

### Krok 1: Vytvoření Firebase projektu

```bash
# 1. Jdi na https://console.firebase.google.com/
# 2. Create new project: "gurmao-cz"
# 3. Enable Authentication
# 4. Enable Email/Password provider
# 5. Enable Google provider
# 6. Zkopíruj config
```

### Krok 2: Přidat Firebase do projektu

Vytvoř `firebase-config.js`:
```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "gurmao-cz.firebaseapp.com",
  projectId: "gurmao-cz",
  storageBucket: "gurmao-cz.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Krok 3: Upravit login.html

```javascript
// Místo mock funkcí:
import { auth, googleProvider } from './firebase-config.js';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

// Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Ulož user info
    localStorage.setItem('gurmao_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0]
    }));
    
    window.location.href = 'feed.html';
  } catch (error) {
    alert('Chyba: ' + error.message);
  }
});

// Google SSO
document.getElementById('btnGoogle').addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    localStorage.setItem('gurmao_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }));
    
    window.location.href = 'feed.html';
  } catch (error) {
    alert('Chyba: ' + error.message);
  }
});
```

### Krok 4: Přidat Firestore pro data

```javascript
// Místo localStorage pro collections
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

const db = getFirestore(app);

// Uložit restauraci
async function saveRestaurant(userId, restaurantId) {
  await addDoc(collection(db, 'users', userId, 'saved'), {
    restaurantId: restaurantId,
    timestamp: Date.now()
  });
}

// Načíst sbírky
async function getSavedRestaurants(userId) {
  const snapshot = await getDocs(collection(db, 'users', userId, 'saved'));
  return snapshot.docs.map(doc => doc.data().restaurantId);
}
```

---

## 🎨 UI komponenty k přidání

### User Menu (v headeru)

```html
<!-- Když není přihlášen -->
<a href="login.html" class="px-5 py-2 rounded-full border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition">
  Přihlásit se
</a>

<!-- Když je přihlášen -->
<div class="relative" id="userMenu">
  <button class="w-10 h-10 rounded-full bg-gurmaogold text-black font-bold">
    J
  </button>
  
  <!-- Dropdown -->
  <div class="hidden absolute right-0 mt-2 w-48 rounded-2xl bg-gurmaoblack border border-white/10 p-2">
    <a href="collections.html" class="block px-4 py-2 rounded-xl hover:bg-white/5">Sbírky</a>
    <a href="profile.html" class="block px-4 py-2 rounded-xl hover:bg-white/5">Profil</a>
    <button id="btnLogout" class="w-full text-left px-4 py-2 rounded-xl hover:bg-white/5 text-red-400">Odhlásit se</button>
  </div>
</div>
```

### Protected routes

```javascript
// auth-guard.js
export function requireAuth() {
  const user = JSON.parse(localStorage.getItem('gurmao_user') || 'null');
  
  if (!user || !user.uid) {
    window.location.href = 'login.html?redirect=' + window.location.pathname;
    return false;
  }
  
  return true;
}

// V collections.html
import { requireAuth } from './auth-guard.js';
requireAuth(); // Přesměruje na login, pokud není přihlášen
```

---

## 📊 Databázová struktura

### Firestore Collections

```
users/
  {userId}/
    profile/
      - name
      - email
      - photoURL
      - createdAt
    
    saved/
      {savedId}/
        - restaurantId
        - timestamp
        - notes (optional)
    
    reviews/
      {reviewId}/
        - restaurantId
        - rating
        - text
        - timestamp

restaurants/
  {restaurantId}/
    - name
    - city
    - vibe
    - images[]
    - description
    - saveCount (counter)
    - avgRating
```

---

## ⏱️ Časový odhad implementace

### Firebase (Doporučeno pro rychlý start)
- **Setup Firebase projekt:** 30 minut
- **Integrace do login.html:** 1 hodina
- **Migrace localStorage → Firestore:** 2 hodiny
- **User menu a protected routes:** 1 hodina
- **Testování:** 1 hodina
- **CELKEM: ~5 hodin práce**

### Supabase
- **Setup Supabase projekt:** 30 minut
- **Integrace autentizace:** 1.5 hodiny
- **Databázové schéma:** 1 hodina
- **Migrace dat:** 2 hodiny
- **RLS (Row Level Security):** 1 hodina
- **CELKEM: ~6 hodin práce**

### Vlastní backend
- **Node.js + Express setup:** 2 hodiny
- **JWT autentizace:** 2 hodiny
- **PostgreSQL schema:** 1 hodina
- **API endpointy:** 3 hodiny
- **Security (bcrypt, rate limiting):** 1 hodina
- **CELKEM: ~9 hodin práce**

---

## 🔒 Security best practices

### Checklist:
- [ ] HTTPS only (GitHub Pages má automaticky)
- [ ] Validace emailu
- [ ] Silná hesla (min 8 znaků, čísla, symboly)
- [ ] Rate limiting na login
- [ ] Email verifikace před použitím
- [ ] 2FA (volitelné)
- [ ] CSRF protection
- [ ] XSS sanitization
- [ ] SQL injection prevence (prepared statements)

---

## 🚀 Doporučený postup

### Pro GURMAO MVP → Production:

1. **Fáze 1: Firebase Auth (týden 1)**
   - Implementuj Firebase Authentication
   - Email/password + Google SSO
   - User menu v headeru
   - Protected routes

2. **Fáze 2: Firestore Data (týden 2)**
   - Migrace localStorage → Firestore
   - Real-time synchronizace sbírek
   - User profiles

3. **Fáze 3: Advanced Features (týden 3-4)**
   - Reviews & ratings
   - Following systém
   - Notifications
   - Search & filters

4. **Fáze 4: Optimization (týden 5)**
   - Caching
   - Performance monitoring
   - Analytics
   - Error tracking (Sentry)

---

## 💰 Costs (Firebase)

```
Spark (Free tier):
- 10k authentications/měsíc: FREE
- 50k reads/den: FREE
- 20k writes/den: FREE
- 1 GB storage: FREE

⚠️ Pro startup je FREE tier dostatečný!

Blaze (Pay as you go):
- Nad limity: $0.06 per 100k reads
- Pro 1000 aktivních uživatelů: ~$5-10/měsíc
```

---

## 📝 Aktuální TODO

Pro aktivaci autentizace:

```bash
# 1. Vytvoř Firebase projekt
https://console.firebase.google.com/

# 2. Přidej Firebase SDK do projektu
npm install firebase  # nebo CDN

# 3. Nahraď mock funkce v login.html

# 4. Přidej user menu do headeru

# 5. Implementuj logout funkci

# 6. Chraň Collections stránku

# 7. Migrace localStorage → Firestore

# 8. Deploy a test
```

---

**Status:** 📋 Plán připraven, UI vytvořeno, čeká na backend integraci

**Doporučení:** Začni s Firebase - je to nejrychlejší cesta k funkční autentizaci!
