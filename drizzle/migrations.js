// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_sturdy_silvermane.sql';
import m0001 from './0001_fluffy_maggott.sql';
import m0002 from './0002_productive_karnak.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  