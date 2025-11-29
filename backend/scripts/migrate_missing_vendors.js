import db from '../database.js';

console.log('Starting migration: Assign missing vendors...');

// 1. Get items without vendor
const items = db.prepare("SELECT id, name, category FROM furnishing_items WHERE vendor IS NULL OR vendor = ''").all();
const updateVendorStmt = db.prepare('UPDATE furnishing_items SET vendor = ? WHERE id = ?');

let vendor_updates = 0;

for (const item of items) {
    let vendor = 'IKEA'; // Default fallback

    const nameLower = item.name.toLowerCase();
    const categoryLower = (item.category || '').toLowerCase();

    if (nameLower.includes('mattress') || nameLower.includes('refrigerator') || nameLower.includes('washer') || nameLower.includes('dryer') || nameLower.includes('tv') || nameLower.includes('monitor') || nameLower.includes('projector') || nameLower.includes('surround sound')) {
        vendor = 'Harvey Norman';
    } else if (nameLower.includes('rug') || nameLower.includes('lamp') || nameLower.includes('microwave') || nameLower.includes('kettle') || nameLower.includes('toaster') || nameLower.includes('dish rack') || nameLower.includes('chopping board') || nameLower.includes('vacuum') || nameLower.includes('iron') || nameLower.includes('mop') || nameLower.includes('broom')) {
        vendor = 'Kmart';
    } else if (nameLower.includes('curtain') || nameLower.includes('blind') || nameLower.includes('trash bin') || nameLower.includes('waste bin') || nameLower.includes('plant') || nameLower.includes('bbq') || nameLower.includes('tool') || nameLower.includes('workbench')) {
        vendor = 'Bunnings';
    } else if (nameLower.includes('pot') || nameLower.includes('pan') || nameLower.includes('air fryer') || nameLower.includes('rice cooker') || nameLower.includes('knife') || nameLower.includes('popcorn')) {
        vendor = 'Kogan';
    } else if (nameLower.includes('bed') || nameLower.includes('sofa') || nameLower.includes('table') || nameLower.includes('chair') || nameLower.includes('wardrobe') || nameLower.includes('dresser') || nameLower.includes('kallax') || nameLower.includes('bookshelf') || nameLower.includes('desk') || nameLower.includes('caddy')) {
        vendor = 'IKEA';
    } else if (categoryLower.includes('linen') || categoryLower.includes('bedding') || nameLower.includes('towel') || nameLower.includes('sheet') || nameLower.includes('pillow') || nameLower.includes('quilt')) {
        vendor = 'Target'; // Good place for linen
    }

    updateVendorStmt.run(vendor, item.id);
    vendor_updates++;
}

console.log(`Updated vendors for ${vendor_updates} items.`);
console.log('Migration completed successfully.');
