import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer';
import process from 'process';
import './index.css'
import App from './App.jsx'

window.Buffer = Buffer;
window.process = process;
window.global = window;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
