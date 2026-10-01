import React from 'react';
import { createRoot } from 'react-dom/client';
import { TakeoverDemo } from './TakeoverDemo.js';
import './takeover.css';

const params = new URLSearchParams(window.location.search);
const requested = params.get('frame');
const frame = requested === 'core' || requested === 'proof' ? requested : 'opening';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TakeoverDemo initialFrame={frame} />
  </React.StrictMode>
);
