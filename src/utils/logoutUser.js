import axios from 'axios';
import { clearLoginCache } from './loginSession';
let logoutRequest = Promise.resolve();
export function logoutUser() {
  clearLoginCache();
  // The shared interceptor obtains the session CSRF token before this mutation.
  logoutRequest = axios.post('/api/logout.php').catch(() => {});
  return logoutRequest;
}
export function waitForLogout() { return logoutRequest; }
