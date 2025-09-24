const express = require('express');
const router = express.Router();

// Exemple : GET tous les utilisateurs
router.get('/', (req, res) => {
  res.json([{ id: 1, username: 'Alice' }, { id: 2, username: 'Bob' }]);
});

module.exports = router;
