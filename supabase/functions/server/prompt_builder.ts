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
  const partnerInfo = partners.length > 0
    ? `\n\nCONSORTIUM PARTNERS:\n${partners.map(p => `- ${p.name}${p.acronym ? ` (${p.acronym})` : ''} - ${p.country || 'Country not specified'}${p.isCoordinator ? ' [LEAD COORDINATOR]' : ''}\n  - Profile: ${p.description || 'No description'}\n  - Expertise: ${p.experience || ''}\n  - Past Projects: ${p.relevantProjects || ''}`).join('\n')}`
    : '';

  const userRequirements = userPrompt
    ? `\n\n🎯 MANDATORY USER REQUIREMENTS - MUST BE ADDRESSED IN ALL SECTIONS:\n${userPrompt}\n============================================================`
    : '';

  const dynamicSchemeInstructions = fundingScheme
    ? `\n\nFUNDING SCHEME TEMPLATE (${fundingScheme.name}):
The proposal MUST follow this specific structure. Generate content for the following sections inside a "dynamicSections" object:
${fundingScheme.template_json.sections.map((s: any) =>
      `- ${s.label} (Key: "${s.key}"): ${s.description}${s.charLimit ? ` [Limit: ${s.charLimit} chars]` : ''}`
    ).join('\n')}`
    : '';

  const dynamicOutputFormat = fundingScheme
    ? `\n  "dynamicSections": {
${fundingScheme.template_json.sections.map((s: any) => `    "${s.key}": "<p>Content for ${s.label}...</p>"`).join(',\n')}
  },`
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
- Duration: ${constraints.duration || 'Not specified'}${partnerInfo}${dynamicSchemeInstructions}

TASK: Generate a comprehensive but CONCISE funding proposal.${fundingScheme ? ' Follow the FUNDING SCHEME TEMPLATE structure provided above.' : ''}
IMPORTANT: 
- Keep each text section under 2000 characters.
- Focus on quality over length. 
- Avoid repeating context or generalities.
- If you run out of space, ensure you close the JSON object properly.

STRICT ADHERENCE RULES (MANDATORY):
1. 🚨 HIGHEST PRIORITY: You MUST STRICTLY ADHERE to all instructions in the "MANDATORY USER REQUIREMENTS" section.
   - If the user specifies a BUDGET (e.g. "€250,000"), the TOTAL project budget MUST BE EXACTLY that amount (no more, no less). Adjust person-months or activities to match this total exactly.
   - If the user specifies a DURATION (e.g. "12 months"), the project timeline MUST be exactly that length.
   - If specific partners, technologies, or objectives are mentioned, they MUST be included.
   - User-defined constraints OVERRIDE any other defaults or inferred values.
2. All sections must align perfectly with the selected project idea and user requirements.
3. Use HTML formatting for text sections (<p>, <strong>, <ul>, <li>, etc.)
4. Generate a realistic budget in Euros with detailed breakdowns that sum up to the target budget.
5. Create specific work packages with deliverables that fit within the specified duration.
6. Include risk assessment matrix.
7. Generate monthly timeline matching the specified duration.
8. Include a detailed Dissemination & Communication strategy.

OUTPUT FORMAT (JSON ONLY, no markdown):
{
  "title": "${idea.title}",
  "summary": "<p>Executive summary...</p>",${dynamicOutputFormat}
  "relevance": "<p>Why this project is relevant...</p>",
  "impact": "<p>Expected impact...</p>",
  "methods": "<p>Methodology...</p>",
  "introduction": "<p>Introduction...</p>",
  "objectives": "<p>Project objectives...</p>",
  "methodology": "<p>Detailed methodology...</p>",
  "expectedResults": "<p>Expected results...</p>",
  "innovation": "<p>Innovation aspects...</p>",
  "sustainability": "<p>Sustainability plan...</p>",
  "consortium": "<p>Consortium description...</p>",
  "workPlan": "<p>Work plan...</p>",
  "riskManagement": "<p>Risk management...</p>",
  "dissemination": "<p>Dissemination and communication strategy...</p>",
  "partners": [
    { 
      "name": "Partner Name", 
      "acronym": "ACR",
      "role": "Role in project", 
      "isCoordinator": true,
      "country": "Country",
      "description": "Short description of role and contributions" 
    }
  ],
  "workPackages": [
    {
      "name": "WP1: Work Package Name",
      "description": "Description",
      "deliverables": ["Deliverable 1", "Deliverable 2"]
    }
  ],
  "milestones": [
    {
      "milestone": "Milestone description",
      "workPackage": "WP1",
      "dueDate": "Month 6"
    }
  ],
  "risks": [
    {
      "risk": "Risk description",
      "likelihood": "Low|Medium|High",
      "impact": "Low|Medium|High",
      "mitigation": "Mitigation strategy"
    }
  ],
  "budget": [
    {
      "item": "Personnel",
      "cost": 500000,
      "description": "Project staff costs",
      "breakdown": [
        { "subItem": "Project Manager", "quantity": 1, "unitCost": 80000, "total": 80000 },
        { "subItem": "Researchers", "quantity": 5, "unitCost": 70000, "total": 350000 }
      ]
    },
    {
      "item": "Dissemination",
      "cost": 50000,
      "description": "Dissemination and communication activities",
      "breakdown": [
        { "subItem": "Website & Social Media", "quantity": 1, "unitCost": 10000, "total": 10000 },
        { "subItem": "Events & Conferences", "quantity": 4, "unitCost": 10000, "total": 40000 }
      ]
    }
  ],
  "timeline": [
    {
      "phase": "Phase 1: Setup",
      "activities": ["Activity 1", "Activity 2"],
      "startMonth": 1,
      "endMonth": 6
    }
  ]
}

Return ONLY valid JSON, no other text.`;
}