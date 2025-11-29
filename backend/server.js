import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import logisticsRouter from './routes/logistics.js';
import roomsRouter from './routes/rooms.js';
import settingsRouter from './routes/settings.js';
import prioritiesRouter from './routes/priorities.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/priorities', prioritiesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'House Planner API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
