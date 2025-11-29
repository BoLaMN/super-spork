import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
    try {
        const { rows: settings } = await db.query('SELECT * FROM settings');
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings/:key - Update a setting
router.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const { key } = req.params;

        const query = `
      INSERT INTO settings (key, value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;

        await db.query(query, [key, String(value)]);

        res.json({ key, value });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

export default router;
