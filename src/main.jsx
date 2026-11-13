import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Admin from './Admin.jsx';
import './styles.css';

const root = window.location.pathname.startsWith('/admin') ? <Admin /> : <App />;
createRoot(document.getElementById('root')).render(<React.StrictMode>{root}</React.StrictMode>);
