import React from 'react';
import { createRoot } from 'react-dom/client';
import { Explorer } from './Explorer.js';
import './explorer.css';
import '../kit/styles.css';

const root=document.getElementById('root');
if(!root) throw new Error('Missing #root');
createRoot(root).render(<React.StrictMode><Explorer/></React.StrictMode>);
