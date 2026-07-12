const fs = require('fs');
const path = require('path');

function repairDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      repairDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // If the file starts with something like "import" but has literal \n
      if (content.includes('\\n')) {
        // We only want to replace literal \n if they were accidentally compressed.
        // The pattern of my bug was writing code as: "line1\nline2\nline3"
        // Wait, if it's literally written as \n, we can replace it.
        // Let's do a simple regex:
        content = content.replace(/\\n/g, '\n');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

repairDir(path.join(__dirname, 'apps', 'api', 'src'));
console.log('Repaired all files.');
