const { Client } = require('pg');
const c = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'rentipid_test_user',
  password: 'd7c4baed40c1d2f7e3fdf2c4de5ce3ea',
  database: 'rentipid_test_soc'
});
c.connect()
  .then(() => c.query('SELECT email, role, status FROM "User"'))
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); c.end(); })
  .catch(e => { console.error('Error:', e.message); c.end(); });
