// ==================== GAME ROUTES ====================
const express = require('express');
const router = express.Router();
const { gameResults } = require('../state/gameState');

router.get('/result/:gameId', (req, res) => {
  const { gameId } = req.params;
  const result = gameResults.get(gameId);
  
  if (!result) {
    return res.status(404).json({ error: 'Game result not found' });
  }
  
  res.json(result);
});

module.exports = router;
```

4. Commit message: `Add game routes`
5. Click **"Commit changes"**

---

## 🎯 After You Finish

You should now see:
```
truepvp-backend/
├── config/
│   └── index.js
├── middleware/
│   ├── rateLimit.js
│   └── security.js
├── routes/
│   ├── game.js         ← NEW FILE (2 of 3)
│   └── matchmaking.js
├── services/
│   ├── matchmaking.js
│   └── transactionVerifier.js
├── state/
│   └── gameState.js
├── utils/
│   ├── cleanup.js
│   └── validation.js
├── .gitignore
├── .env.example
├── package.json
└── server.js
