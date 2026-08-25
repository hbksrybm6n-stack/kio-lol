import { Router } from 'express';
import { getPresence } from '../discord.js';

const router = Router();

router.get('/:userId', (req, res) => {
  const presence = getPresence(req.params.userId);
  if (!presence) {
    return res.json({ data: null, error: 'User not found or not in shared guild' });
  }
  res.json({ data: presence });
});

export default router;
