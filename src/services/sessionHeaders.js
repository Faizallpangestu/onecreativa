import axios from 'axios';
const protectedApis = /\/api\/[^/]+\.php$/;
export function installSessionHeaders(instance) {
  instance.interceptors.request.use(async config => {
    const origin = globalThis.location?.origin || 'http://localhost';
    // Axios instances use baseURL=/api with url=/face_clock.php.
    const target = new URL(instance.getUri(config), origin);
    if(!['get','head','options'].includes((config.method||'get').toLowerCase())&&target.origin===origin&&protectedApis.test(target.pathname)&&!target.pathname.endsWith('/login.php')) {
      const {data}=await axios.get(new URL('session.php', target).pathname);
      if(data.status!=='success'||!data.csrf_token)throw new Error('Sesi login tidak valid.');
      config.headers = axios.AxiosHeaders.from(config.headers);
      config.headers.set('X-CSRF-Token',data.csrf_token);
    }
    return config;
  });
}
installSessionHeaders(axios);
