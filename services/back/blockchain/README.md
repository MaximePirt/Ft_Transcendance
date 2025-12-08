# Blockchain module


### 1. Sauvegarder un Score

Enregistrer un score de tournoi sur la blockchain.

**Endpoint:** `POST /tournament/score`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": "1",
  "player1": "Alice",
  "player2": "Bob",
  "player3": "",
  "player4": "",
  "team1Score": "5",
  "team2Score": "3",
  "winner": "team1"
}
```

**Parametres:**

| Champ        | Type   | Obligatoire | Description 
|--------------|--------|-------------|-------------
| `id`         | string | oui         | ID unique du tournoi 
| `player1`    | string | oui         | Nom du joueur 1 (equipe 1)
| `player2`    | string | oui         | Nom du joueur 2 (equipe 2)
| `player3`    | string | non         | Nom du joueur 3 (equipe 1) - optionnel
| `player4`    | string | non         | Nom du joueur 4 (equipe 2) - optionnel
| `team1Score` | string | oui         | Score de l'equipe 1 (doit etre >= 0)
| `team2Score` | string | oui         | Score de l'equipe 2 (doit etre >= 0)
| `winner`     | string | oui         | Gagnant: `"team1"` ou `"team2"` 

**Reponse (Succes - 200):**
```json
{
  "success": true,
  "transactionHash": "0x1234567890abcdef...",
  "explorerUrl": "https://testnet.snowtrace.io/tx/0x1234567890abcdef...",
  "message": "Score saved successfully on blockchain"
}
```

**Reponse (Erreur - 400):**
```json
{
  "success": false,
  "error": "Missing required fields: id, player1, player2"
}
```

**R�ponse (Erreur - 500):**
```json
{
  "success": false,
  "error": "Failed to add score: <error message>"
}
```

---

### 3. Recuperer un Score

Lire un score de tournoi depuis la blockchain.

**Endpoint:** `GET /tournament/score/:id`

**Parametres URL:**
- `:id` - ID du tournoi (ex: `1`, `2`, `3`, etc.)

**Exemple:**
```
GET /tournament/score/1
```

**Reponse (Succes - 200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "player1": "Alice",
    "player2": "Bob",
    "player3": "",
    "player4": "",
    "team1Score": "5",
    "team2Score": "3",
    "winner": "team1"
  }
}
```

**R�ponse (Erreur - 500):**
```json
{
  "success": false,
  "error": "Failed to get score: <error message>"
}
```

---

##  Structure des Donnees

### Tournament Score Object

```typescript
interface TournamentScore {
  id: string;           // ID unique du tournoi
  player1: string;      // Nom joueur 1 (equipe 1)
  player2: string;      // Nom joueur 2 (equipe 2)
  player3: string;      // Nom joueur 3 (equipe 1) - peut etre vide
  player4: string;      // Nom joueur 4 (equipe 2) - peut etre vide
  team1Score: string;   // Score equipe 1
  team2Score: string;   // Score equipe 2
  winner: "team1" | "team2";  // equipe gagnante
}
```

---
