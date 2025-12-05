import React, { useState } from 'react';
import { Loader2, Sparkles, AlertCircle, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import type { AnalysisResult } from '../types/proposal';

interface URLInputStepProps {
  onSubmit: (result: AnalysisResult, url: string, userPrompt: string) => void;
}

export function URLInputStep({ onSubmit }: URLInputStepProps) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation based on mode
    if (mode === 'url' && !url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    if (mode === 'text' && !userPrompt.trim()) {
      toast.error('Please enter your funding call text or project description');
      return;
    }

    setLoading(true);
    try {
      // In text mode, use a placeholder URL
      const submitUrl = mode === 'text' ? 'https://text-mode-placeholder.com' : url;

      const response = await fetch(`${serverUrl}/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ url: submitUrl, userPrompt: userPrompt.trim() || undefined }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('⏰ API Quota Limit Reached. Please try again later.');
        }
        throw new Error('Failed to analyze');
      }

      const data: AnalysisResult = await response.json();
      toast.success(`Generated ${data.ideas.length} project ideas!`);
      onSubmit(data, submitUrl, userPrompt);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-[#323232] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#4472C4]" />
            Step 1: Analyze Funding Call
          </CardTitle>
          <CardDescription>
            Enter a funding call URL or paste the text directly to generate project ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'url' | 'text')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Mode
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Funding Call URL *
                </label>
                <Input
                  placeholder="https://www.ukri.org/opportunity/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Specific Requirements (Optional)
                </label>
                <Textarea
                  placeholder="E.g., Focus on AI and sustainability, must include SMEs, budget under €1M..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={loading}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  If provided, all generated ideas will directly address these requirements
                </p>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Funding Call Text / Project Description *
                </label>
                <Textarea
                  placeholder="Paste the full funding call text here, or describe your project idea in detail..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={loading}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Provide as much detail as possible about the funding opportunity or your project concept
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleSubmit}
            disabled={loading || (mode === 'url' && !url.trim() && !userPrompt.trim()) || (mode === 'text' && !userPrompt.trim())}
            className="w-full bg-gradient-to-br from-[#4472C4] to-[#5B9BD5]"
            size="lg"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Analyzing...' : 'Analyze & Generate Ideas'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
