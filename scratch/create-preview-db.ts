import { Client } from 'pg';

async function main() {
    let url = process.env.DATABASE_URL!;
    url = url.replace(/\/rentipid_preview(\?|$)/, '/neondb$1');
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    try {
        await client.query('CREATE DATABASE rentipid_preview;');
        console.log('Database rentipid_preview created');
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}
main();
