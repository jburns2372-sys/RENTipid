import * as fs from 'fs';

function updateFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/\/neondb(\?|$|\"|\')/g, '/rentipid_preview$1');
    // Also, just to be sure, check if PREVIEW_DATABASE_URL is set correctly if it exists
    if (!content.includes('PREVIEW_DATABASE_URL') && content.includes('DATABASE_URL')) {
        const dbUrlMatch = content.match(/DATABASE_URL=["']?(.*?)["']?(\n|$)/);
        if (dbUrlMatch) {
            content += `\nPREVIEW_DATABASE_URL="${dbUrlMatch[1]}"\n`;
        }
    }
    fs.writeFileSync(envPath, content);
    console.log(`Updated ${envPath} database name to rentipid_preview`);
  }
}

updateFile('.env.preview.local');
updateFile('.env.preview.agent.local');
updateFile('.env.preview');
