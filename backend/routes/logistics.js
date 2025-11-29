import express from 'express';
import db from '../database.js';
import { validateLogistics } from '../middleware/validation.js';

const router = express.Router();

// GET /api/logistics - List all logistics entries with optional filters
router.get('/', async (req, res) => {
    try {
        const { service_type, completion_status } = req.query;

        let query = `
            SELECT l.*, p.sort_order
            FROM logistics l
            LEFT JOIN priorities p ON l.priority = p.name
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (service_type) {
            query += ` AND l.service_type = $${paramIdx++}`;
            params.push(service_type);
        }

        if (completion_status) {
            query += ` AND l.completion_status = $${paramIdx++}`;
            params.push(completion_status);
        }

        query += ' ORDER BY p.sort_order ASC, l.created_at DESC';

        const { rows: logistics } = await db.query(query, params);

        const mappedLogistics = logistics.map(entry => ({
            ...entry,
            cost: parseFloat(entry.cost)
        }));

        res.json(mappedLogistics);
    } catch (error) {
        console.error('Error fetching logistics:', error);
        res.status(500).json({ error: 'Failed to fetch logistics' });
    }
});

// GET /api/logistics/stats - Get completion statistics
router.get('/stats', async (req, res) => {
    try {
        // Overall stats
        const { rows: [overallStats] } = await db.query(`
      SELECT 
        COUNT(*) as total_services,
        COALESCE(SUM(CASE WHEN completion_status = 'Completed' THEN 1 ELSE 0 END), 0) as completed_services,
        COALESCE(SUM(CASE WHEN completion_status = 'In Progress' THEN 1 ELSE 0 END), 0) as in_progress_services,
        COALESCE(SUM(CASE WHEN completion_status = 'Pending' THEN 1 ELSE 0 END), 0) as pending_services,
        COALESCE(SUM(cost), 0) as total_cost
      FROM logistics
    `);

        // Stats by service type
        const { rows: serviceTypeStats } = await db.query(`
      SELECT 
        service_type,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN completion_status = 'Completed' THEN 1 ELSE 0 END), 0) as completed,
        completion_status
      FROM logistics
      GROUP BY service_type, completion_status
    `);

        // Upcoming appointments (next 7 days)
        const { rows: upcomingAppointments } = await db.query(`
      SELECT *
      FROM logistics
      WHERE scheduled_date IS NOT NULL 
        AND TO_DATE(scheduled_date, 'YYYY-MM-DD') >= CURRENT_DATE
        AND TO_DATE(scheduled_date, 'YYYY-MM-DD') <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY scheduled_date ASC
    `);

        res.json({
            overall: {
                total_services: parseInt(overallStats.total_services),
                completed_services: parseInt(overallStats.completed_services),
                in_progress_services: parseInt(overallStats.in_progress_services),
                pending_services: parseInt(overallStats.pending_services),
                total_cost: parseFloat(overallStats.total_cost)
            },
            byServiceType: serviceTypeStats.map(s => ({
                ...s,
                total: parseInt(s.total),
                completed: parseInt(s.completed)
            })),
            upcomingAppointments
        });
    } catch (error) {
        console.error('Error fetching logistics stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// POST /api/logistics - Create new logistics entry
router.post('/', validateLogistics, async (req, res) => {
    try {
        const {
            service_type, provider_name, application_date, scheduled_date,
            completion_status, priority, account_number, contact_info, cost, notes
        } = req.body;

        const query = `
      INSERT INTO logistics (
        service_type, provider_name, application_date, scheduled_date,
        completion_status, priority, account_number, contact_info, cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

        const values = [
            service_type, provider_name || null, application_date || null,
            scheduled_date || null, completion_status || 'Pending',
            priority || 'Normal', account_number || null, contact_info || null, 
            cost || 0, notes || null
        ];

        const { rows: [newEntry] } = await db.query(query, values);

        res.status(201).json({
            ...newEntry,
            cost: parseFloat(newEntry.cost)
        });
    } catch (error) {
        console.error('Error creating logistics entry:', error);
        res.status(500).json({ error: 'Failed to create logistics entry' });
    }
});

// GET /api/logistics/:id - Get single logistics entry
router.get('/:id', async (req, res) => {
    try {
        const { rows: [entry] } = await db.query('SELECT * FROM logistics WHERE id = $1', [req.params.id]);

        if (!entry) {
            return res.status(404).json({ error: 'Logistics entry not found' });
        }

        res.json({
            ...entry,
            cost: parseFloat(entry.cost)
        });
    } catch (error) {
        console.error('Error fetching logistics entry:', error);
        res.status(500).json({ error: 'Failed to fetch logistics entry' });
    }
});

// PUT /api/logistics/:id - Update logistics entry
router.put('/:id', validateLogistics, async (req, res) => {
    try {
        const {
            service_type, provider_name, application_date, scheduled_date,
            completion_status, priority, account_number, contact_info, cost, notes
        } = req.body;

        const query = `
      UPDATE logistics 
      SET service_type = $1, provider_name = $2, application_date = $3, scheduled_date = $4,
          completion_status = $5, priority = $6, account_number = $7, contact_info = $8, cost = $9, notes = $10,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

        const values = [
            service_type, provider_name, application_date, scheduled_date,
            completion_status, priority, account_number, contact_info, cost, notes,
            req.params.id
        ];

        const { rows: [updatedEntry] } = await db.query(query, values);

        if (!updatedEntry) {
            return res.status(404).json({ error: 'Logistics entry not found' });
        }

        res.json({
            ...updatedEntry,
            cost: parseFloat(updatedEntry.cost)
        });
    } catch (error) {
        console.error('Error updating logistics entry:', error);
        res.status(500).json({ error: 'Failed to update logistics entry' });
    }
});

// DELETE /api/logistics/:id - Delete logistics entry
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await db.query('DELETE FROM logistics WHERE id = $1', [req.params.id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Logistics entry not found' });
        }

        res.json({ message: 'Logistics entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting logistics entry:', error);
        res.status(500).json({ error: 'Failed to delete logistics entry' });
    }
});

export default router;
