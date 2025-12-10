import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportToDocx } from '../utils/export-docx';
import { FullProposal } from '../types/proposal';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export function TestExportPage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
        console.log(msg);
    };

    const runSimpleTest = async () => {
        addLog("Starting Simple Test...");
        try {
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [new TextRun("Hello World! This is a simple test.")]
                        }),
                    ],
                }],
            });

            addLog("Document created. Packing...");
            const blob = await Packer.toBlob(doc);
            addLog(`Blob created: ${blob.size} bytes. Valid type: ${blob.type}`);

            saveAs(blob, `simple_test_${Date.now()}.docx`);
            addLog("saveAs called.");
        } catch (e: any) {
            addLog(`ERROR: ${e.message}`);
            console.error(e);
        }
    };

    const runFullProposalTest = async () => {
        addLog("Starting Full Proposal Test...");
        const mockProposal: FullProposal = {
            id: '123',
            // userId, status, createdAt removed as they are not in the interface
            title: 'TEST PROPOSAL - ' + new Date().toISOString(),
            savedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            summary: 'This is a test summary.',
            introduction: 'Test Intro',
            relevance: 'Test Relevance',
            objectives: 'Test Objectives',
            methodology: 'Test Methodology',
            methods: 'Test Methods', // Added methods
            workPlan: 'Test Work Plan',
            expectedResults: 'Test Results',
            impact: 'Test Impact',
            innovation: 'Test Innovation',
            sustainability: 'Test Sustainability',
            consortium: 'Test Consortium',
            riskManagement: 'Test Risks',
            dissemination: 'Test Dissemination',
            budget: [
                { item: 'Staff', cost: 5000, description: 'Devs' },
                { item: 'Travel', cost: 1000, description: 'Kickoff' }
            ],
            dynamic_sections: {
                'extra_section': 'This is dynamic content.'
            },
            partners: [],
            workPackages: [],
            milestones: [],
            risks: [],
            timeline: [],
            // customSections: [] // Removed
            // Add funding scheme with logo for testing
            funding_scheme_id: '2141a2d5-b559-4cdb-a090-4b9fef79318c',
            funding_scheme: {
                id: '2141a2d5-b559-4cdb-a090-4b9fef79318c',
                name: 'KA210-ADU-78580463',
                logo_url: 'https://swvvyxuozwqvyaberqvu.supabase.co/storage/v1/object/public/funding-scheme-logos/logos/1765314670735_k7rehs.png',
                is_active: true,
                is_default: true,
                template_json: { schemaVersion: '1.0', sections: [] },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };

        try {
            addLog("Calling exportToDocx...");
            await exportToDocx(mockProposal);
            addLog("exportToDocx completed.");
        } catch (e: any) {
            addLog(`ERROR IN EXPORT: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">DOCX Export Debugger</h1>

            <Card>
                <CardHeader>
                    <CardTitle>1. Text File Test (Baseline)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Tries to save a .txt file using file-saver.
                    </p>
                    <Button onClick={() => {
                        const blob = new Blob(["Hello World"], { type: "text/plain;charset=utf-8" });
                        saveAs(blob, "hello.txt");
                        addLog("Sent hello.txt to saveAs");
                    }}>Test SaveAs</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Window Open Test (Popup)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Tries to open the blob in a new tab. If this opens a tab with "Hello World", your browser allows blobs but blocks "downloads".
                    </p>
                    <Button onClick={() => {
                        const blob = new Blob(["Hello World"], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        addLog("Attempted window.open(blobUrl)");
                    }} variant="secondary">Test Window Open</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>3. Minimal DOCX Test (FileSaver)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Generates a "Hello World" DOCX and uses file-saver.
                    </p>
                    <Button onClick={runSimpleTest}>Test Simple DOCX</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>4. Manual Anchor Link Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Bypasses file-saver and uses a manual &lt;a&gt; tag click.
                    </p>
                    <Button onClick={async () => {
                        addLog("Starting Manual Anchor Test...");
                        const doc = new Document({ sections: [{ children: [new Paragraph("Manual Test")] }] });
                        const blob = await Packer.toBlob(doc);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `manual_test_${Date.now()}.docx`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        addLog("Manual click triggered");
                    }} variant="secondary">Test Manual Anchor</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>5. Generate Link Test (DOCX)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Creates a visible link below. Click it manually to download.
                    </p>
                    <Button onClick={async () => {
                        try {
                            const doc = new Document({ sections: [{ children: [new Paragraph("Link Test")] }] });
                            const blob = await Packer.toBlob(doc);
                            // Explicitly slice nicely to ensure type
                            const newBlob = new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

                            addLog(`Generated Blob: ${newBlob.size} bytes, Type: ${newBlob.type}`);

                            const url = window.URL.createObjectURL(newBlob);
                            const link = document.getElementById('manual-link') as HTMLAnchorElement;
                            if (link) {
                                link.href = url;
                                link.download = `link_test_${Date.now()}.docx`;
                                link.classList.remove('hidden');
                                link.innerText = `DOWNLOAD DOCX (${newBlob.size} bytes)`;
                                addLog("Link generated. Please click it.");
                            }
                        } catch (e: any) {
                            addLog("Error generating link: " + e.message);
                        }
                    }}>Generate DOCX Link</Button>
                    <a id="manual-link" className="hidden block mt-4 p-4 bg-green-900/20 border border-green-500 text-green-400 rounded text-center cursor-pointer hover:bg-green-900/40 transition-colors" href="#"></a>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>5b. Generate Link Test (TEXT)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Try to download a simple text file via link.
                    </p>
                    <Button onClick={() => {
                        const blob = new Blob(["Hello Text File"], { type: "text/plain" });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.getElementById('manual-text-link') as HTMLAnchorElement;
                        if (link) {
                            link.href = url;
                            link.download = `text_test_${Date.now()}.txt`;
                            link.classList.remove('hidden');
                            link.innerText = "DOWNLOAD TEXT FILE";
                            addLog("Text Link generated.");
                        }
                    }}>Generate Text Link</Button>
                    <a id="manual-text-link" className="hidden block mt-4 p-4 bg-blue-900/20 border border-blue-500 text-blue-400 rounded text-center cursor-pointer hover:bg-blue-900/40 transition-colors" href="#"></a>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>6. Full Utility Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Uses the actual exportToDocx function.
                    </p>
                    <Button onClick={runFullProposalTest} variant="outline">Test Export Utility</Button>
                </CardContent>
            </Card>

            <Card className="bg-slate-950 text-slate-100">
                <CardHeader><CardTitle className="text-sm">Logs</CardTitle></CardHeader>
                <CardContent>
                    <div className="font-mono text-xs space-y-1 h-64 overflow-y-auto">
                        {logs.length === 0 && <span className="opacity-50">Waiting for action...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-white/10 pb-1">{log}</div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
