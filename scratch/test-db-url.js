const { URL } = require('url');

console.log('DATABASE_URL_PRESENT: ' + ('DATABASE_URL' in process.env ? 'YES' : 'NO'));

if (process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL);
    console.log('DATABASE_URL_PARSEABLE: YES');
    console.log('PROTOCOL_VALID: ' + (u.protocol === 'postgres:' || u.protocol === 'postgresql:' ? 'YES' : 'NO'));
    const isProdHost = u.hostname.includes('prod') || u.hostname.includes('aws') || u.hostname.includes('production');
    const isProdDb = u.pathname.includes('prod');
    console.log('HOST_CLASSIFICATION: ' + (isProdHost ? 'PRODUCTION' : 'PREVIEW'));
    console.log('DATABASE_CLASSIFICATION: ' + (isProdDb ? 'PRODUCTION' : 'PREVIEW'));
    console.log('DATABASE_SAFETY: ' + (isProdHost || isProdDb ? 'UNSAFE' : 'SAFE'));
  } catch(e) {
    console.log('DATABASE_URL_PARSEABLE: NO (' + e.name + ')');
    // Also log if it has a typo like missing protocol
    if (!process.env.DATABASE_URL.includes('://')) {
        console.log('Error details: Missing protocol delimiter ://');
    }
  }
}
