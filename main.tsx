import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Main.tsx: Executing');

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Main.tsx: Root element not found');
} else {
    console.log('Main.tsx: Root element found, mounting App');
    const root = ReactDOM.createRoot(rootElement as HTMLElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
