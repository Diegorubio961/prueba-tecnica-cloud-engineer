require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/db/database');

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch((err) => {
    console.error('[startup] Failed to connect to database:', err.message);
    process.exit(1);
  });
