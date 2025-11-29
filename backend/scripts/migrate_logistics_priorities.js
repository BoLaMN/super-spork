import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../house-planner.db');

console.log(`Migrating logistics priorities in ${dbPath}...`);

const db = new Database(dbPath);

try {
  // Update logistics items
  const updateLogistics = db.prepare("UPDATE logistics SET priority = 'Day 1' WHERE priority = 'Critical'");
  const result = updateLogistics.run();
  
  console.log(`Updated ${result.changes} logistics items from 'Critical' to 'Day 1'.`);
  
  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error);
}
