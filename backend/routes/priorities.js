import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/priorities - List all priorities sorted by order
router.get('/', async (req, res) => {
    try {
        const { rows: priorities } = await db.query('SELECT * FROM priorities ORDER BY sort_order ASC');
        res.json(priorities);
    } catch (error) {
        console.error('Error fetching priorities:', error);
        res.status(500).json({ error: 'Failed to fetch priorities' });
    }
});

export default router;
