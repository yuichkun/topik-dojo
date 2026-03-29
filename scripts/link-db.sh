#!/bin/bash
# Script to create/update symlink to TopikDojo database for TablePlus

echo "🔗 Setting up database symlink for TablePlus..."

# Get the project directory (where the script is run from)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SYMLINK_PATH="$PROJECT_DIR/current-db.db"

# Find the current database file
DB_PATH=$(find ~/Library/Developer/CoreSimulator/Devices -name "TopikDojo.db" -type f 2>/dev/null | head -1)

if [ -n "$DB_PATH" ]; then
    # Create symlink in project directory
    ln -sf "$DB_PATH" "$SYMLINK_PATH"
    
    echo "✅ Symlink created/updated!"
    echo "📍 Database found at: $DB_PATH"
    echo "🔗 Symlink created at: $SYMLINK_PATH"
    echo ""
    echo "📊 Database info:"
    ls -la "$SYMLINK_PATH"
    echo ""
    echo "🎯 For TablePlus:"
    echo "   1. Open TablePlus"
    echo "   2. Create new connection > SQLite"
    echo "   3. Database path: $SYMLINK_PATH"
    echo "   4. Test & Save"
    echo ""
    echo "💡 Run this script again if the simulator/app is reset"
else
    echo "❌ TopikDojo.db not found"
    echo "Make sure:"
    echo "   1. iOS simulator is running"
    echo "   2. TopikDojo app has been launched at least once"
    echo "   3. Database has been initialized"
fi