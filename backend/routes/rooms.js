import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/rooms - List all rooms
router.get('/', async (req, res) => {
    try {
        const { rows: rooms } = await db.query('SELECT * FROM rooms ORDER BY name ASC');
        const mappedRooms = rooms.map(room => ({
            ...room,
            budget: parseFloat(room.budget)
        }));
        res.json(mappedRooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// POST /api/rooms - Create new room
router.post('/', async (req, res) => {
    try {
        const { name, description, budget } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

        const query = 'INSERT INTO rooms (name, description, budget) VALUES ($1, $2, $3) RETURNING *';
        const { rows: [newRoom] } = await db.query(query, [name, description || null, budget || 0]);

        res.status(201).json({
            ...newRoom,
            budget: parseFloat(newRoom.budget)
        });
    } catch (error) {
        console.error('Error creating room:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Room name already exists' });
        }
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', async (req, res) => {
    try {
        const { name, description, budget } = req.body;

        const query = `
      UPDATE rooms 
      SET name = $1, description = $2, budget = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

        const { rows: [updatedRoom] } = await db.query(query, [name, description, budget, req.params.id]);

        if (!updatedRoom) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({
            ...updatedRoom,
            budget: parseFloat(updatedRoom.budget)
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await db.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

export default router;
