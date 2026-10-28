import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
function LoginRouter({ children }) {
  return createElement(MemoryRouter, { initialEntries: ['/login'] }, children);
}
export function renderLogin() {
  return renderToString(createElement(App, { Router: LoginRouter }));
}
