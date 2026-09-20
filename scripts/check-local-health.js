const https = require('https');
const fs = require('fs');

const ca = fs.readFileSync('C:/Users/user/AppData/Local/mkcert/rootCA.pem');
const targetHost = process.argv[2] || 'preview.rentipid.com.ph';

const req = https.request({
  hostname: '127.0.0.1',
  port: 443,
  path: '/api/health',
  headers: { Host: targetHost },
  ca: ca,
  servername: targetHost,
  rejectUnauthorized: true
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log(`[${targetHost}] HEALTH_STATUS: ` + res.statusCode);
    console.log(`[${targetHost}] HEALTH_BODY: ` + b);
  });
});

req.on('error', e => console.error('HEALTH_ERROR: ' + e.message));
req.end();
