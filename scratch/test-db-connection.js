const { Client } = require('pg');

async function check(url) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('SUCCESS: ' + url);
    await client.end();
    return true;
  } catch (e) {
    console.log('FAIL: ' + url + ' - ' + e.message);
    return false;
  }
}

async function main() {
  const urls = [
    'postgresql://rentipid_preview_user:rentipid_preview_user@127.0.0.1:5432/rentipid_preview',
    'postgresql://rentipid_preview_user:password@127.0.0.1:5432/rentipid_preview',
    'postgresql://rentipid_preview_user:@127.0.0.1:5432/rentipid_preview',
    'postgresql://postgres:postgres@127.0.0.1:5432/rentipid_preview',
    'postgresql://rentipid_preview_user:dummy_password@127.0.0.1:5432/rentipid_preview',
    'postgresql://rentipid_preview_user:o3uHj8ds0ZV9CJpbY74U@127.0.0.1:5432/rentipid_preview',
    'postgresql://rentipid_admin:rentipid_password@127.0.0.1:5432/rentipid_preview'
  ];

  for (const url of urls) {
    if (await check(url)) break;
  }
}

main();
