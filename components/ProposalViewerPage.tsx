import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, FileText, LayoutGrid, Users, Calendar, DollarSign, AlertTriangle, CheckCircle2, Layers, Plus, Trash2, Settings, ChevronDown, Folder, Edit, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import type { FullProposal } from '../types/proposal';
import { PartnerSelectionModal } from './PartnerSelectionModal';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, Label } from '@/components/ui/primitives';
import type { ProposalSettings } from '../types/proposal';

interface ProposalViewerPageProps {
    proposalId: string;
    onBack: () => void;
}

export function ProposalViewerPage({ proposalId, onBack }: ProposalViewerPageProps) {
    const [proposal, setProposal] = useState<FullProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('narrative');
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [partnerToRemove, setPartnerToRemove] = useState<{ index: number; name: string } | null>(null);
    const [budgetLimit, setBudgetLimit] = useState<number>(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<ProposalSettings>({ currency: 'EUR', sourceUrl: '' });
    const [urlError, setUrlError] = useState<string>('');

    const [newlyAddedSubItem, setNewlyAddedSubItem] = useState<string | null>(null);
    const [isAiSectionDialogOpen, setIsAiSectionDialogOpen] = useState(false);
    const [aiSectionPrompt, setAiSectionPrompt] = useState('');
    const [isGeneratingSection, setIsGeneratingSection] = useState(false);

    // Editing State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');
    const [editingContent, setEditingContent] = useState('');
    const [aiEditInstruction, setAiEditInstruction] = useState('');
    const [isAiEditing, setIsAiEditing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getCurrencySymbol = (currency: string) => {
        return (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
    };

    const calculateTotal = (budget: any[]) => {
        if (!budget) return 0;
        return budget.reduce((sum, item) => {
            if (item.breakdown && item.breakdown.length > 0) {
                return sum + item.breakdown.reduce((subSum: number, sub: any) => subSum + (sub.total || 0), 0);
            }
            return sum + (item.cost || 0);
        }, 0);
    };

    useEffect(() => {
        loadProposal();
    }, [proposalId]);

    const loadProposal = async () => {
        try {
            const response = await fetch(`${serverUrl}/proposals/${proposalId}`, {
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load proposal');
            }

            const data = await response.json();
            setProposal(data);

            // Initialize budget limit from constraints if available
            if (data.constraints?.budget) {
                // Try to extract number from string like "50000 EUR" or "€50,000"
                const limitMatch = data.constraints.budget.replace(/,/g, '').match(/(\d+)/);
                if (limitMatch) {
                    setBudgetLimit(parseInt(limitMatch[0]));
                }
            }

            // Initialize settings
            if (data.settings) {
                setSettings(data.settings);
            } else {
                setSettings({
                    currency: 'EUR',
                    sourceUrl: data.projectUrl || ''
                });
            }
        } catch (error: any) {
            console.error('Load error:', error);
            toast.error(error.message || 'Failed to load proposal');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPartners = async (selectedPartners: any[]) => {
        if (!proposal) return;

        const newPartners = selectedPartners.map(p => ({
            name: p.name,
            role: 'Partner', // Default role
            description: p.description // Optional: carry over description if needed in proposal partner type
        }));

        const updatedProposal = {
            ...proposal,
            partners: [...(proposal.partners || []), ...newPartners]
        };

        setProposal(updatedProposal);

        // Save to backend
        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                method: 'PUT', // Assuming PUT updates the whole resource
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify(updatedProposal),
            });

            if (!response.ok) throw new Error('Failed to update proposal');
            toast.success('Partners added successfully');
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleRemovePartnerClick = (index: number, name: string) => {
        setPartnerToRemove({ index, name });
        setDeleteDialogOpen(true);
    };

    const handleRemovePartnerConfirm = async () => {
        if (!proposal) return;
        if (!partnerToRemove) return;

        const { index, name } = partnerToRemove;
        setDeleteDialogOpen(false);

        const updatedPartners = [...(proposal.partners || [])];
        updatedPartners.splice(index, 1);

        const updatedProposal = {
            ...proposal,
            partners: updatedPartners
        };

        setProposal(updatedProposal);

        // Save to backend
        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify(updatedProposal),
            });

            if (!response.ok) throw new Error('Failed to update proposal');
            toast.success(`${name} removed from proposal`);
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to save changes');
            // Revert on error
            setProposal(proposal);
        } finally {
            setPartnerToRemove(null);
        }
    };

    const handleSaveSettings = async (newSettings: ProposalSettings) => {
        if (!proposal) return;
        setSettings(newSettings);
        const updatedProposal = { ...proposal, settings: newSettings };
        setProposal(updatedProposal);

        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify(updatedProposal),
            });

            if (!response.ok) throw new Error('Failed to update settings');
            toast.success('Settings saved');
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to save settings');
        }
    };

    const handleEditSection = (sectionId: string, title: string, content: string) => {
        setEditingSectionId(sectionId);
        setEditingSectionTitle(title);
        setEditingContent(content);
        setAiEditInstruction('');
        setIsEditDialogOpen(true);
    };

    const handleManualSave = async () => {
        if (!proposal || !editingSectionId) return;

        const updatedProposal = { ...proposal, [editingSectionId]: editingContent };
        setProposal(updatedProposal);
        setIsEditDialogOpen(false);

        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify(updatedProposal),
            });

            if (!response.ok) throw new Error('Failed to update section');
            toast.success('Section updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleAiEdit = async () => {
        if (!proposal || !editingSectionId || !aiEditInstruction) return;

        setIsAiEditing(true);
        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}/ai-edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                    instruction: `For section '${editingSectionId}': ${aiEditInstruction}`,
                }),
            });

            if (!response.ok) throw new Error('AI edit failed');

            const data = await response.json();
            if (data.proposal) {
                setProposal(data.proposal);
                setEditingContent(data.proposal[editingSectionId]); // Update manual edit view too
                toast.success('AI updated the section!');
                // Optional: Switch to manual tab to review?
            }
        } catch (error) {
            console.error('AI Edit error:', error);
            toast.error('Failed to perform AI edit');
        } finally {
            setIsAiEditing(false);
        }
    };

    const handleUpdateBudget = async (newBudget: any[]) => {
        if (!proposal) return;

        const updatedProposal = {
            ...proposal,
            budget: newBudget
        };

        setProposal(updatedProposal);

        try {
            const response = await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify(updatedProposal),
            });

            if (!response.ok) throw new Error('Failed to update budget');
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to save budget changes');
            // Revert on error would be complex here due to rapid updates, 
            // relying on next load or user correction for now
        }
    };

    const handleAddBudgetItem = () => {
        if (!proposal) return;
        const newBudget = [...(proposal.budget || []), { item: 'New Item', description: 'Description', cost: 0 }];
        handleUpdateBudget(newBudget);
    };

    const handleRemoveBudgetItem = (index: number) => {
        if (!proposal || !proposal.budget) return;
        const newBudget = [...proposal.budget];
        newBudget.splice(index, 1);
        handleUpdateBudget(newBudget);
    };

    const handleAddSubItem = (itemIndex: number) => {
        if (!proposal || !proposal.budget) return;
        const newBudget = [...proposal.budget];

        if (!newBudget[itemIndex].breakdown) {
            newBudget[itemIndex].breakdown = [];
        }

        const newSubIndex = newBudget[itemIndex].breakdown!.length;
        newBudget[itemIndex].breakdown!.push({
            subItem: 'New Sub-item',
            quantity: 1,
            unitCost: 0,
            total: 0
        });

        // Recalculate main item cost
        const subItemsTotal = newBudget[itemIndex].breakdown!.reduce((sum, sub) => sum + sub.total, 0);
        newBudget[itemIndex].cost = subItemsTotal;

        handleUpdateBudget(newBudget);

        // Highlight the newly added sub-item
        const highlightKey = `${itemIndex}-${newSubIndex}`;
        setNewlyAddedSubItem(highlightKey);
        setTimeout(() => setNewlyAddedSubItem(null), 2000);
    };

    const handleRemoveSubItem = (itemIndex: number, subIndex: number) => {
        if (!proposal || !proposal.budget) return;
        const newBudget = [...proposal.budget];

        if (newBudget[itemIndex].breakdown) {
            newBudget[itemIndex].breakdown!.splice(subIndex, 1);

            // Recalculate main item cost
            const subItemsTotal = newBudget[itemIndex].breakdown!.reduce((sum, sub) => sum + sub.total, 0);
            newBudget[itemIndex].cost = subItemsTotal;

            handleUpdateBudget(newBudget);
        }
    };

    const handleSubItemChange = (itemIndex: number, subIndex: number, field: string, value: any) => {
        if (!proposal || !proposal.budget) return;
        const newBudget = [...proposal.budget];

        if (newBudget[itemIndex].breakdown) {
            const subItem = { ...newBudget[itemIndex].breakdown![subIndex], [field]: value };

            // Auto-calculate total if quantity or unitCost changes
            if (field === 'quantity' || field === 'unitCost') {
                const qty = field === 'quantity' ? value : subItem.quantity;
                const cost = field === 'unitCost' ? value : subItem.unitCost;
                subItem.total = qty * cost;
            }

            newBudget[itemIndex].breakdown![subIndex] = subItem;

            // Recalculate main item cost
            const subItemsTotal = newBudget[itemIndex].breakdown!.reduce((sum, sub) => sum + sub.total, 0);
            newBudget[itemIndex].cost = subItemsTotal;

            handleUpdateBudget(newBudget);
        }
    };

    const handleBudgetChange = (index: number, field: string, value: string | number) => {
        if (!proposal || !proposal.budget) return;
        const newBudget = [...proposal.budget];
        newBudget[index] = {
            ...newBudget[index],
            [field]: value
        };
        handleUpdateBudget(newBudget);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-muted-foreground">Proposal not found</p>
                <Button onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    // Build sections array including custom sections
    const baseSections = [
        { id: 'introduction', title: '1. Introduction', content: proposal.introduction },
        { id: 'relevance', title: '2. Relevance', content: proposal.relevance },
        { id: 'objectives', title: '3. Objectives', content: proposal.objectives },
        { id: 'methodology', title: '4. Methodology', content: proposal.methodology || proposal.methods },
        { id: 'workPlan', title: '5. Work Plan', content: proposal.workPlan },
        { id: 'expectedResults', title: '6. Expected Results', content: proposal.expectedResults },
        { id: 'impact', title: '7. Impact', content: proposal.impact },
        { id: 'innovation', title: '8. Innovation', content: proposal.innovation },
        { id: 'sustainability', title: '9. Sustainability', content: proposal.sustainability },
        { id: 'consortium', title: '10. Consortium', content: proposal.consortium },
        { id: 'riskManagement', title: '11. Risk Management', content: proposal.riskManagement },
        { id: 'dissemination', title: '12. Dissemination & Communication', content: proposal.dissemination },
    ];

    // Add custom sections if they exist
    const customSections = (proposal.customSections || []).map((section: any, idx: number) => ({
        id: section.id || `custom-${idx}`,
        title: `${baseSections.length + idx + 1}. ${section.title}`,
        content: section.content,
        isCustom: true
    }));

    const sections = [...baseSections, ...customSections];

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 -ml-2 hover:text-primary">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <span className="text-border">/</span>
                        <span className="text-xs uppercase tracking-wider">Proposal Viewer</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{proposal.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(proposal.generatedAt || '').toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            {proposal.workPackages?.length || 0} Work Packages
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {proposal.partners?.length || 0} Partners
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    {/* Settings Button */}
                    <Button variant="ghost" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="h-5 w-5" />
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(122,162,247,0.3)]">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-card/50 border border-border/40 p-1">
                    <TabsTrigger value="narrative" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <FileText className="h-4 w-4 mr-2" />
                        Narrative
                    </TabsTrigger>
                    <TabsTrigger value="structured" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Structured Data
                    </TabsTrigger>
                </TabsList>

                {/* Narrative Tab */}
                <TabsContent value="narrative" className="space-y-8">
                    {/* Executive Summary */}
                    <Card className="bg-card/40 border-primary/20 backdrop-blur-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <CardHeader>
                            <CardTitle className="text-xl text-primary flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5" />
                                Executive Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed">{proposal.summary}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Table of Contents (Sidebar) - Folder Style */}
                        <div className="hidden lg:block col-span-1 space-y-4">
                            <div className="sticky top-6 space-y-2">
                                <div className="flex items-center justify-between px-2 mb-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Document Structure</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
                                        title="Add New Section"
                                        onClick={() => setIsAiSectionDialogOpen(true)}
                                    >
                                        <span className="text-white text-sm font-bold">+</span>
                                    </Button>
                                </div>
                                <ScrollArea className="h-[calc(100vh-300px)] hide-scrollbar">
                                    <div className="space-y-0.5 pr-4 hide-scrollbar">
                                        {/* Executive Summary - Always visible */}
                                        <div className="group">
                                            <a
                                                href="#executive-summary"
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                                            >
                                                <FileText className="h-3.5 w-3.5 text-primary/70" />
                                                <span>Executive Summary</span>
                                            </a>
                                        </div>

                                        {/* Main Sections Folder */}
                                        <div className="mt-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-secondary/30 cursor-pointer group">
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                                                <Folder className="h-3.5 w-3.5 text-yellow-500/80" />
                                                <span className="text-muted-foreground font-medium flex-1">Narrative Sections</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20"
                                                    title="Add Section"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                >
                                                    <span className="text-primary text-xs font-bold">+</span>
                                                </Button>
                                            </div>
                                            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                                                {sections.map((section) => (
                                                    section.content && (
                                                        <a
                                                            key={section.id}
                                                            href={`#${section.id}`}
                                                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-secondary/50 text-muted-foreground hover:text-foreground group"
                                                        >
                                                            <div className="h-3.5 w-3.5 flex items-center justify-center">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 group-hover:bg-primary"></div>
                                                            </div>
                                                            <span className="text-xs">{section.title}</span>
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                        </div>

                                        {/* Work Packages Folder */}
                                        {proposal.workPackages && proposal.workPackages.length > 0 && (
                                            <div className="mt-2">
                                                <div
                                                    className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-secondary/30 cursor-pointer group"
                                                    onClick={() => {
                                                        setActiveTab('structured');
                                                        setTimeout(() => document.getElementById('work-packages')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                    }}
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                                                    <Folder className="h-3.5 w-3.5 text-blue-500/80" />
                                                    <span className="text-muted-foreground font-medium flex-1">Work Packages</span>
                                                    <span className="text-xs text-muted-foreground/60">{proposal.workPackages.length}</span>
                                                </div>
                                                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                                                    {proposal.workPackages.map((wp, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setActiveTab('structured');
                                                                setTimeout(() => document.getElementById('work-packages')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                            }}
                                                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-secondary/50 text-muted-foreground hover:text-foreground group cursor-pointer"
                                                        >
                                                            <Layers className="h-3.5 w-3.5 text-blue-500/60" />
                                                            <span className="text-xs truncate">{wp.name || `WP ${idx + 1}`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Partners Folder */}
                                        {proposal.partners && proposal.partners.length > 0 && (
                                            <div className="mt-2">
                                                <div
                                                    className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-secondary/30 cursor-pointer group"
                                                    onClick={() => {
                                                        setActiveTab('structured');
                                                        setTimeout(() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                    }}
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                                                    <Folder className="h-3.5 w-3.5 text-green-500/80" />
                                                    <span className="text-muted-foreground font-medium flex-1">Consortium</span>
                                                    <span className="text-xs text-muted-foreground/60">{proposal.partners.length}</span>
                                                </div>
                                                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                                                    <div
                                                        onClick={() => {
                                                            setActiveTab('structured');
                                                            setTimeout(() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                        }}
                                                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-secondary/50 text-muted-foreground hover:text-foreground cursor-pointer"
                                                    >
                                                        <Users className="h-3.5 w-3.5 text-green-500/60" />
                                                        <span className="text-xs">View All Partners</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Budget Folder */}
                                        <div className="mt-2">
                                            <div
                                                onClick={() => {
                                                    setActiveTab('structured');
                                                    setTimeout(() => document.getElementById('budget')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                }}
                                                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-secondary/30 cursor-pointer group"
                                            >
                                                <DollarSign className="h-3.5 w-3.5 text-emerald-500/80" />
                                                <span className="text-muted-foreground font-medium">Budget</span>
                                            </div>
                                        </div>

                                        {/* Risks Folder */}
                                        <div className="mt-2">
                                            <div
                                                onClick={() => {
                                                    setActiveTab('structured');
                                                    setTimeout(() => document.getElementById('risks')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                }}
                                                className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-secondary/30 cursor-pointer group"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500/80" />
                                                <span className="text-muted-foreground font-medium">Risk Management</span>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Content Sections */}
                        <div className="col-span-1 lg:col-span-3 space-y-8">
                            {sections.map((section) => (
                                section.content && (
                                    <div key={section.id} id={section.id} className="scroll-mt-24">
                                        <Card className="bg-card/30 border-border/40 hover:border-primary/20 transition-colors">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-lg font-semibold text-foreground/90">
                                                    {section.title}
                                                </CardTitle>
                                                <Button variant="ghost" size="sm" onClick={() => handleEditSection(section.id, section.title, section.content)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground/90 prose-headings:text-foreground prose-strong:text-primary/90 prose-li:text-muted-foreground/90">
                                                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Structured Data Tab */}
                <TabsContent value="structured" className="space-y-8">

                    {/* Partners Grid */}
                    <section id="partners">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Consortium Partners
                            </h3>
                            <Button size="sm" onClick={() => setIsPartnerModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Partner
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {proposal.partners?.map((partner, idx) => (
                                <Card key={idx} className="bg-card/30 border-border/40 hover:border-primary/30 transition-all hover:bg-card/50 group relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">
                                                    {partner.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs uppercase tracking-wide">
                                                    {partner.role}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-white border border-red-500/20 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePartnerClick(idx, partner.name);
                                                }}
                                            >
                                                <span className="text-xl font-bold">×</span>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <PartnerSelectionModal
                        isOpen={isPartnerModalOpen}
                        onClose={() => setIsPartnerModalOpen(false)}
                        onConfirm={handleAddPartners}
                        proposalContext={proposal.summary || ''}
                    />

                    {/* Work Packages */}
                    <section id="work-packages">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Work Packages
                        </h3>
                        <div className="space-y-4">
                            {proposal.workPackages?.map((wp, idx) => (
                                <Card key={idx} className="bg-card/30 border-border/40">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2 border-primary/30 text-primary">WP {idx + 1}</Badge>
                                                <CardTitle className="text-lg">{wp.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">{wp.description}</p>
                                        {wp.deliverables && wp.deliverables.length > 0 && (
                                            <div className="bg-secondary/30 rounded-lg p-4">
                                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deliverables</h5>
                                                <ul className="space-y-2">
                                                    {wp.deliverables.map((del, dIdx) => (
                                                        <li key={dIdx} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500/70 mt-0.5 shrink-0" />
                                                            <span>{del}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Budget */}
                    <section id="budget">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                Budget Breakdown
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Limit:</span>
                                <span className="text-sm text-muted-foreground">Limit:</span>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                        {getCurrencySymbol(settings.currency)}
                                    </span>
                                    <Input
                                        type="number"
                                        value={budgetLimit}
                                        onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)}
                                        className="w-32 h-8 bg-card/50 pl-7"
                                        placeholder="Limit"
                                    />
                                </div>
                            </div>
                        </div>
                        <Card className="bg-card/30 border-border/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary/50">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[30%]">Item</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[40%]">Description</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground w-[20%]">Cost</th>
                                            <th className="w-[10%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {proposal.budget?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {/* Main Item Row */}
                                                <tr className="hover:bg-white/5 transition-colors group bg-card/20">
                                                    <td className="py-2 px-4">
                                                        <Input
                                                            value={item.item}
                                                            onChange={(e) => handleBudgetChange(idx, 'item', e.target.value)}
                                                            className="bg-transparent border-transparent hover:border-border/40 focus:border-primary h-8 font-medium"
                                                            placeholder="Main Item Name"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleBudgetChange(idx, 'description', e.target.value)}
                                                            className="bg-transparent border-transparent hover:border-border/40 focus:border-primary h-8"
                                                            placeholder="Description"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center justify-end h-8 px-3 font-mono font-medium">
                                                            {formatCurrency(item.cost)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                                                                onClick={() => handleAddSubItem(idx)}
                                                                title="Add Sub-item"
                                                            >
                                                                <span className="text-white text-lg font-bold">+</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleRemoveBudgetItem(idx)}
                                                                title="Remove Item"
                                                            >
                                                                <span className="text-xl font-bold">×</span>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Sub-items */}
                                                {item.breakdown?.map((sub, subIdx) => {
                                                    const isNewlyAdded = newlyAddedSubItem === `${idx}-${subIdx}`;
                                                    return (
                                                        <tr key={`${idx}-${subIdx}`} className={`hover:bg-white/5 transition-all duration-500 group ${isNewlyAdded ? 'bg-green-500/20 animate-pulse' : ''
                                                            }`}>
                                                            <td className="py-1 px-4 pl-12 relative">
                                                                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-border"></div>
                                                                <Input
                                                                    value={sub.subItem}
                                                                    onChange={(e) => handleSubItemChange(idx, subIdx, 'subItem', e.target.value)}
                                                                    className="bg-transparent border-transparent hover:border-border/40 focus:border-primary h-7 text-xs"
                                                                    placeholder="Sub-item Name"
                                                                />
                                                            </td>
                                                            <td className="py-1 px-4">
                                                                <div className="flex gap-2">
                                                                    <div className="flex items-center gap-1 flex-1">
                                                                        <span className="text-xs text-muted-foreground">Qty:</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={sub.quantity}
                                                                            onChange={(e) => handleSubItemChange(idx, subIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                            className="bg-transparent border-transparent hover:border-border/40 focus:border-primary h-7 text-xs w-16"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-1 flex-1">
                                                                        <span className="text-xs text-muted-foreground">Cost:</span>
                                                                        <div className="relative flex-1">
                                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                                                                                {getCurrencySymbol(settings.currency)}
                                                                            </span>
                                                                            <Input
                                                                                type="number"
                                                                                value={sub.unitCost}
                                                                                onChange={(e) => handleSubItemChange(idx, subIdx, 'unitCost', parseFloat(e.target.value) || 0)}
                                                                                className="bg-transparent border-transparent hover:border-border/40 focus:border-primary h-7 text-xs w-full pl-5"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-1 px-4">
                                                                <div className="flex items-center justify-end h-7 px-3 font-mono text-xs text-muted-foreground">
                                                                    {formatCurrency(sub.total)}
                                                                </div>
                                                            </td>
                                                            <td className="py-1 px-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 rounded-lg hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleRemoveSubItem(idx, subIdx)}
                                                                >
                                                                    <span className="text-lg font-bold">×</span>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                        <tr>
                                            <td className="py-3 px-4 text-primary">Total</td>
                                            <td className="py-3 px-4">
                                                {budgetLimit > 0 && calculateTotal(proposal.budget || []) > budgetLimit && (
                                                    <div className="flex items-center text-red-400 text-xs animate-pulse">
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        Over Budget by {formatCurrency(calculateTotal(proposal.budget || []) - budgetLimit)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`py-3 px-4 text-right font-mono ${budgetLimit > 0 && calculateTotal(proposal.budget || []) > budgetLimit
                                                ? 'text-red-400'
                                                : 'text-primary'
                                                }`}>
                                                {formatCurrency(calculateTotal(proposal.budget || []))}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="p-4 border-t border-border/40">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddBudgetItem}
                                    className="w-full border-dashed border-border hover:border-primary hover:bg-primary/5"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Main Budget Item
                                </Button>
                            </div>
                        </Card>
                    </section>

                    {/* Risks */}
                    <section id="risks">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                            Risk Management
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {proposal.risks?.map((risk, idx) => (
                                <Card key={idx} className="bg-card/30 border-border/40">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-base">{risk.risk}</CardTitle>
                                            <Badge variant={risk.impact === 'High' ? 'destructive' : 'secondary'} className="shrink-0">
                                                {risk.impact} Impact
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Likelihood: </span>
                                            <span className="font-medium">{risk.likelihood}</span>
                                        </div>
                                        <div className="bg-secondary/30 p-3 rounded-md mt-2">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Mitigation</p>
                                            <p className="text-muted-foreground">{risk.mitigation}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                </TabsContent>
            </Tabs>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleRemovePartnerConfirm}
                title="Remove Partner from Proposal"
                description={`Are you sure you want to remove ${partnerToRemove?.name} from this proposal? This action cannot be undone.`}
            />

            {/* Project Configuration - Full Screen Page */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="border-b px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h2 className="text-xl font-semibold">Project Configuration</h2>
                                <p className="text-sm text-muted-foreground">Manage global settings and constraints</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="destructive" onClick={onBack}>
                                Exit Proposal
                            </Button>
                            <Button onClick={() => setIsSettingsOpen(false)} className="min-w-[120px]">
                                Save & Close
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto p-8 space-y-8">

                            {/* Main Settings Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>Configure the base parameters for your proposal</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-base">Project Currency</Label>
                                        <select
                                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={settings.currency}
                                            onChange={(e) => handleSaveSettings({ ...settings, currency: e.target.value })}
                                        >
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="CHF">CHF (Fr)</option>
                                            <option value="NOK">NOK (kr)</option>
                                            <option value="SEK">SEK (kr)</option>
                                            <option value="DKK">DKK (kr)</option>
                                            <option value="ISK">ISK (kr)</option>
                                            <option value="PLN">PLN (zł)</option>
                                            <option value="CZK">CZK (Kč)</option>
                                            <option value="HUF">HUF (Ft)</option>
                                            <option value="RON">RON (lei)</option>
                                            <option value="BGN">BGN (лв)</option>
                                            <option value="HRK">HRK (kn)</option>
                                            <option value="TRY">TRY (₺)</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground">Select the primary currency for budget calculations.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Source URL</Label>
                                        <Input
                                            className="h-12"
                                            value={settings.sourceUrl || ''}
                                            onChange={(e) => handleSaveSettings({ ...settings, sourceUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        <p className="text-xs text-muted-foreground">Link to the funding call or project description.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Custom Parameters Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div className="space-y-1">
                                        <CardTitle>Custom Parameters</CardTitle>
                                        <CardDescription>Define specific constraints like Max Budget, Duration, or Partner Requirements</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const newParams = [...(settings.customParams || []), { key: 'New Parameter', value: '' }];
                                            handleSaveSettings({ ...settings, customParams: newParams });
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Parameter
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="text-left p-4 font-medium w-1/3">Parameter Name</th>
                                                    <th className="text-left p-4 font-medium">Value</th>
                                                    <th className="w-[60px]"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(!settings.customParams || settings.customParams.length === 0) && (
                                                    <tr>
                                                        <td colSpan={3} className="p-8 text-center text-muted-foreground bg-muted/10">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Settings className="h-8 w-8 opacity-20" />
                                                                <p>No custom parameters defined yet.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {settings.customParams?.map((param, index) => (
                                                    <tr key={index} className="border-b last:border-0 hover:bg-muted/5">
                                                        <td className="p-3">
                                                            <Input
                                                                value={param.key}
                                                                onChange={(e) => {
                                                                    const newParams = [...(settings.customParams || [])];
                                                                    newParams[index].key = e.target.value;
                                                                    handleSaveSettings({ ...settings, customParams: newParams });
                                                                }}
                                                                className="border-transparent hover:border-input focus:border-input bg-transparent"
                                                                placeholder="e.g. Max Budget"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                value={param.value}
                                                                onChange={(e) => {
                                                                    const newParams = [...(settings.customParams || [])];
                                                                    newParams[index].value = e.target.value;
                                                                    handleSaveSettings({ ...settings, customParams: newParams });
                                                                }}
                                                                className="border-transparent hover:border-input focus:border-input bg-transparent"
                                                                placeholder="e.g. 500,000 EUR"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    const newParams = [...(settings.customParams || [])];
                                                                    newParams.splice(index, 1);
                                                                    handleSaveSettings({ ...settings, customParams: newParams });
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            {/* AI Section Generator Dialog */}
            <Dialog open={isAiSectionDialogOpen} onOpenChange={setIsAiSectionDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-primary" />
                            AI Section Generator
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">What section would you like to add?</label>
                            <Input
                                placeholder="E.g., 'Market Analysis', 'Technical Approach', 'Dissemination Strategy'..."
                                value={aiSectionPrompt}
                                onChange={(e) => setAiSectionPrompt(e.target.value)}
                                disabled={isGeneratingSection}
                            />
                        </div>
                        <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <SparklesIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">AI will generate:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Comprehensive content based on your proposal context</li>
                                        <li>• Well-structured paragraphs with proper formatting</li>
                                        <li>• Relevant to your project objectives and methodology</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAiSectionDialogOpen(false);
                                setAiSectionPrompt('');
                            }}
                            disabled={isGeneratingSection}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!aiSectionPrompt.trim() || !proposal) return;

                                setIsGeneratingSection(true);
                                try {
                                    // Call Gemini API to generate section content
                                    const response = await fetch(`${serverUrl}/generate-section`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${publicAnonKey}`,
                                        },
                                        body: JSON.stringify({
                                            sectionTitle: aiSectionPrompt,
                                            proposalContext: proposal?.summary || '',
                                            existingSections: sections.map(s => s.title)
                                        }),
                                    });

                                    if (!response.ok) throw new Error('Failed to generate section');

                                    const data = await response.json();

                                    // Add the new section to the proposal
                                    const newSection = {
                                        id: `custom-${Date.now()}`,
                                        title: data.title,
                                        content: data.content
                                    };

                                    const updatedProposal = {
                                        ...proposal,
                                        customSections: [...(proposal.customSections || []), newSection]
                                    };

                                    setProposal(updatedProposal);

                                    // Save to backend
                                    await fetch(`${serverUrl}/proposals/${proposal.id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${publicAnonKey}`,
                                        },
                                        body: JSON.stringify(updatedProposal),
                                    });

                                    toast.success(`Section "${aiSectionPrompt}" added successfully!`);

                                    setIsAiSectionDialogOpen(false);
                                    setAiSectionPrompt('');

                                    // Scroll to the new section after a short delay
                                    setTimeout(() => {
                                        document.getElementById(newSection.id)?.scrollIntoView({ behavior: 'smooth' });
                                    }, 300);
                                } catch (error) {
                                    console.error('Generation error:', error);
                                    toast.error('Failed to generate section. Please try again.');
                                } finally {
                                    setIsGeneratingSection(false);
                                }
                            }}
                            disabled={!aiSectionPrompt.trim() || isGeneratingSection}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isGeneratingSection ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-4 w-4 mr-2" />
                                    Generate Section
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Section Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Section: {editingSectionTitle}</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="manual" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Edit</TabsTrigger>
                            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
                            <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="flex-1 min-h-[300px] font-mono text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleManualSave}>Save Changes</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="ai" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
                            <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    AI Instructions
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Tell the AI how to improve this section. For example: "Make it more concise", "Add a paragraph about sustainability", or "Fix grammar".
                                </p>
                                <Textarea
                                    value={aiEditInstruction}
                                    onChange={(e) => setAiEditInstruction(e.target.value)}
                                    placeholder="Enter instructions for the AI..."
                                    className="h-24"
                                />
                                <Button
                                    onClick={handleAiEdit}
                                    disabled={!aiEditInstruction || isAiEditing}
                                    className="w-full"
                                >
                                    {isAiEditing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate with AI
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex-1 min-h-0 flex flex-col">
                                <Label>Current Content Preview:</Label>
                                <div className="flex-1 border rounded-md p-4 overflow-y-auto bg-card/50 mt-2 prose prose-invert max-w-none text-sm">
                                    <div dangerouslySetInnerHTML={{ __html: editingContent }} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div >
    );
}



function SparklesIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}