import { useState } from 'react';
import { FundingSchemeSection, FundingSchemeTemplate } from '../types/funding-scheme';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/primitives';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface TemplateEditorProps {
    template: FundingSchemeTemplate;
    onChange: (template: FundingSchemeTemplate) => void;
}

export function TemplateEditor({ template, onChange }: TemplateEditorProps) {
    const [sections, setSections] = useState<FundingSchemeSection[]>(template.sections || []);

    const updateSections = (newSections: FundingSchemeSection[]) => {
        setSections(newSections);
        onChange({
            ...template,
            sections: newSections
        });
    };

    const updateSection = (index: number, updates: Partial<FundingSchemeSection>) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], ...updates };
        updateSections(updated);
    };

    const removeSection = (index: number) => {
        const updated = sections.filter((_, i) => i !== index);
        // Reorder remaining sections
        updated.forEach((section, i) => {
            section.order = i + 1;
        });
        updateSections(updated);
    };

    const addSection = () => {
        const newSection: FundingSchemeSection = {
            key: `section_${sections.length + 1}`,
            label: `Section ${sections.length + 1}`,
            mandatory: false,
            order: sections.length + 1,
            charLimit: null,
            wordLimit: null,
            pageLimit: null,
            description: '',
            aiPrompt: ''
        };
        updateSections([...sections, newSection]);
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;

        const updated = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap sections
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

        // Update order numbers
        updated.forEach((section, i) => {
            section.order = i + 1;
        });

        updateSections(updated);
    };

    const updateMetadata = (key: string, value: any) => {
        onChange({
            ...template,
            metadata: {
                ...template.metadata,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Metadata Section */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Template Metadata</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Total Character Limit</Label>
                            <Input
                                type="number"
                                value={template.metadata?.totalCharLimit || ''}
                                onChange={(e) => updateMetadata('totalCharLimit', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Optional"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Total Word Limit</Label>
                            <Input
                                type="number"
                                value={template.metadata?.totalWordLimit || ''}
                                onChange={(e) => updateMetadata('totalWordLimit', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Optional"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Estimated Duration</Label>
                            <Input
                                value={template.metadata?.estimatedDuration || ''}
                                onChange={(e) => updateMetadata('estimatedDuration', e.target.value)}
                                placeholder="e.g., 3-4 hours"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Evaluation Criteria</Label>
                        <Input
                            value={template.metadata?.evaluationCriteria || ''}
                            onChange={(e) => updateMetadata('evaluationCriteria', e.target.value)}
                            placeholder="e.g., Excellence 50%, Impact 30%, Implementation 20%"
                            className="h-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                        Sections ({sections.length})
                    </h4>
                    <Button size="sm" variant="outline" onClick={addSection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                    </Button>
                </div>

                {sections.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                No sections defined yet
                            </p>
                            <Button size="sm" onClick={addSection}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Section
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {sections.map((section, idx) => (
                            <Card
                                key={idx}
                                className="bg-card hover:border-primary/50 transition-colors"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Drag Handle & Order */}
                                        <div className="flex flex-col items-center gap-1 pt-2">
                                            <button
                                                onClick={() => moveSection(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move up"
                                            >
                                                <GripVertical className="h-4 w-4 text-muted-foreground rotate-180" />
                                            </button>
                                            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {idx + 1}
                                            </span>
                                            <button
                                                onClick={() => moveSection(idx, 'down')}
                                                disabled={idx === sections.length - 1}
                                                className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move down"
                                            >
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </div>

                                        {/* Section Fields */}
                                        <div className="flex-1 space-y-4">
                                            {/* Label & Key */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">
                                                        Section Label <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        value={section.label}
                                                        onChange={(e) => updateSection(idx, { label: e.target.value })}
                                                        placeholder="e.g., 1. Excellence"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">
                                                        Key (snake_case) <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        value={section.key}
                                                        onChange={(e) => updateSection(idx, { key: e.target.value })}
                                                        placeholder="excellence"
                                                        className="h-9 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-2">
                                                <Label className="text-xs">Description / Instructions</Label>
                                                <Textarea
                                                    value={section.description || ''}
                                                    onChange={(e) => updateSection(idx, { description: e.target.value })}
                                                    rows={2}
                                                    className="resize-none text-sm"
                                                    placeholder="Instructions for users or AI..."
                                                />
                                            </div>

                                            {/* AI Prompt */}
                                            <div className="space-y-2">
                                                <Label className="text-xs">AI Prompt (Optional)</Label>
                                                <Textarea
                                                    value={section.aiPrompt || ''}
                                                    onChange={(e) => updateSection(idx, { aiPrompt: e.target.value })}
                                                    rows={2}
                                                    className="resize-none text-sm"
                                                    placeholder="Custom AI prompt for generating this section..."
                                                />
                                            </div>

                                            {/* Limits & Flags */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                        Char Limit:
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        className="w-24 h-8"
                                                        value={section.charLimit || ''}
                                                        onChange={(e) => updateSection(idx, {
                                                            charLimit: e.target.value ? parseInt(e.target.value) : null
                                                        })}
                                                        placeholder="None"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                        Word Limit:
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        className="w-24 h-8"
                                                        value={section.wordLimit || ''}
                                                        onChange={(e) => updateSection(idx, {
                                                            wordLimit: e.target.value ? parseInt(e.target.value) : null
                                                        })}
                                                        placeholder="None"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                        Page Limit:
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        className="w-24 h-8"
                                                        value={section.pageLimit || ''}
                                                        onChange={(e) => updateSection(idx, {
                                                            pageLimit: e.target.value ? parseInt(e.target.value) : null
                                                        })}
                                                        placeholder="None"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5 bg-background">
                                                        <Checkbox
                                                            id={`mandatory-${idx}`}
                                                            checked={section.mandatory}
                                                            onCheckedChange={(checked) => updateSection(idx, { mandatory: !!checked })}
                                                        />
                                                        <Label
                                                            htmlFor={`mandatory-${idx}`}
                                                            className="cursor-pointer text-xs font-medium"
                                                        >
                                                            Required
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                                            onClick={() => removeSection(idx)}
                                            title="Delete section"
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

            {/* Summary */}
            {sections.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <strong>Summary:</strong> {sections.length} section{sections.length !== 1 ? 's' : ''} defined
                    {sections.filter(s => s.mandatory).length > 0 && (
                        <> • {sections.filter(s => s.mandatory).length} required</>
                    )}
                    {template.metadata?.totalCharLimit && (
                        <> • {template.metadata.totalCharLimit.toLocaleString()} char limit</>
                    )}
                </div>
            )}
        </div>
    );
}
