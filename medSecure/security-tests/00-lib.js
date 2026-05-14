/**
 * MedSecure — Librería compartida de pruebas de seguridad
 */
const http = require('http');

function request(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = options.body ? JSON.stringify(options.body) : undefined;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method,
      headers,
      timeout: 10000,
    };

    const req = http.request(opts, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body, body: body });
        }
      });
    });

    req.on('error', err => reject(new Error(err.code || err.message || 'Connection failed')));
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(data || '{}');
    req.end();
  });
}

function get(url, options) { return request('GET', url, options); }
function post(url, options) { return request('POST', url, options); }
function del(url, options) { return request('DELETE', url, options); }
function patch(url, options) { return request('PATCH', url, options); }

function login(baseURL, email, password) {
  return post(`${baseURL}/api/auth/login`, { body: { email, password } });
}

function statusIcon(res, expected) {
  const ok = res.status === expected;
  return ok ? '✓' : '✗';
}

function color(s, ok) {
  return ok ? s : s;
}

module.exports = { request, get, post, del, patch, login, statusIcon };
