import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setTheme } from './theme';
import './tokens.css';

setTheme('dark');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
