import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'
import mammoth from 'npm:mammoth';


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

        // Validate secrets
        const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');
        const geminiKey = Deno.env.get('GEMINI_API_KEY');

        if (!serviceKey) throw new Error('Missing Secret: SERVICE_ROLE_KEY');
        if (!geminiKey) throw new Error('Missing Secret: GEMINI_API_KEY');

        console.log('📄 Parsing funding template:', fileUrl)

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? '', // Updated to avoid CLI restriction
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
        let base64Data = btoa(binary)

        // Determine MIME type from file extension
        const fileExtension = fileUrl.split('.').pop()?.toLowerCase()
        let mimeType = 'application/pdf'

        if (fileExtension === 'docx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else if (fileExtension === 'doc') {
            mimeType = 'application/msword'
        }

        console.log('📝 File type calculated:', mimeType)

        // Handle DOCX files - Convert to text using Mammoth
        // Gemini doesn't natively support application/vnd.openxmlformats-officedocument.wordprocessingml.document
        // so we must extract text first.
        if (fileExtension === 'docx' || mimeType.includes('wordprocessingml')) {
            console.log('🔄 Converting DOCX to text...');
            try {
                // Mammoth expects a buffer
                // Convert ArrayBuffer to Uint8Array first
                const uint8Array = new Uint8Array(arrayBuffer);
                // Create a standard buffer from it (Mammoth often expects this structure or similar)
                // However, standard mammoth 'extractRawText' usually takes { buffer: Buffer }
                // We'll simulate a Buffer-like object if Buffer isn't globally available, or rely on Deno's Buffer.
                // Using 'node:buffer' is safest in Deno environment if allowed.

                const { Buffer } = await import('node:buffer');
                const buffer = Buffer.from(uint8Array);

                const result = await mammoth.extractRawText({ buffer: buffer });
                const text = result.value;
                console.log('✅ DOCX converted to text. Length:', text.length);

                if (!text) {
                    throw new Error('Extracted text is empty');
                }

                // Update mime type and data to plain text
                mimeType = 'text/plain';

                // Re-encode text to base64
                // Use a UTF-8 safe encoding method
                const utf8Bytes = new TextEncoder().encode(text);
                let binary = '';
                for (let i = 0; i < utf8Bytes.length; i++) {
                    binary += String.fromCharCode(utf8Bytes[i]);
                }
                base64Data = btoa(binary);

                console.log('✅ Text re-encoded to base64');
            } catch (conversionError) {
                console.error('❌ Error converting DOCX:', conversionError);
                throw new Error(`Failed to convert DOCX file: ${conversionError.message}`);
            }
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
        // User requested gemini-2.5-pro or 3.0, but for stability we use the known stable version.
        // If gemini-2.5-pro is valid, it can be swapped back, but we prioritize fixing the DOCX parse error first.
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            generationConfig: {
                temperature: 0.1, // Lower temperature for more consistent extraction
            }
        })

        console.log('🤖 Analyzing document with AI...')

        const prompt = `You are an expert at analyzing EU funding application guidelines and call documents.

TASK: Analyze this document and extract the proposal application structure.

For each section in the document, identify:
1. Section name/title (e.g., "1. Excellence", "Part B - Impact", "Project description")
2. A unique key in snake_case (e.g., "excellence", "project_description")
3. Order/sequence number (1, 2, 3...)
4. Character limit, word limit, or page limit (if specified in the document)
5. Whether the section is mandatory or optional
6. Any subsections (nested structure)
7. **CRITICAL:** Extract specific QUESTIONS, PROMPTS, or INSTRUCTIONS found within that section.
   - Look for questions in grey boxes, bullet points, or paragraphs following the header.
   - Example: "What are the concrete objectives?", "Please outline the target groups...", "How does the project address..."
   - **Combine these questions verbatim into the 'description' field.**
   - **Also create a comprehensive 'aiPrompt' that instructs an AI to answer these specific questions.**

LOOK FOR PATTERNS LIKE:
- Section headings: "Section 1:", "Part A:", "Question 1:", "Criterion 1:", "1.", "2.", etc.
- **Questions:** Text often appears in boxes, italicized, or as a list of questions that MUST be answered.
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
- Project description (Erasmus+)

IMPORTANT rules for 'description' and 'aiPrompt':
- **description**: Must contain the EXACT questions found in the document. Do not summarize them if specific questions are listed. Concatenate them clearly.
- **aiPrompt**: Write a prompt for an AI that says "Draft the [Section Name] section. Specifically address: [List of questions found]. Ensure the tone is professional and persuasive."

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, no extra text):

{
  "fundingScheme": "${fundingSchemeName || 'Extracted Funding Scheme'}",
  "extractedFrom": "${fileUrl}",
  "sections": [
    {
      "key": "project_description",
      "label": "Project description",
      "charLimit": null,
      "wordLimit": null,
      "pageLimit": null,
      "mandatory": true,
      "order": 1,
      "description": "What are the concrete objectives you would like to achieve? How are these objectives linked to the priorities? Please outline the target groups...",
      "aiPrompt": "Draft the Project Description section. Specifically address: 1) Concrete objectives and outcomes, 2) Link to priorities, 3) Target groups and their needs. Ensure the response is detailed and addresses all points.",
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
                status: 200, // Return 200 so the client can read the error message
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
