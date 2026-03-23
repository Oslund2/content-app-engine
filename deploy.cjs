const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const configPath = path.join(process.env.USERPROFILE, 'AppData/Roaming/netlify/Config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = Object.values(config.users)[0]?.auth?.token;
const siteId = 'ee252fed-ad18-4d4a-9a89-1d9a2db0250c';

function walkDir(dir, base) {
  let files = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = '/' + path.relative(base, fullPath).split(path.sep).join('/');
    if (entry.isDirectory()) {
      Object.assign(files, walkDir(fullPath, base));
    } else {
      const content = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      files[relPath] = hash;
    }
  }
  return files;
}

const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const functionsDir = path.join(__dirname, 'netlify', 'functions');
const fileHashes = walkDir(distDir, distDir);
console.log('Static files to deploy:', Object.keys(fileHashes).length);

// Build function hashes — bundle with esbuild then zip
function buildFunctionHashes() {
  const fnHashes = {};
  if (!fs.existsSync(functionsDir)) return fnHashes;

  // Bundle functions with esbuild first
  const buildDir = path.join(__dirname, '.netlify', 'fn-build');
  for (const entry of fs.readdirSync(functionsDir)) {
    if (!entry.endsWith('.mjs')) continue;
    const fnName = entry.replace('.mjs', '');
    const srcPath = path.join(functionsDir, entry);
    const outDir = path.join(buildDir, fnName);
    fs.mkdirSync(outDir, { recursive: true });
    execSync(`npx esbuild "${srcPath}" --bundle --platform=node --format=esm --outfile="${path.join(outDir, entry)}"`, { stdio: 'pipe' });
  }

  // Zip each bundled function
  for (const entry of fs.readdirSync(functionsDir)) {
    if (!entry.endsWith('.mjs')) continue;
    const fnName = entry.replace('.mjs', '');
    const bundleDir = path.join(buildDir, fnName);
    const zipPath = path.join(__dirname, '.netlify', 'fn-zips', fnName + '.zip');
    fs.mkdirSync(path.dirname(zipPath), { recursive: true });

    try {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      const psCmd = `Compress-Archive -Path '${bundleDir.replace(/\//g, '\\\\')}\\\\*' -DestinationPath '${zipPath.replace(/\//g, '\\\\')}' -Force`;
      execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'pipe' });
      const zipContent = fs.readFileSync(zipPath);
      const hash = crypto.createHash('sha1').update(zipContent).digest('hex');
      fnHashes[fnName] = hash;
      console.log(`  Function: ${fnName} (${zipContent.length}B zip)`);
    } catch (e) {
      console.error(`  Error zipping ${fnName}:`, e.message);
    }
  }
  return fnHashes;
}

console.log('Building function zips...');
const functionHashes = buildFunctionHashes();
console.log('Functions to deploy:', Object.keys(functionHashes).length);

function apiRequest(method, apiPath, data, contentType) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com', path: apiPath, method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': contentType || 'application/json' },
      rejectUnauthorized: false
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve(body); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function deploy() {
  const body = JSON.stringify({
    files: fileHashes,
    functions: functionHashes,
  });
  const deploy = await apiRequest('POST', '/api/v1/sites/' + siteId + '/deploys', body);
  console.log('Deploy:', deploy.id, '| State:', deploy.state);

  // Upload required static files
  const required = deploy.required || [];
  console.log('Uploading static files:', required.length);
  for (const hash of required) {
    const filePath = Object.keys(fileHashes).find(f => fileHashes[f] === hash);
    if (!filePath) continue;
    const content = fs.readFileSync(path.join(distDir, filePath));
    console.log(' ', filePath, '(' + content.length + 'B)');
    await apiRequest('PUT', '/api/v1/deploys/' + deploy.id + '/files' + filePath, content, 'application/octet-stream');
  }

  // Upload required functions
  const requiredFns = deploy.required_functions || [];
  console.log('Uploading functions:', requiredFns.length);
  for (const hash of requiredFns) {
    const fnName = Object.keys(functionHashes).find(f => functionHashes[f] === hash);
    if (!fnName) continue;
    const zipPath = path.join(__dirname, '.netlify', 'fn-zips', fnName + '.zip');
    const content = fs.readFileSync(zipPath);
    console.log('  ', fnName, '(' + content.length + 'B)');
    await apiRequest('PUT', '/api/v1/deploys/' + deploy.id + '/functions/' + fnName, content, 'application/zip');
  }

  console.log('Done! https://content-app-engine.netlify.app');
}
deploy().catch(e => console.error(e));
