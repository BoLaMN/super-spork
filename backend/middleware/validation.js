import db from '../database.js';

const VALID_STATUSES = ['Needed', 'Researching', 'Ready to Purchase', 'Ordered', 'Delivered', 'Completed'];
const VALID_COMPLETION_STATUSES = ['Pending', 'In Progress', 'Completed'];

export async function validateItem(req, res, next) {
    const { name, room_id, status, priority } = req.body;

    // Required fields for POST
    if (req.method === 'POST') {
        if (!name || !room_id) {
            return res.status(400).json({
                error: 'Missing required fields: name and room_id are required'
            });
        }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
    }

    // Validate priority if provided
    if (priority) {
        try {
            const result = await db.query('SELECT 1 FROM priorities WHERE name = $1', [priority]);
            if (result.rows.length === 0) {
                return res.status(400).json({
                    error: `Invalid priority: ${priority}. Must be one of the defined priorities.`
                });
            }
        } catch (err) {
            console.error('Error validating priority:', err);
            return res.status(500).json({ error: 'Database error during validation' });
        }
    }

    next();
}

export function validateLogistics(req, res, next) {
    const { service_type, completion_status } = req.body;

    // Required fields for POST
    if (req.method === 'POST') {
        if (!service_type) {
            return res.status(400).json({
                error: 'Missing required field: service_type is required'
            });
        }
    }

    // Validate completion_status if provided
    if (completion_status && !VALID_COMPLETION_STATUSES.includes(completion_status)) {
        return res.status(400).json({
            error: `Invalid completion_status. Must be one of: ${VALID_COMPLETION_STATUSES.join(', ')}`
        });
    }

    next();
}
