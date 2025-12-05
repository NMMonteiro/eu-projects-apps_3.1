import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Search, Building2, Globe, Mail, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import type { Partner } from '../types/partner';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

interface PartnersPageProps {
    onEditPartner?: (id: string) => void;
}

export function PartnersPage({ onEditPartner }: PartnersPageProps) {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${serverUrl}/partners`, {
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load partners');
            }

            const data = await response.json();
            setPartners(data.partners || []);
        } catch (error: any) {
            console.error('Load error:', error);
            toast.error(error.message || 'Failed to load partners');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string, name: string) => {
        setPartnerToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!partnerToDelete) return;

        const { id, name } = partnerToDelete;
        setDeleteDialogOpen(false);

        try {
            const response = await fetch(`${serverUrl}/partners/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete partner');
            }

            setPartners(partners.filter(p => p.id !== id));
            toast.success(`${name} deleted`);
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete partner');
        } finally {
            setPartnerToDelete(null);
        }
    };

    const handleCreateNew = () => {
        if (onEditPartner) {
            onEditPartner('new');
        }
    };

    const filteredPartners = partners.filter(partner =>
        partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.acronym?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.organizationType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <Building2 className="h-6 w-6 text-primary" />
                        My Partners
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {partners.length} partner{partners.length !== 1 ? 's' : ''} in your consortium
                    </p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Partner
                </Button>
                <div className="relative ml-2">
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        id="partners-page-pdf-upload"
                        onChange={async (e) => {
                            console.log('=== FILE INPUT CHANGE DETECTED ===');
                            const file = e.target.files?.[0];
                            if (!file) {
                                console.log('No file selected');
                                return;
                            }
                            console.log('=== PDF IMPORT STARTED ===');
                            console.log('File selected:', file.name, file.size, 'bytes');

                            // Immediate feedback
                            const toastId = toast.loading('Starting upload...');

                            try {
                                const formData = new FormData();
                                formData.append('file', file);

                                console.log('Sending request to:', `${serverUrl}/import-partner-pdf`);

                                // Add timeout to fetch
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

                                const startTime = Date.now();
                                const response = await fetch(`${serverUrl}/import-partner-pdf`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${publicAnonKey}`,
                                    },
                                    body: formData,
                                    signal: controller.signal
                                });
                                clearTimeout(timeoutId);

                                const duration = Date.now() - startTime;
                                console.log('Response received after', duration, 'ms');
                                console.log('Response status:', response.status, response.statusText);

                                const responseText = await response.text();
                                console.log('Response body:', responseText);

                                if (!response.ok) {
                                    throw new Error(`Server returned ${response.status}: ${responseText}`);
                                }

                                const data = JSON.parse(responseText);
                                console.log('Extraction success! Partner ID:', data.partnerId);
                                const { partnerId } = data;

                                toast.dismiss(toastId);
                                toast.success('Partner imported successfully!');

                                // Navigate to edit page immediately
                                console.log('Navigating to partner edit page for:', partnerId);
                                if (onEditPartner) {
                                    onEditPartner(partnerId);
                                } else {
                                    console.error('onEditPartner callback is missing!');
                                }

                            } catch (error: any) {
                                console.error('=== PDF IMPORT ERROR ===', error);
                                toast.dismiss(toastId);

                                if (error.name === 'AbortError') {
                                    toast.error('Request timed out. The server took too long to respond.');
                                } else {
                                    toast.error(`Failed to import PDF: ${error.message}`);
                                }
                            } finally {
                                // Reset input
                                e.target.value = '';
                            }
                        }}
                    />
                    <Button
                        variant="outline"
                        onClick={() => document.getElementById('partners-page-pdf-upload')?.click()}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Import PDF
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, acronym, country, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredPartners.length === 0 ? (
                <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">
                        {searchQuery ? 'No partners match your search' : 'No partners added yet'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={handleCreateNew} variant="outline" className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Partner
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPartners.map((partner) => (
                        <Card key={partner.id} className="hover:border-primary/50 transition-colors group">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">{partner.name}</CardTitle>
                                        {partner.acronym && (
                                            <CardDescription className="text-xs mt-1">{partner.acronym}</CardDescription>
                                        )}
                                    </div>
                                    {partner.logoUrl && (
                                        <img
                                            src={partner.logoUrl}
                                            alt={partner.name}
                                            className="w-12 h-12 object-contain ml-2 bg-white/5 rounded-md p-1"
                                        />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {partner.country && (
                                        <Badge variant="outline" className="text-xs">
                                            <Globe className="h-3 w-3 mr-1" />
                                            {partner.country}
                                        </Badge>
                                    )}
                                    {partner.organizationType && (
                                        <Badge variant="secondary" className="text-xs">
                                            {partner.organizationType}
                                        </Badge>
                                    )}
                                </div>

                                {partner.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {partner.description}
                                    </p>
                                )}

                                {partner.contactEmail && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span className="line-clamp-1">{partner.contactEmail}</span>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={() => onEditPartner && onEditPartner(partner.id)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(partner.id, partner.name);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-white border border-red-500/20"
                                    >
                                        <span className="text-xl font-bold">×</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Partner"
                description={`Are you sure you want to delete ${partnerToDelete?.name}? This action cannot be undone.`}
            />
        </div>
    );
}