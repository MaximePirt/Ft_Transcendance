# Google OAuth Documentation


## Base URL

```
http://localhost:3003/auth
```

---

## Flux d'Authentification Google OAuth

### Schéma du processus

```
1. Frontend → Redirection vers Google
   └─> Click sur "Sign in with Google"
   └─> Redirige vers: http://localhost:3003/auth/google

2. Backend Auth → Génère l'URL Google OAuth
   └─> Redirige l'utilisateur vers Google

3. Utilisateur → Se connecte sur Google
   └─> Autorise l'application
   └─> Google redirige vers: http://localhost:3003/auth/google/callback

4. Backend Auth → Récupère les infos utilisateur
   └─> Cherche ou crée l'utilisateur dans User Service
   └─> Redirige vers: http://localhost:5173/auth/success?userId=X&email=Y&username=Z

5. Frontend → Page de succès
   └─> Récupère les infos utilisateur depuis l'URL
   └─> Stocke dans localStorage
   └─> **ICI GENERER LE JWT**
   └─> Redirige vers /home
```

---

## 🛣️ Routes API

### 1. Initier la connexion Google

Démarre le processus OAuth Google.

**Endpoint:** `GET /auth/google`

**Utilisation Frontend:**
```typescript
// Dans le bouton "Sign in with Google"
googleBtn.addEventListener('click', () => {
    window.location.href = 'http://localhost:3003/auth/google';
});
```

**Résultat:** L'utilisateur est redirigé vers Google pour se connecter.

---

### 2. Callback Google (automatique)

Route appelée automatiquement par Google après l'authentification.

**Endpoint:** `GET /auth/google/callback`

**Paramètres (Query):**
- `code` - Code d'autorisation Google (géré automatiquement)
- `state` - Token de sécurité CSRF (géré automatiquement)

**Résultat:** Redirige vers la page de succès avec les infos utilisateur.

---

### 3. Status du service

Vérifier que le service auth est opérationnel.

**Endpoint:** `GET /auth/status`

**Réponse:**
```json
{
  "status": "ok",
  "service": "auth",
  "google_oauth": "configured"
}
```

---

## Données Utilisateur Retournées

Après l'authentification Google réussie, l'utilisateur est redirigé vers :

```
http://localhost:5173/auth/success?userId=1&email=user@example.com&username=UserName
```

### Structure des paramètres URL

| Paramètre  | Type   | Description |
|------------|--------|-------------|
| `userId`   | string | ID de l'utilisateur dans la base de données |
| `email`    | string | Email Google de l'utilisateur |
| `username` | string | Nom d'utilisateur (nom Google ou début de l'email) |

---


## Gestion JWT (À faire)

### Ce qui est déjà fait

1. ✅ Google OAuth configuré
2. ✅ Utilisateur authentifié par Google
3. ✅ Utilisateur créé/récupéré dans la base de données
4. ✅ Infos utilisateur transmises au frontend

### Ce qui reste à faire 

Créer un **service JWT** qui :

1. **Génère un JWT** à partir des infos utilisateur
2. **Stocke le JWT** dans localStorage (ou cookie httpOnly)
3. **Valide le JWT** sur chaque requête API
