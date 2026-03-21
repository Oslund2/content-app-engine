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

const distDir = path.join(__dirname, 'dist');
const fileHashes = walkDir(distDir, distDir);
console.log('Files to deploy:', Object.keys(fileHashes).length);

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
  const body = JSON.stringify({ files: fileHashes });
  const deploy = await apiRequest('POST', '/api/v1/sites/' + siteId + '/deploys', body);
  console.log('Deploy:', deploy.id, '| State:', deploy.state);
  const required = deploy.required || [];
  console.log('Uploading:', required.length, 'files');
  for (const hash of required) {
    const filePath = Object.keys(fileHashes).find(f => fileHashes[f] === hash);
    if (!filePath) continue;
    const content = fs.readFileSync(path.join(distDir, filePath));
    console.log(' ', filePath, '(' + content.length + 'B)');
    await apiRequest('PUT', '/api/v1/deploys/' + deploy.id + '/files' + filePath, content, 'application/octet-stream');
  }
  console.log('Done! https://content-app-engine.netlify.app');
}
deploy().catch(e => console.error(e));
