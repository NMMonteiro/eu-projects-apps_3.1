import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { fileUrl, fundingSchemeName } = await req.json()

        if (!fileUrl) {
            throw new Error('fileUrl is required')
        }

        console.log('📄 Parsing funding template:', fileUrl)

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    persistSession: false
                }
            }
        )

        // Download file from Supabase Storage
        console.log('⬇️  Downloading file from storage...')
        const { data: fileData, error: downloadError } = await supabaseClient
            .storage
            .from('funding-templates')
            .download(fileUrl)

        if (downloadError) {
            console.error('Download error:', downloadError)
            throw new Error(`Failed to download file: ${downloadError.message}`)
        }

        console.log('✅ File downloaded, size:', fileData.size, 'bytes')

        // Convert file to base64 for Gemini
        const arrayBuffer = await fileData.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        // Convert to base64
        let binary = ''
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        const base64Data = btoa(binary)

        // Determine MIME type from file extension
        const fileExtension = fileUrl.split('.').pop()?.toLowerCase()
        let mimeType = 'application/pdf'

        if (fileExtension === 'docx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else if (fileExtension === 'doc') {
            mimeType = 'application/msword'
        }

        console.log('📝 File type:', mimeType)

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.1, // Lower temperature for more consistent extraction
            }
        })

        console.log('🤖 Analyzing document with AI...')

        const prompt = `You are an expert at analyzing EU funding application guidelines and call documents.

TASK: Analyze this document and extract the proposal application structure.

For each section in the document, identify:
1. Section name/title (e.g., "1. Excellence", "Part B - Impact", "Criterion 1: Objectives")
2. A unique key in snake_case (e.g., "excellence", "impact", "objectives")
3. Order/sequence number (1, 2, 3...)
4. Character limit, word limit, or page limit (if specified in the document)
5. Whether the section is mandatory or optional
6. Any subsections (nested structure)
7. Brief description of what's required in that section

LOOK FOR PATTERNS LIKE:
- Section headings: "Section 1:", "Part A:", "Question 1:", "Criterion 1:", "1.", "2.", etc.
- Limits: "Maximum 5000 characters", "Max 3 pages", "Word limit: 2000", "up to 10 pages", "5000 characters max"
- Requirements: "Mandatory", "Required", "Optional", "If applicable", "Compulsory", "Must be completed"

COMMON SECTION NAMES TO LOOK FOR:
- Excellence / Scientific Excellence
- Objectives / Specific Objectives
- State of the Art / Background
- Methodology / Methods / Approach
- Impact / Expected Impact
- Dissemination / Exploitation / Communication
- Implementation / Work Plan / Project Management
- Resources / Consortium / Partners
- Budget / Budget Justification
- Ethics / Ethical Issues
- Data Management
- Relevance

IMPORTANT:
- Extract ALL sections mentioned in the document
- Be thorough and don't skip any sections
- If no limit is specified, use null
- If mandatory/optional is unclear, default to true (mandatory)

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, no extra text):

{
  "fundingScheme": "${fundingSchemeName || 'Extracted Funding Scheme'}",
  "extractedFrom": "${fileUrl}",
  "sections": [
    {
      "key": "excellence",
      "label": "1. Excellence",
      "charLimit": 5000,
      "wordLimit": null,
      "pageLimit": null,
      "mandatory": true,
      "order": 1,
      "description": "Describe the objectives, relation to state of the art, and innovative aspects",
      "subsections": []
    }
  ],
  "metadata": {
    "totalCharLimit": 50000,
    "totalWordLimit": null,
    "estimatedDuration": "3-4 hours"
  }
}

Return ONLY the JSON object, nothing else.`

        // Send document to Gemini for analysis
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            }
        ])

        const responseText = result.response.text()
        console.log('✅ AI analysis complete')
        console.log('Raw response length:', responseText.length)

        // Clean JSON response - remove markdown if present
        let cleanedText = responseText.trim()

        // Remove markdown code blocks
        cleanedText = cleanedText.replace(/```json\s*/g, '')
        cleanedText = cleanedText.replace(/```\s*/g, '')

        // Find JSON object boundaries
        const jsonStart = cleanedText.indexOf('{')
        const jsonEnd = cleanedText.lastIndexOf('}')

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No valid JSON object found in AI response')
        }

        const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1)

        console.log('Cleaned JSON length:', jsonText.length)

        // Parse the extracted template
        const extracted = JSON.parse(jsonText)

        console.log('✅ Successfully parsed template')
        console.log('   Funding Scheme:', extracted.fundingScheme)
        console.log('   Sections found:', extracted.sections?.length ?? 0)

        // Validate structure
        if (!extracted.sections || !Array.isArray(extracted.sections)) {
            throw new Error('Invalid template structure: sections array missing')
        }

        // Return extracted template
        return new Response(
            JSON.stringify({
                success: true,
                template: {
                    ...extracted,
                    needsReview: true // Always requires human review
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('❌ Error parsing template:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                details: error.stack
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
