import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database...');

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        budget DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create priorities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS priorities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL
      )
    `);

    // Create furnishing_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS furnishing_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        room_id INTEGER NOT NULL,
        category TEXT,
        description TEXT,
        dimensions TEXT,
        cost DECIMAL DEFAULT 0,
        budget_allocated DECIMAL DEFAULT 0,
        vendor TEXT,
        status TEXT DEFAULT 'Needed',
        priority TEXT DEFAULT 'must-have',
        delivery_date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
      )
    `);

    // Create logistics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS logistics (
        id SERIAL PRIMARY KEY,
        service_type TEXT NOT NULL,
        provider_name TEXT,
        application_date TEXT,
        scheduled_date TEXT,
        completion_status TEXT DEFAULT 'Pending',
        priority TEXT DEFAULT 'Normal',
        account_number TEXT,
        contact_info TEXT,
        cost DECIMAL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_room ON furnishing_items(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_status ON furnishing_items(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_priority ON furnishing_items(priority)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logistics_service ON logistics(service_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logistics_status ON logistics(completion_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logistics_priority ON logistics(priority)');

    // Seed priorities
    const { rows: prioritiesCount } = await client.query('SELECT COUNT(*) as count FROM priorities');
    if (parseInt(prioritiesCount[0].count) === 0) {
      const defaultPriorities = [
        { name: 'Day 1', sort_order: 10 },
        { name: 'Week 1', sort_order: 20 },
        { name: 'Week 2', sort_order: 30 },
        { name: 'Month 1', sort_order: 40 },
        { name: 'Later', sort_order: 50 }
      ];

      await client.query('BEGIN');
      try {
        for (const p of defaultPriorities) {
          await client.query('INSERT INTO priorities (name, sort_order) VALUES ($1, $2)', [p.name, p.sort_order]);
        }
        await client.query('COMMIT');
        console.log('Seeded default priorities');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // Seed default rooms
    const { rows: roomCount } = await client.query('SELECT COUNT(*) as count FROM rooms');
    if (parseInt(roomCount[0].count) === 0) {
      const defaultRooms = [
        { name: 'Living Room', budget: 5000 },
        { name: 'Dining Room', budget: 3000 },
        { name: 'Kitchen', budget: 2000 },
        { name: 'Master Bedroom', budget: 4000 },
        { name: 'Bedroom 2', budget: 2000 },
        { name: 'Bedroom 3', budget: 2000 },
        { name: 'Bathroom', budget: 1000 },
        { name: 'Ensuite', budget: 1000 },
        { name: 'Laundry', budget: 1500 },
        { name: 'Garage', budget: 1000 },
        { name: 'Outdoor/Patio', budget: 3000 },
        { name: 'Study/Office', budget: 2500 },
        { name: 'Hallway', budget: 500 },
        { name: 'Home Theatre', budget: 6000 }
      ];

      await client.query('BEGIN');
      try {
        for (const room of defaultRooms) {
          await client.query('INSERT INTO rooms (name, budget) VALUES ($1, $2)', [room.name, room.budget]);
        }
        await client.query('COMMIT');
        console.log('Seeded default rooms');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // Seed default items
    const { rows: itemsCount } = await client.query('SELECT COUNT(*) as count FROM furnishing_items');
    if (parseInt(itemsCount[0].count) === 0) {
      console.log('Seeding default furnishing items...');
      
      const { rows: rooms } = await client.query('SELECT id, name FROM rooms');
      const roomMap = rooms.reduce((acc, room) => {
        acc[room.name] = room.id;
        return acc;
      }, {});

      const defaultItems = {
        'Living Room': [
          { name: 'Sofa', category: 'Furniture', cost: 1500, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Coffee Table', category: 'Furniture', cost: 300, priority: 'Week 1', vendor: 'IKEA' },
          { name: 'TV Unit', category: 'Furniture', cost: 400, priority: 'Week 1', vendor: 'IKEA' },
          { name: 'Area Rug', category: 'Decor', cost: 200, priority: 'Month 1', vendor: 'Kmart' },
          { name: 'Curtains/Blinds', category: 'Decor', cost: 500, priority: 'Day 1', vendor: 'Bunnings' },
          { name: 'Floor Lamp', category: 'Lighting', cost: 100, priority: 'Month 1', vendor: 'Target' }
        ],
        'Dining Room': [
          { name: 'Dining Table', category: 'Furniture', cost: 800, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Dining Chairs (x6)', category: 'Furniture', cost: 600, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Buffet/Sideboard', category: 'Furniture', cost: 500, priority: 'Month 1', vendor: 'IKEA' }
        ],
        'Kitchen': [
          { name: 'Refrigerator', category: 'Appliances', cost: 1200, priority: 'Day 1', vendor: 'Harvey Norman' },
          { name: 'Microwave', category: 'Appliances', cost: 150, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Bar Stools (x3)', category: 'Furniture', cost: 300, priority: 'Month 1', vendor: 'IKEA' },
          { name: 'Dish Rack', category: 'Accessories', cost: 50, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Trash Bin', category: 'Accessories', cost: 80, priority: 'Day 1', vendor: 'Bunnings' },
          { name: 'Pots & Pans Set', category: 'Cookware', cost: 300, priority: 'Day 1', vendor: 'Kogan' },
          { name: 'Cutlery Set', category: 'Tableware', cost: 100, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Knife Block', category: 'Cookware', cost: 150, priority: 'Day 1', vendor: 'Kogan' },
          { name: 'Utensil Set', category: 'Cookware', cost: 50, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Chopping Boards', category: 'Cookware', cost: 40, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Food Containers', category: 'Storage', cost: 50, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Meal Prep Containers', category: 'Storage', cost: 40, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Air Fryer', category: 'Appliances', cost: 200, priority: 'Week 1', vendor: 'Kogan' },
          { name: 'Rice Cooker', category: 'Appliances', cost: 100, priority: 'Week 1', vendor: 'Kogan' },
          { name: 'Toaster', category: 'Appliances', cost: 80, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Kettle', category: 'Appliances', cost: 60, priority: 'Day 1', vendor: 'Kmart' },
          { name: 'Dinner Set (Plates/Bowls)', category: 'Tableware', cost: 150, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Glassware Set', category: 'Tableware', cost: 60, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'Mugs', category: 'Tableware', cost: 40, priority: 'Day 1', vendor: 'Kmart' }
        ],
        'Master Bedroom': [
          { name: 'King Bed Frame', category: 'Furniture', cost: 800, priority: 'Day 1', vendor: 'IKEA' },
          { name: 'King Mattress', category: 'Furniture', cost: 1200, priority: 'Day 1', vendor: 'Harvey Norman' },
          { name: 'Bedside Tables (x2)', category: 'Furniture', cost: 200, priority: 'Week 1', vendor: 'IKEA' },
          { name: 'Dresser', category: 'Furniture', cost: 400, priority: 'Month 1', vendor: 'IKEA' },
          { name: 'Bedside Lamps (x2)', category: 'Lighting', cost: 100, priority: 'Month 1', vendor: 'Kmart' },
          { name: 'TV', category: 'Electronics', cost: 800, priority: 'Week 1' },
          { name: 'Quilt/Doona', category: 'Bedding', cost: 200, priority: 'Day 1' },
          { name: 'Quilt Cover Set', category: 'Bedding', cost: 100, priority: 'Day 1' },
          { name: 'Sheet Set', category: 'Bedding', cost: 100, priority: 'Day 1' },
          { name: 'Pillows (x2)', category: 'Bedding', cost: 80, priority: 'Day 1' },
          { name: 'Mattress Protector', category: 'Bedding', cost: 50, priority: 'Day 1' }
        ],
        'Bedroom 2': [
          { name: 'Queen Bed Frame', category: 'Furniture', cost: 500, priority: 'Week 2', vendor: 'IKEA' },
          { name: 'Queen Mattress', category: 'Furniture', cost: 800, priority: 'Week 2', vendor: 'Harvey Norman' },
          { name: 'Bedside Table', category: 'Furniture', cost: 80, priority: 'Week 2', vendor: 'IKEA' },
          { name: 'Quilt/Doona', category: 'Bedding', cost: 150, priority: 'Week 2', vendor: 'Target' },
          { name: 'Quilt Cover Set', category: 'Bedding', cost: 80, priority: 'Week 2', vendor: 'Target' },
          { name: 'Sheet Set', category: 'Bedding', cost: 80, priority: 'Week 2', vendor: 'Target' },
          { name: 'Pillows (x2)', category: 'Bedding', cost: 60, priority: 'Week 2', vendor: 'Target' }
        ],
        'Bedroom 3': [
          { name: 'Queen Bed Frame', category: 'Furniture', cost: 500, priority: 'Later', vendor: 'IKEA' },
          { name: 'Queen Mattress', category: 'Furniture', cost: 800, priority: 'Later', vendor: 'Harvey Norman' },
          { name: 'Bedside Table', category: 'Furniture', cost: 80, priority: 'Later', vendor: 'IKEA' },
          { name: 'Quilt/Doona', category: 'Bedding', cost: 150, priority: 'Later', vendor: 'Target' },
          { name: 'Quilt Cover Set', category: 'Bedding', cost: 80, priority: 'Later', vendor: 'Target' },
          { name: 'Sheet Set', category: 'Bedding', cost: 80, priority: 'Later', vendor: 'Target' },
          { name: 'Pillows (x2)', category: 'Bedding', cost: 60, priority: 'Later', vendor: 'Target' }
        ],
        'Bathroom': [
          { name: 'Toilet Brush Holder', category: 'Accessories', cost: 20, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Bath Towels (x4)', category: 'Linen', cost: 100, priority: 'Day 1', vendor: 'Target' },
          { name: 'Hand Towels (x2)', category: 'Linen', cost: 30, priority: 'Day 1', vendor: 'Target' },
          { name: 'Bath Mat', category: 'Linen', cost: 30, priority: 'Day 1', vendor: 'Target' },
          { name: 'Shower Caddy', category: 'Accessories', cost: 40, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Waste Bin', category: 'Accessories', cost: 20, priority: 'Week 1', vendor: 'Kmart' }
        ],
        'Ensuite': [
          { name: 'Toilet Brush Holder', category: 'Accessories', cost: 20, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Bath Towels (x2)', category: 'Linen', cost: 60, priority: 'Day 1', vendor: 'Target' },
          { name: 'Hand Towel', category: 'Linen', cost: 15, priority: 'Day 1', vendor: 'Target' },
          { name: 'Bath Mat', category: 'Linen', cost: 30, priority: 'Day 1', vendor: 'Target' },
          { name: 'Waste Bin', category: 'Accessories', cost: 20, priority: 'Week 1', vendor: 'Kmart' }
        ],
        'Laundry': [
          { name: 'Washing Machine', category: 'Appliances', cost: 800, priority: 'Critical', vendor: 'Harvey Norman' },
          { name: 'Dryer', category: 'Appliances', cost: 600, priority: 'Month 1', vendor: 'Harvey Norman' },
          { name: 'Laundry Hamper', category: 'Accessories', cost: 30, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Vacuum Cleaner', category: 'Appliances', cost: 400, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Iron', category: 'Appliances', cost: 60, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Ironing Board', category: 'Accessories', cost: 50, priority: 'Week 1', vendor: 'Kmart' },
          { name: 'Mop & Bucket', category: 'Cleaning', cost: 40, priority: 'Day 1', vendor: 'Bunnings' },
          { name: 'Broom & Dustpan', category: 'Cleaning', cost: 30, priority: 'Day 1', vendor: 'Bunnings' },
          { name: 'Clothes Airer', category: 'Accessories', cost: 40, priority: 'Week 1', vendor: 'Kmart' }
        ],
        'Study/Office': [
          { name: 'Office Desk', category: 'Furniture', cost: 300, priority: 'Week 1', vendor: 'IKEA' },
          { name: 'Ergonomic Chair', category: 'Furniture', cost: 250, priority: 'Week 1', vendor: 'IKEA' },
          { name: 'Monitor', category: 'Electronics', cost: 300, priority: 'Week 1', vendor: 'Harvey Norman' },
          { name: 'Bookshelf', category: 'Furniture', cost: 150, priority: 'Month 1', vendor: 'IKEA' }
        ],
        'Outdoor/Patio': [
          { name: 'Outdoor Table Set', category: 'Furniture', cost: 800, priority: 'Later', vendor: 'IKEA' },
          { name: 'BBQ Grill', category: 'Appliances', cost: 500, priority: 'Later', vendor: 'Bunnings' }
        ],
        'Garage': [
          { name: 'Shelving Unit', category: 'Storage', cost: 150, priority: 'Month 1', vendor: 'Bunnings' },
          { name: 'Workbench', category: 'Furniture', cost: 200, priority: 'Later', vendor: 'Bunnings' }
        ],
        'Hallway': [
          { name: 'Runner Rug', category: 'Decor', cost: 80, priority: 'Month 1', vendor: 'Kmart' },
          { name: 'Console Table', category: 'Furniture', cost: 150, priority: 'Month 1', vendor: 'IKEA' },
          { name: 'Wall Art', category: 'Decor', cost: 100, priority: 'Later', vendor: 'Kmart' }
        ],
        'Home Theatre': [
          { name: 'Projector / Large TV', category: 'Electronics', cost: 2500, priority: 'Month 1', vendor: 'Harvey Norman' },
          { name: 'Surround Sound System', category: 'Electronics', cost: 1500, priority: 'Month 1', vendor: 'Harvey Norman' },
          { name: 'Recliner Seats (x4)', category: 'Furniture', cost: 2000, priority: 'Month 1', vendor: 'Harvey Norman' },
          { name: 'Blackout Curtains', category: 'Decor', cost: 300, priority: 'Month 1', vendor: 'Bunnings' },
          { name: 'Popcorn Machine', category: 'Appliances', cost: 100, priority: 'Later', vendor: 'Kogan' }
        ]
      };

      await client.query('BEGIN');
      try {
        for (const [roomName, roomItems] of Object.entries(defaultItems)) {
          const roomId = roomMap[roomName];
          if (roomId) {
            for (const item of roomItems) {
              await client.query(`
                INSERT INTO furnishing_items (
                  name, room_id, category, description, cost, budget_allocated, status, priority, vendor
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                item.name, 
                roomId, 
                item.category, 
                'Standard ' + item.name, 
                item.cost, 
                item.cost, 
                'Needed', 
                item.priority,
                item.vendor || null
              ]);
            }
          }
        }
        await client.query('COMMIT');
        console.log('Seeded default furnishing items');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // Seed default logistics
    const { rows: logisticsCount } = await client.query('SELECT COUNT(*) as count FROM logistics');
    if (parseInt(logisticsCount[0].count) === 0) {
      console.log('Seeding default logistics...');
      
      const defaultLogistics = [
        { 
          service_type: 'Electricity', 
          provider_name: 'SA Power Networks (Distributor)', 
          priority: 'Day 1',
          notes: 'Choose a retailer (AGL, Origin, etc.) and book connection for Day 1.' 
        },
        { 
          service_type: 'Gas', 
          provider_name: 'Elgas / Kleenheat', 
          priority: 'Day 1',
          notes: 'Check if you need LPG bottles ordered. Book delivery.' 
        },
        { 
          service_type: 'Water', 
          provider_name: 'SA Water', 
          priority: 'Day 1',
          notes: 'Ensure account is in your name.' 
        },
        { 
          service_type: 'Internet', 
          provider_name: 'NBN Provider (AussieBB/Telstra)', 
          priority: 'Day 1',
          notes: 'Book appointment. Hardware (modem) usually mailed to you.' 
        },
        { 
          service_type: 'Insurance', 
          provider_name: 'Home & Contents', 
          priority: 'Day 1',
          notes: 'Policy must start from the moment you settle/get keys.' 
        },
        { 
          service_type: 'Bins', 
          provider_name: 'Victor Harbor Council', 
          priority: 'Week 1',
          notes: 'Order General, Recycle, and Green bins if missing.' 
        },
        { 
          service_type: 'Mail', 
          provider_name: 'AusPost', 
          priority: 'Week 1',
          notes: 'Set up redirection.' 
        }
      ];

      await client.query('BEGIN');
      try {
        for (const item of defaultLogistics) {
          await client.query(`
            INSERT INTO logistics (
              service_type, provider_name, priority, notes
            ) VALUES ($1, $2, $3, $4)
          `, [
            item.service_type,
            item.provider_name,
            item.priority,
            item.notes
          ]);
        }
        await client.query('COMMIT');
        console.log('Seeded default logistics');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }

    // Seed default settings
    const { rows: settingsCount } = await client.query('SELECT COUNT(*) as count FROM settings');
    if (parseInt(settingsCount[0].count) === 0) {
      await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['total_budget', '50000']);
      console.log('Seeded default settings');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    client.release();
  }
};

// Run initialization (async)
initDB();

export default pool;
