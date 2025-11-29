# House Planner - Furnishing & Setup Tracker

A comprehensive full-stack web application for tracking home furnishing items and essential home setup logistics with multi-user support and real-time data persistence.

## Features

### Furnishing Items Management
- Add, edit, and delete furnishing items
- Track purchase status (Needed, Researching, Ready to Purchase, Ordered, Delivered, Completed)
- Priority levels (must-have, nice-to-have, future)
- Room-based organization
- Budget tracking per item
- Delivery date tracking
- Search and advanced filtering

### Logistics Panel
- Track utility connections (gas, water, NBN, electricity, bins)
- Monitor service provider details
- Application and appointment scheduling
- Completion status tracking
- Contact information management

### Dashboard
- Overall progress visualization
- Budget overview with alerts
- Room-by-room progress tracking
- Upcoming deliveries (7-day window)
- Upcoming service appointments

### Additional Views
- **Room View**: Organize and view items by room
- **Budget Tracker**: Detailed financial breakdown by room and priority
- **Calendar View**: Timeline of all deliveries and appointments

## Technology Stack

- **Frontend**: React 19 with Vite
- **Backend**: Node.js with Express.js
- **Database**: SQLite (file-based, zero configuration)
- **Styling**: Custom CSS with premium dark theme and glassmorphism

## Prerequisites

- Node.js 20.18+ and npm

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd house-planner
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the Application

You need to run both the backend and frontend servers:

### Option 1: Run in separate terminals

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```
The backend API will start on `http://localhost:3001`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
The frontend will open on `http://localhost:5173`

### Option 2: Run concurrently (recommended)

From the project root, you can install `concurrently`:
```bash
npm install -g concurrently
```

Then create a script to run both:
```bash
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Start by adding furnishing items or logistics services
3. Use the navigation menu to switch between different views
4. Track your progress on the Dashboard
5. Monitor your budget in the Budget Tracker
6. View upcoming events in the Calendar

## API Endpoints

### Items
- `GET /api/items` - List all items (supports filters: room, category, status, priority, search)
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/stats` - Get statistics

### Logistics
- `GET /api/logistics` - List all logistics entries (supports filters: service_type, completion_status)
- `POST /api/logistics` - Create new logistics entry
- `GET /api/logistics/:id` - Get single entry
- `PUT /api/logistics/:id` - Update entry
- `DELETE /api/logistics/:id` - Delete entry
- `GET /api/logistics/stats` - Get statistics

## Database

The application uses SQLite with a file-based database (`backend/house-planner.db`). The database is created automatically on first run.

### Multi-User Support

SQLite supports multiple concurrent readers and one writer, making it suitable for small-to-medium teams collaborating on the same local network or for deployment on a shared server.

## Deployment

### For Production Use

To deploy this application for multi-user access:

1. **Deploy the backend** to a hosting service:
   - Heroku, AWS, DigitalOcean, Railway, etc.
   - Set the `PORT` environment variable if required
   - Ensure the database file persists between deployments

2. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Update frontend API endpoint**:
   - Modify `frontend/vite.config.js` proxy settings or
   - Update `frontend/src/services/api.js` to point to your deployed backend URL

4. **Serve the frontend**:
   - Deploy the `frontend/dist` folder to Netlify, Vercel, or any static hosting
   - Or serve it from your backend using Express static middleware

## Customization

### Adding New Rooms
Rooms are added dynamically when you create items. Just type a new room name when adding an item.

### Modifying Status/Priority Options
Edit the constants in:
- `backend/middleware/validation.js` (backend validation)
- Component files like `ItemManager.jsx` and `ItemModal.jsx` (frontend)

## Troubleshooting

### Port Already in Use
If port 3001 or 5173 is already in use:
- Backend: Set `PORT` environment variable: `PORT=3002 npm run dev`
- Frontend: Vite will automatically try the next available port

### Database Locked Error
If you see "database is locked" errors:
- Ensure only one backend server is running
- SQLite handles concurrent reads well, but writes are serialized

### API Connection Issues
- Ensure both backend and frontend are running
- Check that the frontend proxy configuration in `vite.config.js` points to the correct backend port

## License

MIT

## Support

For issues or questions, please refer to the documentation or create an issue in the project repository.
