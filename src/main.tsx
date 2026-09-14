import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not start the site: the #root element is missing from the document.');
}

createRoot(rootElement).render(
  <StrictMode>
    {/* BASE_URL is '/' locally and '/visit-pakistan/' on GitHub Pages. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
