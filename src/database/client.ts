import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { DATABASE_CONFIG } from './constants';

const expoDb = openDatabaseSync(DATABASE_CONFIG.name);
const database = drizzle(expoDb, { schema });

export default database;
export type AppDatabase = typeof database;
