import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from 'konsta/react';
import './index.css';
import AppComponent from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App theme="ios">
      <AppComponent />
    </App>
  </StrictMode>,
);
