import db from '../database.js';

console.log('Starting migration: Priorities and Vendors...');

// 1. Migrate Item Priorities
console.log('Migrating item priorities...');

// Map legacy/old priorities to new ones
const priorityMapping = {
    'Critical': 'Day 1',
    'must-have': 'Day 1',
    'nice-to-have': 'Month 1',
    'future': 'Later'
};

const updatePriorityStmt = db.prepare('UPDATE furnishing_items SET priority = ? WHERE priority = ?');

for (const [oldP, newP] of Object.entries(priorityMapping)) {
    const result = updatePriorityStmt.run(newP, oldP);
    if (result.changes > 0) {
        console.log(`Updated ${result.changes} items from '${oldP}' to '${newP}'`);
    }
}

// 2. Migrate Item Vendors
console.log('Migrating item vendors...');

// Check current columns
const columns = db.prepare('PRAGMA table_info(furnishing_items)').all();
const hasVendor = columns.some(c => c.name === 'vendor');
console.log('Current columns:', columns.map(c => c.name));

if (!hasVendor) {
    console.log('Adding vendor column...');
    try {
        db.prepare('ALTER TABLE furnishing_items ADD COLUMN vendor TEXT').run();
        console.log('Added vendor column successfully.');
    } catch (error) {
        console.error('Failed to add vendor column:', error);
        process.exit(1);
    }
} else {
    console.log('Vendor column already exists.');
}

const items = db.prepare("SELECT id, name, category FROM furnishing_items WHERE vendor IS NULL OR vendor = ''").all();
const updateVendorStmt = db.prepare('UPDATE furnishing_items SET vendor = ? WHERE id = ?');

let vendor_updates = 0;

for (const item of items) {
    let vendor = 'IKEA'; // Default

    const nameLower = item.name.toLowerCase();
    const categoryLower = (item.category || '').toLowerCase();

    if (nameLower.includes('mattress') || nameLower.includes('refrigerator') || nameLower.includes('washer') || nameLower.includes('dryer') || nameLower.includes('tv')) {
        vendor = 'Harvey Norman';
    } else if (nameLower.includes('rug') || nameLower.includes('lamp') || nameLower.includes('microwave') || nameLower.includes('kettle') || nameLower.includes('toaster') || nameLower.includes('dish rack') || nameLower.includes('chopping board')) {
        vendor = 'Kmart';
    } else if (nameLower.includes('curtain') || nameLower.includes('blind') || nameLower.includes('trash bin') || nameLower.includes('plant')) {
        vendor = 'Bunnings';
    } else if (nameLower.includes('pot') || nameLower.includes('pan') || nameLower.includes('air fryer') || nameLower.includes('rice cooker') || nameLower.includes('knife')) {
        vendor = 'Kogan';
    } else if (nameLower.includes('bed') || nameLower.includes('sofa') || nameLower.includes('table') || nameLower.includes('chair') || nameLower.includes('wardrobe') || nameLower.includes('dresser') || nameLower.includes('kallax')) {
        vendor = 'IKEA';
    }

    updateVendorStmt.run(vendor, item.id);
    vendor_updates++;
}

console.log(`Updated vendors for ${vendor_updates} items.`);


// 3. Update Priorities Table
console.log('Updating priorities table...');

// Delete legacy priorities
const deletePriorityStmt = db.prepare('DELETE FROM priorities WHERE name IN (?, ?, ?, ?, ?)');
const deleteResult = deletePriorityStmt.run('Critical', 'must-have', 'nice-to-have', 'future', 'undefined');
console.log(`Deleted ${deleteResult.changes} legacy priorities.`);

// Ensure correct sort orders for remaining priorities
const updateSortOrderStmt = db.prepare('UPDATE priorities SET sort_order = ? WHERE name = ?');
const newSortOrders = {
    'Day 1': 10,
    'Week 1': 20,
    'Week 2': 30,
    'Month 1': 40,
    'Later': 50
};

for (const [name, order] of Object.entries(newSortOrders)) {
    // Insert or Update
    const existing = db.prepare('SELECT 1 FROM priorities WHERE name = ?').get(name);
    if (existing) {
        updateSortOrderStmt.run(order, name);
    } else {
        db.prepare('INSERT INTO priorities (name, sort_order) VALUES (?, ?)').run(name, order);
        console.log(`Inserted missing priority: ${name}`);
    }
}

console.log('Migration completed successfully.');
