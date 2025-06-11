const db = require('./db');

async function testAuthentication() {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = testAuthentication;
