const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

function client() {
  let token = 'current-token';
  let cleared = 0;
  const storage = {
    getAccessToken: async () => token,
    clearTokens: async () => { token = null; cleared++; },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('src/api/api.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, FormData,
    require: name => name === 'axios' ? axios
      : name === '@/src/utils/config' ? { API_URL: 'https://example.invalid/api' }
        : name === './tokenStorage' ? { tokenStorage: storage }
          : (() => { throw new Error(`Unexpected module ${name}`); })(),
  });
  return { ...module.exports, cleared: () => cleared, setToken: value => { token = value; } };
}
const success = config => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
const unauthorized = config => Promise.reject(new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, data: { detail: 'Expired' }, headers: {}, config }));

test('protected requests attach tokens; public requests omit them', async () => {
  const { api } = client();
  const seen = [];
  api.defaults.adapter = config => { seen.push(config); return success(config); };
  await api.get('/rescue/my-rescues/');
  await api.post('/token/', { username: 'sample', password: 'sample' });
  await api.post('/driver/', {});
  await api.get('/dashboard/predict/');
  assert.equal(seen[0].headers.Authorization, 'Bearer current-token');
  for (const config of seen.slice(1)) assert.equal(config.headers.Authorization, undefined);
});

test('simultaneous 401 responses clear tokens and notify once', async () => {
  const c = client();
  let notified = 0;
  c.setUnauthorizedCallback(() => { notified++; });
  c.api.defaults.adapter = unauthorized;
  const results = await Promise.allSettled([c.api.get('/rescue/my-rescues/'), c.api.get('/driver/1/')]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(c.cleared(), 1);
  assert.equal(notified, 1);
});

test('an old request cannot clear a newly signed-in token', async () => {
  const c = client();
  c.api.defaults.adapter = config => { c.setToken('new-session-token'); return unauthorized(config); };
  await assert.rejects(c.api.get('/rescue/my-rescues/'));
  assert.equal(c.cleared(), 0);
});

test('login failures do not log out; network and server failures are readable', async () => {
  const c = client();
  c.api.defaults.adapter = unauthorized;
  await assert.rejects(c.api.post('/token/', {}));
  assert.equal(c.cleared(), 0);
  assert.match(c.getApiErrorMessage(new axios.AxiosError('timeout', 'ECONNABORTED')), /timed out/);
  const error = new axios.AxiosError('server', 'ERR_BAD_RESPONSE', undefined, null, { status: 500, data: '<html>traceback</html>' });
  assert.match(c.getApiErrorMessage(error), /server is having a problem/);
  assert.ok(!c.getApiErrorMessage(error).includes('traceback'));
});
