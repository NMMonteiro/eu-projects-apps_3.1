// Prompt Builder module for AI integration
// Constructs prompts for Google Gemini API

export function buildPhase2Prompt(summary: string, constraints: any, userPrompt?: string): string {
  const basePrompt = userPrompt
    ? `You are a creative brainstorming assistant.

🎯 MANDATORY USER REQUIREMENTS - HIGHEST PRIORITY:
${userPrompt}

CRITICAL: ALL project ideas MUST directly address these user requirements.
If a specific budget or duration is mentioned above, it is a MANDATORY constraint.
============================================================

CONTEXT SUMMARY: ${summary}

CONSTRAINTS:
- Partners: ${constraints.partners || 'Not specified'}
- Budget: ${constraints.budget || 'Not specified'}
- Duration: ${constraints.duration || 'Not specified'}

TASK: Generate 6-10 high-quality project ideas that DIRECTLY address the user requirements above.

Each idea must:
1. Clearly relate to the user's requirements (e.g., if a specific topic or budget is mentioned, include it)
2. Be feasible within the constraints
3. Be innovative and impactful

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no backticks) with this structure:
{
  "ideas": [
    {
      "title": "Project idea title clearly related to user requirements",
      "description": "Detailed description (2-3 sentences) showing how this fulfills the user requirements"
    }
  ]
}

Return ONLY valid JSON, no other text.`
    : `You are a creative brainstorming assistant.

CONTEXT SUMMARY: ${summary}

CONSTRAINTS:
- Partners: ${constraints.partners || 'Not specified'}
- Budget: ${constraints.budget || 'Not specified'}
- Duration: ${constraints.duration || 'Not specified'}

TASK: Generate 6-10 innovative project ideas based on the context summary.

Each idea should:
1. Align with the funding opportunity
2. Be feasible within the constraints
3. Be innovative and impactful

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no backticks) with this structure:
{
  "ideas": [
    {
      "title": "Project idea title",
      "description": "Detailed description (2-3 sentences)"
    }
  ]
}

Return ONLY valid JSON, no other text.`;

  return basePrompt;
}

export function buildRelevancePrompt(
  url: string,
  urlContent: string,
  constraints: any,
  ideas: any[],
  userPrompt?: string
): string {
  const basePrompt = userPrompt
    ? `Validate these project ideas against the user requirements and source content.

USER REQUIREMENTS (PRIMARY CRITERION - MUST BE 100% SATISFIED):
${userPrompt}

SOURCE URL: ${url}
SOURCE CONTENT: ${urlContent.substring(0, 5000)}

PROJECT IDEAS:
${JSON.stringify(ideas, null, 2)}

TASK: Evaluate how well the ideas address the user requirements AND align with the source content.
If an idea deviates from a specific budget, duration, or topic mentioned in USER REQUIREMENTS, it must be scored 'Poor'.

Scoring:
- "Good": Ideas strongly address user requirements and align with source
- "Fair": Ideas partially address requirements or have moderate alignment
- "Poor": Ideas miss user requirements or don't align with source

OUTPUT FORMAT (JSON ONLY):
{
  "score": "Good" | "Fair" | "Poor",
  "justification": "Explain why the ideas match or miss the requirements and source content"
}

Return ONLY valid JSON, no other text.`
    : `Validate these project ideas against the source content.

SOURCE URL: ${url}
SOURCE CONTENT: ${urlContent.substring(0, 5000)}

PROJECT IDEAS:
${JSON.stringify(ideas, null, 2)}

CONSTRAINTS:
${JSON.stringify(constraints, null, 2)}

TASK: Evaluate how well the ideas align with the source content and constraints.

Scoring:
- "Good": Ideas strongly align with source and constraints
- "Fair": Ideas partially align
- "Poor": Ideas don't align well

OUTPUT FORMAT (JSON ONLY):
{
  "score": "Good" | "Fair" | "Poor",
  "justification": "Explain the alignment assessment"
}

Return ONLY valid JSON, no other text.`;

  return basePrompt;
}

export function buildProposalPrompt(
  idea: any,
  summary: string,
  constraints: any,
  partners: any[] = [],
  userPrompt?: string,
  fundingScheme?: any
): string {
  // Helper to flatten sections and subsections
  interface FlatSection {
    key: string;
    label: string;
    description: string;
    charLimit?: number;
    aiPrompt?: string;
  }

  const flattenSections = (sections: any[]): FlatSection[] => {
    let result: FlatSection[] = [];
    sections.forEach(s => {
      const fallbackKey = (s.label || 'section').toLowerCase().replace(/\s+/g, '_').replace(/\W/g, '');
      const validKey = s.key || fallbackKey;

      result.push({
        key: validKey,
        label: s.label || 'Untitled Section',
        description: s.description || '',
        charLimit: s.charLimit,
        aiPrompt: s.aiPrompt
      });
      if (s.subsections && s.subsections.length > 0) {
        result = [...result, ...flattenSections(s.subsections)];
      }
    });
    return result;
  };

  let allSections = fundingScheme?.template_json?.sections
    ? flattenSections(fundingScheme.template_json.sections)
    : [
      { key: 'project_summary', label: 'Project Summary', description: 'Overview of project.' },
      { key: 'relevance', label: 'Relevance', description: 'Why this project is needed.' },
      { key: 'impact', label: 'Impact', description: 'Expected change.' }
    ];

  // ALWAYS FORCE 4 WPs in the narrative sections if not present
  const hasMultipleWPs = allSections.some(s => s.key.includes('work_package_2'));
  if (!hasMultipleWPs) {
    const wp1Idx = allSections.findIndex(s => s.key.includes('work_package_1'));
    const insertIdx = wp1Idx !== -1 ? wp1Idx + 1 : allSections.length;

    // If WP1 is missing too, add it
    if (wp1Idx === -1) {
      allSections.push({ key: 'work_package_1', label: 'Work Package 1: Management', description: 'Coordination and admin.' });
    }

    allSections.splice(insertIdx, 0,
      { key: 'work_package_2', label: 'Work Package 2: Technical Development', description: 'Building the core solution.' },
      { key: 'work_package_3', label: 'Work Package 3: Implementation', description: 'Deploying and testing.' },
      { key: 'work_package_4', label: 'Work Package 4: Dissemination', description: 'Sharing results.' }
    );
  }

  const partnerInfo = partners.length > 0
    ? `\n\nCONSORTIUM PARTNERS (REQUIRED - YOU MUST USE ALL OF THEM):\n${partners.map(p => `- ${p.name}${p.acronym ? ` (${p.acronym})` : ''} - ${p.country || 'Country not specified'}${p.isCoordinator ? ' [LEAD COORDINATOR]' : ''}\n  - Profile: ${p.description || 'No description'}\n  - Expertise: ${p.experience || ''}`).join('\n')}`
    : '';

  const userRequirements = userPrompt
    ? `\n\n🎯 MANDATORY USER REQUIREMENTS - MUST BE ADDRESSED IN ALL SECTIONS:\n${userPrompt}\n============================================================`
    : '';

  return `You are an expert EU funding proposal writer.

SELECTED PROJECT IDEA:
Title: ${idea.title}
Description: ${idea.description}

CONTEXT: ${summary}

CONSTRAINTS & REQUIREMENTS:
${userRequirements}
- Partners: ${constraints.partners || 'Not specified'}
- Budget: ${constraints.budget || 'Not specified'}
- Duration: ${constraints.duration || 'Not specified'}${partnerInfo}

CURRENT DATE: January 2026
CURRENCY: Format as "€XXX,XXX" (comma for thousands).

TASK: Generate a comprehensive, HIGH-QUALITY technical funding proposal.

STRICT JSON OUTPUT RULES:
1. **EXACTLY ${partners.length || 1} PARTNERS**: You MUST include EVERY partner mentioned in the context above in the "partners" array.
2. **EXACTLY 4 WORK PACKAGES**: You MUST generate EXACTLY 4 unique Work Packages (WP1, WP2, WP3, WP4) in the "workPackages" array.
3. **EXACTLY €${constraints.budget ? constraints.budget : '250,000'} TOTAL BUDGET**: The sum of all items in "budget" MUST be EXACTLY the requested amount.
4. **NARRATIVE SECTIONS**: Provide technical content for EVERY key in the "dynamicSections" object below.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "title": "${idea.title}",
  "partners": [
    ${partners.map(p => `{ "name": "${p.name}", "role": "State their specific role...", "isCoordinator": ${p.isCoordinator || false}, "description": "Technical description of their contribution..." }`).join(',\n    ')}
  ],
  "workPackages": [
    {
      "name": "WP1: Project Management & Coordination",
      "description": "...",
      "duration": "M1-M24",
      "activities": [{ "name": "Management", "description": "...", "leadPartner": "${partners[0]?.name || 'Partner 1'}", "participatingPartners": [${partners.slice(1).map(p => `"${p.name}"`).join(', ')}], "estimatedBudget": 10000 }],
      "deliverables": ["Management Plan"]
    },
    { "name": "WP2: Technical Design", "description": "...", "duration": "M3-M12", "activities": [...], "deliverables": [...] },
    { "name": "WP3: Implementation", "description": "...", "duration": "M12-M24", "activities": [...], "deliverables": [...] },
    { "name": "WP4: Dissemination & Sustainability", "description": "...", "duration": "M1-M24", "activities": [...], "deliverables": [...] }
  ],
  "budget": [
    {
      "item": "Staff Costs",
      "cost": 150000,
      "description": "...",
      "breakdown": [{ "subItem": "Senior Experts", "quantity": 10, "unitCost": 15000, "total": 150000 }],
      "partnerAllocations": [${partners.map(p => `{ "partner": "${p.name}", "amount": ${Math.floor(150000 / (partners.length || 1))} }`).join(', ')}]
    },
    { "item": "Miscellaneous / Contingency", "cost": 0, "description": "Adjustment to match exact budget requirement", "breakdown": [], "partnerAllocations": [] }
  ],
  "risks": [{ "risk": "...", "likelihood": "Low", "impact": "High", "mitigation": "..." }],
  "summary": "<p>Technical summary...</p>",
  "dynamicSections": {
    ${allSections.map((s: FlatSection) => `"${s.key}": "<p>Technical narrative for ${s.label}...</p>"`).join(',\n    ')}
  }
}

Return ONLY valid JSON.`;
}
