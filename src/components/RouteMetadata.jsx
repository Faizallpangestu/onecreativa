import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateRouteMetadata } from '../utils/pageMetadata';
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => { updateRouteMetadata(pathname); }, [pathname]);
  return null;
}
