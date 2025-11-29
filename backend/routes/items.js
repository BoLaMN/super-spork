import express from 'express';
import db from '../database.js';
import { validateItem } from '../middleware/validation.js';

const router = express.Router();

// GET /api/items - List all items with optional filters
router.get('/', async (req, res) => {
    try {
        const { room_id, category, status, priority, search } = req.query;

        let query = `
      SELECT i.*, r.name as room_name, p.sort_order 
      FROM furnishing_items i
      JOIN rooms r ON i.room_id = r.id
      LEFT JOIN priorities p ON i.priority = p.name
      WHERE 1=1
    `;
        const params = [];
        let paramIdx = 1;

        if (room_id) {
            query += ` AND i.room_id = $${paramIdx++}`;
            params.push(room_id);
        }

        if (category) {
            query += ` AND i.category = $${paramIdx++}`;
            params.push(category);
        }

        if (status) {
            query += ` AND i.status = $${paramIdx++}`;
            params.push(status);
        }

        if (priority) {
            query += ` AND i.priority = $${paramIdx++}`;
            params.push(priority);
        }

        if (search) {
            query += ` AND (i.name ILIKE $${paramIdx} OR i.description ILIKE $${paramIdx} OR i.vendor ILIKE $${paramIdx})`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm);
            paramIdx++;
        }

        query += ' ORDER BY p.sort_order ASC, i.created_at DESC';

        const { rows: items } = await db.query(query, params);

        // Map room_name to room property for frontend compatibility and parse numeric fields
        const mappedItems = items.map(item => ({
            ...item,
            cost: parseFloat(item.cost),
            budget_allocated: parseFloat(item.budget_allocated),
            room: item.room_name // Add room name as 'room' property
        }));

        res.json(mappedItems);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// GET /api/items/stats - Get budget and progress statistics
router.get('/stats', async (req, res) => {
    try {
        // Overall stats
        const { rows: [overallStats] } = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_items,
        COALESCE(SUM(cost), 0) as total_spent,
        COALESCE(SUM(budget_allocated), 0) as total_budget
      FROM furnishing_items
    `);

        // Stats by room
        const { rows: roomStats } = await db.query(`
      SELECT 
        r.name as room,
        r.id as room_id,
        COUNT(i.id) as total_items,
        SUM(CASE WHEN i.status = 'Completed' THEN 1 ELSE 0 END) as completed_items,
        COALESCE(SUM(i.cost), 0) as spent,
        r.budget as room_budget,
        COALESCE(SUM(i.budget_allocated), 0) as item_budget_sum
      FROM rooms r
      LEFT JOIN furnishing_items i ON r.id = i.room_id
      GROUP BY r.id, r.name, r.budget
    `);

        // Calculate effective budget for each room stats object
        const finalRoomStats = roomStats.map(stat => ({
            ...stat,
            budget: (stat.room_budget && stat.room_budget > 0) ? parseFloat(stat.room_budget) : (parseFloat(stat.item_budget_sum) || 0),
            spent: parseFloat(stat.spent),
            completed_items: parseInt(stat.completed_items),
            total_items: parseInt(stat.total_items)
        }));

        // Stats by priority
        const { rows: priorityStats } = await db.query(`
      SELECT 
        i.priority,
        COUNT(*) as total_items,
        COALESCE(SUM(i.cost), 0) as spent,
        COALESCE(SUM(i.budget_allocated), 0) as budget
      FROM furnishing_items i
      LEFT JOIN priorities p ON i.priority = p.name
      GROUP BY i.priority, p.sort_order
      ORDER BY p.sort_order ASC
    `);

        // Upcoming deliveries (next 7 days)
        const { rows: upcomingDeliveries } = await db.query(`
      SELECT i.*, r.name as room_name
      FROM furnishing_items i
      JOIN rooms r ON i.room_id = r.id
      WHERE i.delivery_date IS NOT NULL 
        AND TO_DATE(i.delivery_date, 'YYYY-MM-DD') >= CURRENT_DATE
        AND TO_DATE(i.delivery_date, 'YYYY-MM-DD') <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY i.delivery_date ASC
    `);
        // Note: delivery_date is TEXT in DB, but ideally should be DATE. 
        // If stored as YYYY-MM-DD string, simple comparison works but casting is safer.
        // Postgres string comparison for dates in ISO format works fine too.

        res.json({
            overall: {
                ...overallStats,
                total_items: parseInt(overallStats.total_items),
                completed_items: parseInt(overallStats.completed_items),
                total_spent: parseFloat(overallStats.total_spent),
                total_budget: parseFloat(overallStats.total_budget)
            },
            byRoom: finalRoomStats,
            byPriority: priorityStats.map(s => ({
                ...s,
                total_items: parseInt(s.total_items),
                spent: parseFloat(s.spent),
                budget: parseFloat(s.budget)
            })),
            upcomingDeliveries: upcomingDeliveries.map(item => ({ ...item, room: item.room_name }))
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// POST /api/items - Create new item
router.post('/', validateItem, async (req, res) => {
    try {
        const {
            name, room_id, category, description, dimensions,
            cost, budget_allocated, vendor, status, priority,
            delivery_date, notes
        } = req.body;

        const { rows: [newItem] } = await db.query(`
      INSERT INTO furnishing_items (
        name, room_id, category, description, dimensions,
        cost, budget_allocated, vendor, status, priority,
        delivery_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
            name, room_id, category || null, description || null, dimensions || null,
            cost || 0, budget_allocated || 0, vendor || null,
            status || 'Needed', priority || 'must-have',
            delivery_date || null, notes || null
        ]);

        // Fetch room name for the response
        const { rows: [room] } = await db.query('SELECT name FROM rooms WHERE id = $1', [room_id]);

        res.status(201).json({ 
            ...newItem, 
            cost: parseFloat(newItem.cost),
            budget_allocated: parseFloat(newItem.budget_allocated),
            room: room ? room.name : null 
        });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await db.query(`
      SELECT i.*, r.name as room_name 
      FROM furnishing_items i
      JOIN rooms r ON i.room_id = r.id
      WHERE i.id = $1
    `, [req.params.id]);
        
        const item = rows[0];

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ 
            ...item, 
            cost: parseFloat(item.cost),
            budget_allocated: parseFloat(item.budget_allocated),
            room: item.room_name 
        });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// PUT /api/items/:id - Update item
router.put('/:id', validateItem, async (req, res) => {
    try {
        const {
            name, room_id, category, description, dimensions,
            cost, budget_allocated, vendor, status, priority,
            delivery_date, notes
        } = req.body;

        const { rows } = await db.query(`
      UPDATE furnishing_items 
      SET name = $1, room_id = $2, category = $3, description = $4, dimensions = $5,
          cost = $6, budget_allocated = $7, vendor = $8, status = $9, priority = $10,
          delivery_date = $11, notes = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
            name, room_id, category, description, dimensions,
            cost, budget_allocated, vendor, status, priority,
            delivery_date, notes, req.params.id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = rows[0];
        
        // Fetch room name
        const { rows: [room] } = await db.query('SELECT name FROM rooms WHERE id = $1', [room_id]);

        res.json({ 
            ...updatedItem, 
            cost: parseFloat(updatedItem.cost),
            budget_allocated: parseFloat(updatedItem.budget_allocated),
            room: room ? room.name : null 
        });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await db.query('DELETE FROM furnishing_items WHERE id = $1', [req.params.id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;
