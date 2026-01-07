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
        // Using Gemini 2.5 Pro as requested for maximum extraction precision and handling of high-density documents
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            generationConfig: {
                temperature: 0.0, // Absolute zero for deterministic, factual extraction
            }
        })

        console.log('🤖 Analyzing document with Gemini 2.5 Pro...')

        const prompt = `You are a precision-oriented Document Analysis AI. Your mission is to extract the EXACT structure of an EU funding application form from the provided PDF/document.

### THE GOLD STANDARD FOR EXTRACTION:
1. **LITERAL LABELS:** Extract section names exactly as they are written (e.g., "Work package n°2 -"). Do not correct grammar or capitalize differently.
2. **VERBATIM QUESTIONS:** Within each section, find every question or instruction and copy it LITERALLY. 
   - Look for text in boxes, bulleted prompts, or italicized instructions.
   - Example: If the form says "What are the concrete objectives you would like to achieve?", do not summarize it as "Define objectives." Copy the whole question.
   - Place all these verbatim questions in the "description" field.
3. **ZERO NOISE:**
   - DO NOT extract page numbers ("1 / 20", "Page 5").
   - DO NOT extract form metadata ("Form ID KA220-YOU...", "Deadline (Brussels Time)...").
   - DO NOT extract footer/header repetitions.
4. **HIERARCHY IS KEY:** 
   - Use the "Table of Contents" (usually on page 2 or 3) as your roadmap.
   - Maintain the nested structure (e.g., "Relevance" has subsections "Priorities and Topics", "Project description", etc.).
   - Use the "subsections" array for this.
5. **AI PROMPT GENERATION:** Create a surgical "aiPrompt" for the generation engine. It must say: "Draft the [Label] section. Answer these specific questions verbatim from the guidelines: [List verbatim questions]. Use a professional, technical, and persuasive tone."

### SECTION MAPPING (Surgical Accuracy):
- **Context:** Extract title, start date, duration, agency.
- **Project Summary:** Capture the specific bullet points required (Context, Objectives, Participants, Methodology, Results/Impact).
- **Participating Organisations:** Ensure you capture the "Background and experience" sub-questions for both coordinators and partners.
- **Relevance:** Capture "Priorities and Topics", "創新 (Innovation)", "Complementarity", "EU Added Value", and the "Needs Analysis" prompts.
- **Project Design:** Capture Monitoring, Budget Control, Risk Handling, Digital tools, and Green practices.
- **Work Packages:** Capture specific WP objectives, results, indicators, and task allocations.

Return ONLY a perfectly formatted JSON object.

{
  "fundingScheme": "Exact Name of the Programme/Action",
  "extractedFrom": "${fileUrl}",
  "sections": [
    {
      "key": "unique_snake_case_key",
      "label": "Exact literal label from document",
      "type": "textarea" | "richtext" | "structured",
      "charLimit": number | null,
      "wordLimit": number | null,
      "mandatory": true,
      "order": number,
      "description": "ALL VERBATIM QUESTIONS AND PROMPTS CONCATENATED",
      "aiPrompt": "Draft the [Label] section by answering: [Question 1]? [Question 2]? ...",
      "subsections": [ /* Nested version of this structure */ ]
    }
  ],
  "metadata": {
    "totalCharLimit": number | null,
    "estimatedDuration": "string"
  }
}

Return ONLY the raw JSON object. No explanation.`

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
