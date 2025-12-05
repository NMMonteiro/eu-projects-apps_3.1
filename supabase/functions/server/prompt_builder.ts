// Prompt Builder module for AI integration
// Constructs prompts for Google Gemini API

export function buildPhase2Prompt(summary: string, constraints: any, userPrompt?: string): string {
  const basePrompt = userPrompt
    ? `You are a creative brainstorming assistant.

🎯 MANDATORY USER REQUIREMENTS - HIGHEST PRIORITY:
${userPrompt}

CRITICAL: ALL project ideas MUST directly address these user requirements.
============================================================

CONTEXT SUMMARY: ${summary}

CONSTRAINTS:
- Partners: ${constraints.partners || 'Not specified'}
- Budget: ${constraints.budget || 'Not specified'}
- Duration: ${constraints.duration || 'Not specified'}

TASK: Generate 6-10 high-quality project ideas that DIRECTLY address the user requirements above.

Each idea must:
1. Clearly relate to the user's requirements
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

USER REQUIREMENTS (PRIMARY CRITERION):
${userPrompt}

SOURCE URL: ${url}
SOURCE CONTENT: ${urlContent.substring(0, 5000)}

PROJECT IDEAS:
${JSON.stringify(ideas, null, 2)}

TASK: Evaluate how well the ideas address the user requirements AND align with the source content.

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
  userPrompt?: string
): string {
  const partnerInfo = partners.length > 0
    ? `\n\nCONSORTIUM PARTNERS:\n${partners.map(p => `- ${p.name} (${p.country || 'Country not specified'}): ${p.description || 'No description'}`).join('\n')}`
    : '';

  const userRequirements = userPrompt
    ? `\n\n🎯 MANDATORY USER REQUIREMENTS - MUST BE ADDRESSED IN ALL SECTIONS:\n${userPrompt}\n============================================================`
    : '';

  return `You are an expert EU funding proposal writer.

SELECTED PROJECT IDEA:
Title: ${idea.title}
Description: ${idea.description}

CONTEXT: ${summary}

CONSTRAINTS:
- Partners: ${constraints.partners || 'Not specified'}
- Budget: ${constraints.budget || 'Not specified'}
- Duration: ${constraints.duration || 'Not specified'}${partnerInfo}${userRequirements}

TASK: Generate a comprehensive 11-section funding proposal in EU format.

CRITICAL REQUIREMENTS:
1. 🚨 HIGHEST PRIORITY: You MUST STRICTLY ADHERE to all constraints specified in the "MANDATORY USER REQUIREMENTS" section above.
   - If the user specifies a MAX BUDGET (e.g. "50k"), the total budget MUST NOT exceed this amount.
   - If the user specifies a DURATION, you must use exactly that duration.
   - These user-defined constraints OVERRIDE any other defaults or inferred values.
${userPrompt ? '' : '2. All sections must align with the project idea'}
2. Use HTML formatting for text sections (<p>, <strong>, <ul>, <li>, etc.)
3. Generate realistic budget in Euros with detailed breakdowns
4. Create specific work packages with deliverables
5. Include risk assessment matrix
6. Generate monthly timeline
7. Include a detailed Dissemination & Communication strategy

OUTPUT FORMAT (JSON ONLY, no markdown):
{
  "title": "${idea.title}",
  "summary": "<p>Executive summary...</p>",
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
    { "name": "Partner Name", "role": "Role in project" }
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