import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Main.jsx: Executing');

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Main.jsx: Root element not found');
} else {
    console.log('Main.jsx: Root element found, mounting App');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
