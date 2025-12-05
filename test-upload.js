
import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/nunom/Downloads/PIF_from_Learnmera-PIF-2025.pdf';
const url = 'https://swvvyxuozwqvyaberqvu.supabase.co/functions/v1/server/import-partner-pdf';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function upload() {
    try {
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, 'PIF_from_Learnmera-PIF-2025.pdf');

        console.log('Uploading...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

upload();
