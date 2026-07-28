const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
const models = [];
const lines = schema.split('\n');
for (const line of lines) {
  if (line.trim().startsWith('model ')) {
    models.push(line.trim().split(' ')[1]);
  }
}
fs.writeFileSync('scratch/models.json', JSON.stringify(models, null, 2));
console.log(`Found ${models.length} models.`);
