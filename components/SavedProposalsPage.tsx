import React, { useState, useEffect } from 'react';
import { Loader2, Eye, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import type { FullProposal } from '../types/proposal';

interface SavedProposalsPageProps {
  onViewProposal: (id: string) => void;
}

export function SavedProposalsPage({ onViewProposal }: SavedProposalsPageProps) {
  const [proposals, setProposals] = useState<FullProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/proposals`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error(error.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/proposals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      setProposals(proposals.filter(p => p.id !== id));
      toast.success('Proposal deleted');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete proposal');
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.selectedIdea?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.projectUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4472C4]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Proposals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search proposals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'No proposals match your search' : 'No proposals saved yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="bg-[#323232] border-white/10 hover:border-white/20 transition-colors">
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">{proposal.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {proposal.selectedIdea?.title || 'No idea selected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposal.projectUrl && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {proposal.projectUrl}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  <p>Saved: {new Date(proposal.savedAt || proposal.generatedAt || '').toLocaleDateString()}</p>
                  {proposal.updatedAt && proposal.updatedAt !== proposal.savedAt && (
                    <p>Updated: {new Date(proposal.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onViewProposal(proposal.id!)}
                    className="flex-1"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDelete(proposal.id!)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
