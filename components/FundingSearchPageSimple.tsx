import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loader2, Plus, ExternalLink, Search, Settings, Trash2, Save, CheckCircle, XCircle, AlertTriangle, Calendar, Euro, Clock, Building2, Users, ArrowLeft, Layers } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/primitives';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import { searchEuFunding } from '../utils/euApiService';

interface Opportunity {
  title: string;
  url: string;
  description: string;
  source: string;
  status?: string;
  deadline?: string;
  budget?: string;
  duration?: string;
  eligibility?: string;
  funding_entity?: string;
  call_id?: string;
  topic?: string;
  subCalls?: {
    title: string;
    call_id?: string;
    deadline?: string;
    url: string;
  }[];
  match?: {
    score: number;
    status: string;
    reason: string;
  };
}

interface CustomSource {
  url: string;
  description: string;
}

interface Partner {
  id: string;
  name: string;
  country?: string;
  organizationType?: string;
  description?: string;
}

export function FundingSearchPageSimple() {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [showStrictFilter, setShowStrictFilter] = useState(false);

  const [useAiSearch, setUseAiSearch] = useState(true);
  const [useLocalSources, setUseLocalSources] = useState(false);

  // Custom Sources State
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);

  // Partner State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerSuggestions, setPartnerSuggestions] = useState<Map<string, any[]>>(new Map());

  // Load custom sources & partners on mount
  useEffect(() => {
    const saved = localStorage.getItem('customFundingSources');
    if (saved) {
      try {
        setCustomSources(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom sources', e);
      }
    } else {
      // Pre-populate with Nordic funding sources
      const defaultSources: CustomSource[] = [
        {
          url: 'https://www.oph.fi/en/programmes/edufi-fellowship',
          description: 'EDUFI Fellowship (Finland) - Doctoral researchers'
        },
        {
          url: 'https://www.nordplusonline.org/',
          description: 'Nordplus - Nordic & Baltic education cooperation'
        },
        {
          url: 'https://www.nordicinnovation.org/funding',
          description: 'Nordic Innovation - Innovation & green transition'
        },
        {
          url: 'https://eeagrants.org/',
          description: 'EEA & Norway Grants - European cooperation'
        },
        {
          url: 'https://www.nationalgeographic.org/funding-opportunities/grants/',
          description: 'National Geographic Society Grants'
        }
      ];
      setCustomSources(defaultSources);
      localStorage.setItem('customFundingSources', JSON.stringify(defaultSources));
    }
    fetchPartners();
  }, []);



  const fetchPartners = async () => {
    try {
      const response = await fetch(`${serverUrl}/partners`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      } else {
        console.error('Failed to load partners:', response.statusText);
      }
    } catch (e) {
      console.error('Failed to fetch partners', e);
    }
  };

  const saveCustomSources = (sources: CustomSource[]) => {
    setCustomSources(sources);
    localStorage.setItem('customFundingSources', JSON.stringify(sources));
  };


  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!useAiSearch && !useLocalSources) {
      alert('Please select at least one search mode (AI or Local Sources).');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Call EU API directly from browser to bypass Supabase IP restrictions
      console.log('[Frontend] Calling EU API directly...');
      const opportunities = await searchEuFunding(query);
      console.log(`[Frontend] Received ${opportunities.length} opportunities from EU API`);

      // Client-side safety filter: Remove clearly expired opportunities
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Allow a 7-day grace period for potentially stale data
      const gracePeriod = new Date(today);
      gracePeriod.setDate(gracePeriod.getDate() - 7);

      const filteredOpportunities = opportunities.filter((opp: any) => {
        const deadlineStr = opp.deadline;

        // Keep if no deadline (might be rolling calls)
        if (!deadlineStr || deadlineStr === 'Unknown' || deadlineStr === 'TBD' || deadlineStr === 'undefined') {
          return true;
        }

        try {
          const deadlineDate = new Date(deadlineStr);

          // If date parsing failed, keep it
          if (isNaN(deadlineDate.getTime())) {
            console.log(`Keeping (invalid date): ${opp.title} (${deadlineStr})`);
            return true;
          }

          deadlineDate.setHours(0, 0, 0, 0);

          // Only filter out if MORE than 7 days expired
          if (deadlineDate >= gracePeriod) {
            return true;
          } else {
            console.log(`Filtered (>7 days expired): ${opp.title} (${deadlineStr})`);
            return false;
          }
        } catch (e) {
          // Keep if can't parse
          return true;
        }
      });

      console.log(`EU API returned ${opportunities.length}, client filtered to ${filteredOpportunities.length}`);
      setResults(filteredOpportunities);

    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (opp: Opportunity) => {
    setAnalyzing(opp.url);
    try {
      const selectedPartner = partners.find(p => p.id === selectedPartnerId);

      const { data, error } = await supabase.functions.invoke('search-funding', {
        body: {
          deepScrape: true,
          url: opp.url,
          partnerProfile: selectedPartner // Pass selected partner for matching
        },
      });

      if (error) throw error;

      // Update the result in the list with enhanced data
      setResults(prev => prev.map(item =>
        item.url === opp.url ? { ...item, ...data.opportunity } : item
      ));

      // Fetch partner suggestions if we have partners and detailed data
      if (partners.length > 0 && data.opportunity) {
        try {
          const { data: suggestionsData, error: suggestError } = await supabase.functions.invoke('search-funding', {
            body: {
              mode: 'suggestPartners',
              callDescription: data.opportunity.description || opp.description,
              callEligibility: data.opportunity.eligibility || '',
              callTopic: data.opportunity.topic || opp.topic || '',
              allPartners: partners
            },
          });

          if (!suggestError && suggestionsData?.suggestions) {
            setPartnerSuggestions(prev => new Map(prev).set(opp.url, suggestionsData.suggestions));
          }
        } catch (suggestErr) {
          console.error('Partner suggestion failed:', suggestErr);
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze opportunity. Check console for details.');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);
    // Process sequentially to avoid rate limits
    for (const opp of results) {
      // Skip if already analyzed (has call_id or eligibility)
      if (opp.call_id || opp.eligibility) continue;

      await handleAnalyze(opp);
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setAnalyzingAll(false);
  };

  const handleImport = async (opp: Opportunity) => {
    setImporting(opp.url);
    try {
      const { error } = await supabase
        .from('funding_opportunities')
        .insert({
          title: opp.title,
          url: opp.url,
          description: opp.description,
          status: opp.status || 'open',
          funding_entity: opp.source,
          deadline_date: opp.deadline && opp.deadline !== 'Unknown' ? new Date(opp.deadline) : null,
          budget_amount: opp.budget ? parseFloat(opp.budget.replace(/[^0-9.]/g, '')) : null,
        });

      if (error) throw error;
      alert('Opportunity imported successfully!');
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import opportunity. Check console for details.');
    } finally {
      setImporting(null);
    }
  };

  const displayedResults = showStrictFilter
    ? results.filter(r => r.deadline && r.deadline !== 'Unknown' && r.deadline !== 'TBD')
    : results;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Funding Search & Match</CardTitle>
            <CardDescription>
              Find EU grants and check eligibility for your partners.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSourcesDialogOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Sources
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-1/3">
              <Label className="text-xs mb-1 block text-muted-foreground">Select Partner (for matching)</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                <option value="">-- No Partner Selected --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-muted-foreground">Search Query</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. AI in Healthcare, Green Energy..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  Search
                </Button>
              </div>

              {/* Search Modes */}
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useAiSearch"
                    checked={useAiSearch}
                    onChange={(e) => setUseAiSearch(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="useAiSearch" className="text-xs cursor-pointer flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Search with AI
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useLocalSources"
                    checked={useLocalSources}
                    onChange={(e) => setUseLocalSources(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="useLocalSources" className="text-xs cursor-pointer flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Search in Local Sources (Deep Dive)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="strictMode"
                checked={showStrictFilter}
                onChange={(e) => setShowStrictFilter(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="strictMode" className="text-sm cursor-pointer">
                Strict Mode: Hide opportunities with unknown deadlines
              </Label>
            </div>
            {results.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleAnalyzeAll} disabled={analyzingAll || loading}>
                {analyzingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Analyze All Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {displayedResults.map((opp, idx) => (
          <Card key={idx} className={`transition-all ${opp.source === 'Custom Source' ? 'border-cyan-500/30 bg-cyan-500/5' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {opp.status && (
                      <Badge variant={opp.status.toLowerCase().includes('open') ? 'default' : 'secondary'}>
                        {opp.status}
                      </Badge>
                    )}
                    {opp.call_id && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {opp.call_id}
                      </Badge>
                    )}
                    {opp.source === 'Custom Source' && (
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        Custom Source
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg hover:underline cursor-pointer">
                    <a href={opp.url} target="_blank" rel="noopener noreferrer">
                      {opp.title}
                    </a>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> {opp.funding_entity || opp.source}
                  </div>
                </div>

                {/* Match Badge */}
                {opp.match && (
                  <div className={`flex flex-col items-end px-3 py-1 rounded border ${opp.match.status === 'Eligible' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    opp.match.status === 'Ineligible' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                    <div className="flex items-center gap-1 font-bold text-sm">
                      {opp.match.status === 'Eligible' ? <CheckCircle className="w-4 h-4" /> :
                        opp.match.status === 'Ineligible' ? <XCircle className="w-4 h-4" /> :
                          <AlertTriangle className="w-4 h-4" />}
                      {opp.match.status}
                    </div>
                    <div className="text-xs max-w-[200px] text-right mt-1 opacity-90">
                      {opp.match.reason}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {opp.description}
              </p>

              {/* Rich Data Grid */}
              {(opp.budget || opp.deadline || opp.duration) && (
                <div className="grid grid-cols-3 gap-4 mb-4 bg-muted/30 p-3 rounded-md text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Euro className="w-3 h-3" /> Budget</span>
                    <span className="font-medium">{opp.budget || 'TBD'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Deadline</span>
                    <span className="font-medium">{opp.deadline || 'TBD'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</span>
                    <span className="font-medium">{opp.duration || 'TBD'}</span>
                  </div>
                </div>
              )}

              {/* Eligibility */}
              {opp.eligibility && (
                <div className="text-xs bg-blue-500/10 p-3 rounded border border-blue-500/30 mt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-blue-300">Eligibility:</span>
                      <p className="text-gray-300 mt-1">{opp.eligibility}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nested Sub-Calls */}
              {opp.subCalls && opp.subCalls.length > 0 && (
                <div className="mt-4 border border-purple-500/30 bg-purple-500/5 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2 text-sm">
                    <Layers className="w-4 h-4" />
                    Specific Topics / Sub-Calls
                  </h4>
                  <div className="space-y-2">
                    {opp.subCalls.map((sub, subIdx) => (
                      <div key={subIdx} className="bg-card/50 p-3 rounded border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-[10px] border-purple-500/30 text-purple-300">
                                {sub.call_id || 'TOPIC'}
                              </Badge>
                              {sub.deadline && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {sub.deadline}
                                </span>
                              )}
                            </div>
                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline block mb-1">
                              {sub.title}
                            </a>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            onClick={() => handleImport({
                              ...opp,
                              title: sub.title,
                              url: sub.url,
                              call_id: sub.call_id,
                              deadline: sub.deadline,
                              description: `[Sub-call of ${opp.title}] ${opp.description}`, // Inherit description or fetch new?
                              budget: opp.budget, // Inherit budget for now
                              status: opp.status
                            })}
                            disabled={importing === sub.url}
                          >
                            {importing === sub.url ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3 mr-1" />
                            )}
                            Import
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partner Suggestions */}
              {partnerSuggestions.get(opp.url) && partnerSuggestions.get(opp.url)!.length > 0 && (
                <div className="mt-4 border border-cyan-500/30 bg-cyan-500/5 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    Suggested Partners (AI-Matched)
                  </h4>
                  <div className="space-y-2">
                    {partnerSuggestions.get(opp.url)!.slice(0, 3).map((suggestion, idx) => {
                      const partner = partners.find(p => p.id === suggestion.partnerId);
                      if (!partner) return null;

                      const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

                      return (
                        <div key={partner.id} className="bg-card/50 p-3 rounded border border-cyan-500/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{medalEmoji}</span>
                                <span className="font-semibold text-sm truncate">{partner.name}</span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {suggestion.matchScore}% Match
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAnalyze(opp)}
                                disabled={analyzing === opp.url}
                              >
                                {analyzing === opp.url ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Search className="w-4 h-4 mr-2" />
                                )}
                                Deep Analyze / Find Topics
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleImport(opp)}
                                disabled={importing === opp.url}
                              >
                                {importing === opp.url ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Plus className="w-4 h-4 mr-2" />
                                )}
                                Import
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAnalyze(opp)}
                disabled={analyzing === opp.url}
              >
                {analyzing === opp.url ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Deep Analyze / Find Topics
              </Button>
              <Button
                size="sm"
                onClick={() => handleImport(opp)}
                disabled={importing === opp.url}
              >
                {importing === opp.url ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Import
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {!loading && results.length === 0 && query && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No results found. Try a different search term.
          </CardContent>
        </Card>
      )}

      {/* Custom Sources - Full Screen Page */}
      {isSourcesDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsSourcesDialogOpen(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Manage Custom Funding Sources</h2>
                <p className="text-sm text-muted-foreground">Add direct links to funding portals or specific calls</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => setIsSourcesDialogOpen(false)}>
                Exit
              </Button>
              <Button onClick={() => setIsSourcesDialogOpen(false)} className="min-w-[120px]">
                Save & Close
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle>Funding Sources</CardTitle>
                    <CardDescription>The AI will include these sources in its search and analysis.</CardDescription>
                  </div>
                  <Button
                    onClick={() => saveCustomSources([...customSources, { url: '', description: '' }])}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Source
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium w-1/2">URL</th>
                          <th className="text-left p-4 font-medium w-1/2">Description (Optional)</th>
                          <th className="w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {customSources.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-muted-foreground bg-muted/10">
                              <div className="flex flex-col items-center gap-2">
                                <ExternalLink className="h-8 w-8 opacity-20" />
                                <p>No custom sources added yet.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {customSources.map((source, index) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/5">
                            <td className="p-3">
                              <Input
                                value={source.url}
                                onChange={(e) => {
                                  const newSources = [...customSources];
                                  newSources[index].url = e.target.value;
                                  saveCustomSources(newSources);
                                }}
                                placeholder="https://..."
                                className="border-transparent hover:border-input focus:border-input bg-transparent"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={source.description}
                                onChange={(e) => {
                                  const newSources = [...customSources];
                                  newSources[index].description = e.target.value;
                                  saveCustomSources(newSources);
                                }}
                                placeholder="e.g. Horizon Europe Health Portal"
                                className="border-transparent hover:border-input focus:border-input bg-transparent"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const newSources = [...customSources];
                                  newSources.splice(index, 1);
                                  saveCustomSources(newSources);
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
    </div>
  );
}