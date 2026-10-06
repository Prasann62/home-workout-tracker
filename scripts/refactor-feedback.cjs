const fs = require('fs');
const path = require('path');
const dir = 'd:/fitness app/src/exercises';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (!content.includes('FEEDBACK_TYPE')) {
    content = content.replace(/from '\.\.\/utils\/poseUtils\.js';/, `, FEEDBACK_TYPE } from '../utils/poseUtils.js';`);
  }

  // Replace this.feedback = '...' with object
  content = content.replace(/this\.feedback\s*=\s*['"]([^'"]+)['"]/g, (match, msg) => {
    let type = 'FEEDBACK_TYPE.INFO';
    const lower = msg.toLowerCase();
    if (lower.includes('good')) type = 'FEEDBACK_TYPE.GOOD';
    else if (lower.includes('keep') || lower.includes('avoid') || lower.includes('level') || lower.includes('lower') || lower.includes('straight')) type = 'FEEDBACK_TYPE.FORM';
    else if (lower.includes('step') || lower.includes('visible')) type = 'FEEDBACK_TYPE.CAMERA';
    
    return `this.feedback = { type: ${type}, message: '${msg}' }`;
  });

  fs.writeFileSync(p, content);
}
console.log('Done modifying exercises');
