const { execSync } = require('child_process');
const path = require('path');

const projectDir = path.resolve(__dirname);
const commands = [
  `npm install pg bcryptjs jsonwebtoken`,
  `npm install -D @types/pg @types/bcryptjs @types/jsonwebtoken`
];

for (const cmd of commands) {
  console.log(`Running: ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: projectDir, stdio: 'pipe' });
    console.log(output.toString());
  } catch (e) {
    console.log('stdout:', e.stdout?.toString());
    console.log('stderr:', e.stderr?.toString());
  }
}
