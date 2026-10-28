import assert from 'node:assert/strict';
import axios from 'axios';
import { installSessionHeaders } from '../src/services/sessionHeaders.js';

const requests = [];
const adapter = async config => {
  requests.push(config);
  return { status: 200, statusText: 'OK', headers: {}, config, data: config.url.endsWith('session.php') ? { status: 'success', csrf_token: 'synthetic-csrf' } : { status: 'success' } };
};
axios.defaults.adapter = adapter;
const api = axios.create({ baseURL: '/api', adapter });
installSessionHeaders(api);
for (const [method, url] of [['post','/face_clock.php'],['post','/face_enroll.php'],['put','/profile.php'],['delete','/employees.php?scope=lms']]) {
  requests.length = 0;
  await api.request({ method, url, data: {} });
  assert.equal(requests.length, 2, 'Mutation fetches server CSRF token: ' + url);
  assert.equal(requests[0].url, '/api/session.php');
  assert.equal(requests[1].headers.get('X-CSRF-Token'), 'synthetic-csrf');
}
for (const [method, url] of [['get','/attendance.php'],['post','/login.php'],['post','https://external.example/api/face_clock.php']]) {
  requests.length = 0;
  await api.request({ method, url, data: {} });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.get('X-CSRF-Token'), undefined);
}
requests.length = 0;
await axios.post('/api/face_clock.php', {});
assert.equal(requests[1].headers.get('X-CSRF-Token'), 'synthetic-csrf');
console.log('PASS: 8 CSRF URL, instance, read, login and external-origin scenarios.');
