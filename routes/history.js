// routes/history.js
import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// ── GET /api/history — list all analyses for logged-in user ──
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, target_role, file_name, model, created_at
         FROM analyses
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(req.user.id);

    res.json({ success: true, history: rows });
  } catch (err) {
    console.error('History list error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ── GET /api/history/:id — get single analysis ───────────────
router.get('/:id', (req, res) => {
  try {
    const row = db
      .prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!row) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    res.json({ success: true, analysis: { ...row, analysis: JSON.parse(row.analysis) } });
  } catch (err) {
    console.error('History get error:', err);
    res.status(500).json({ error: 'Failed to fetch analysis.' });
  }
});

// ── DELETE /api/history/:id ───────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const result = db
      .prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    res.json({ success: true, message: 'Analysis deleted.' });
  } catch (err) {
    console.error('History delete error:', err);
    res.status(500).json({ error: 'Failed to delete analysis.' });
  }
});

export default router;
