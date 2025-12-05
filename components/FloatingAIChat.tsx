import React, { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, toast } from './ui/primitives';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { serverUrl, publicAnonKey } from '../utils/supabase/info';
import { FullProposal } from '../types/proposal';

interface FloatingAIChatProps {
  proposalId: string;
  onProposalUpdate: (proposal: FullProposal) => void;
}

export function FloatingAIChat({ proposalId, onProposalUpdate }: FloatingAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
      { role: 'assistant', content: 'Hi! I can help you edit this proposal. Try "Make the summary more professional" or "Add a budget item for travel".' }
  ]);

  const handleSubmit = async () => {
    if(!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/proposals/${proposalId}/ai-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ instruction: userMsg }),
      });

      if(!response.ok) throw new Error("AI edit failed");
      
      const data = await response.json();
      onProposalUpdate(data.proposal);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Updated ${data.editedSection} section based on your feedback.` }]);
      toast.success(`Updated ${data.editedSection}`);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#4472C4] hover:bg-[#3561b0] text-white p-4 rounded-full shadow-lg z-50 transition-all hover:scale-105"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-[#323232] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.1)] bg-[#1e1e1e] rounded-t-lg">
        <h3 className="font-semibold text-white flex items-center"><Sparkles className="w-4 h-4 mr-2 text-[#4472C4]" /> AI Editor</h3>
        <button onClick={() => setIsOpen(false)} className="text-[#a8a8a8] hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-[#4472C4] text-white' : 'bg-[#1e1e1e] text-[#e8e8e8]'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-[#1e1e1e] p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4472C4]" />
                </div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-[#1e1e1e] rounded-b-lg flex gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Tell AI what to change..."
          className="bg-[#2b2b2b]"
        />
        <Button size="icon" onClick={handleSubmit} disabled={loading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}