const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<<<<<<< HEAD')) return;

  console.log(`Processing ${filePath}...`);
  const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [a-f0-9]+\r?\n/g;
  
  let newContent = content.replace(regex, '$1');
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Fixed ${filePath}`);
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'venv') continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.py'))) {
      processFile(fullPath);
    }
  }
}

walk('.');
console.log('Done.');
