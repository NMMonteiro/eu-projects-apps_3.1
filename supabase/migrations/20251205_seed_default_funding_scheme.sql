-- Seed default funding scheme template
-- This matches the current hardcoded proposal structure for backward compatibility
-- Allows existing workflows to continue working unchanged

INSERT INTO public.funding_schemes (name, description, is_default, is_active, template_json) 
VALUES (
    'Default Template',
    'Generic proposal template with standard sections. Compatible with existing proposals and suitable for general funding applications.',
    true,
    true,
    '{
        "schemaVersion": "1.0",
        "sections": [
            {
                "key": "introduction",
                "label": "Introduction",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 1,
                "description": "Project background, context, and rationale"
            },
            {
                "key": "objectives",
                "label": "Objectives",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 2,
                "description": "Project objectives, goals, and expected outcomes"
            },
            {
                "key": "relevance",
                "label": "Relevance",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": true,
                "order": 3,
                "description": "Relevance to the funding call and alignment with program priorities"
            },
            {
                "key": "methods",
                "label": "Methodology",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": true,
                "order": 4,
                "description": "Methodology, approach, and implementation strategy"
            },
            {
                "key": "impact",
                "label": "Impact",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": true,
                "order": 5,
                "description": "Expected impact, results, and beneficiaries"
            },
            {
                "key": "workPlan",
                "label": "Work Plan",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 6,
                "description": "Detailed work plan, activities, and timeline"
            },
            {
                "key": "dissemination",
                "label": "Dissemination & Communication",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 7,
                "description": "Dissemination and communication strategy"
            },
            {
                "key": "sustainability",
                "label": "Sustainability",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 8,
                "description": "Project sustainability and long-term impact"
            },
            {
                "key": "innovation",
                "label": "Innovation",
                "type": "textarea",
                "charLimit": null,
                "wordLimit": null,
                "mandatory": false,
                "order": 9,
                "description": "Innovative aspects and added value"
            }
        ],
        "metadata": {
            "totalCharLimit": null,
            "estimatedDuration": "2-3 hours"
        }
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.funding_schemes WHERE name = 'Default Template') THEN
        RAISE NOTICE 'Default funding scheme template created successfully';
    ELSE
        RAISE WARNING 'Failed to create default funding scheme template';
    END IF;
END $$;
