import { Router } from 'express';

const router = Router();

// GET /api/settings
router.get('/', (_req, res) => {
  // TODO: fetch business settings from team-db
  res.json({
    googleConnected: false,
    facebookConnected: false,
    responseTone: 'Professional',
  });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const { responseTone, googleConnected, facebookConnected } = req.body;
  // TODO: save settings to team-db
  res.json({ message: 'Settings updated', responseTone, googleConnected, facebookConnected });
});

export default router;