import db from '../database.js';

const VALID_STATUSES = ['Needed', 'Researching', 'Ready to Purchase', 'Ordered', 'Delivered', 'Completed'];
const VALID_COMPLETION_STATUSES = ['Pending', 'In Progress', 'Completed'];

export function validateItem(req, res, next) {
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
        const validPriority = db.prepare('SELECT 1 FROM priorities WHERE name = ?').get(priority);
        if (!validPriority) {
            // Fallback for legacy or special values if needed, or just strict check
            // For now, strict check against DB
             return res.status(400).json({
                error: `Invalid priority: ${priority}. Must be one of the defined priorities.`
            });
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
