const db = require('./db');
async function migrate() {
    const init = require('../models/init-models');
    init(db);

    try {
        await db.sync({ force: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Failed to synchronize database:', error);
    }
}

module.exports = migrate;
