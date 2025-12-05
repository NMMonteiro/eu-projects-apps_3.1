import React, { useState } from 'react';
import { URLInputStep } from './URLInputStep';
import { IdeasStep } from './IdeasStep';
import { ProposalStep } from './ProposalStep';
import type { AnalysisResult, Idea, FullProposal } from '../types/proposal';

type Step = 'url-input' | 'ideas' | 'proposal';

interface ProposalGeneratorProps {
  onViewProposal?: (id: string) => void;
}

export function ProposalGenerator({ onViewProposal }: ProposalGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('url-input');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [proposal, setProposal] = useState<FullProposal | null>(null);

  const handleUrlSubmit = (result: AnalysisResult, url: string, prompt: string) => {
    setAnalysisResult(result);
    setSourceUrl(url);
    setUserPrompt(prompt);
    setCurrentStep('ideas');
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setCurrentStep('proposal');
  };

  const handleProposalGenerated = (generatedProposal: FullProposal) => {
    setProposal(generatedProposal);
  };

  const handleBackToUrl = () => {
    setCurrentStep('url-input');
    setAnalysisResult(null);
    setSourceUrl('');
    setUserPrompt('');
    setSelectedIdea(null);
    setProposal(null);
  };

  const handleBackToIdeas = () => {
    setCurrentStep('ideas');
    setSelectedIdea(null);
    setProposal(null);
  };

  return (
    <div className="p-6">
      {currentStep === 'url-input' && (
        <URLInputStep onSubmit={handleUrlSubmit} />
      )}

      {currentStep === 'ideas' && analysisResult && (
        <IdeasStep
          analysisResult={analysisResult}
          sourceUrl={sourceUrl}
          userPrompt={userPrompt}
          onSelectIdea={handleSelectIdea}
          onBack={handleBackToUrl}
        />
      )}

      {currentStep === 'proposal' && selectedIdea && analysisResult && (
        <ProposalStep
          selectedIdea={selectedIdea}
          analysisResult={analysisResult}
          userPrompt={userPrompt}
          onProposalGenerated={handleProposalGenerated}
          onBack={handleBackToIdeas}
          onViewProposal={onViewProposal}
        />
      )}
    </div>
  );
}