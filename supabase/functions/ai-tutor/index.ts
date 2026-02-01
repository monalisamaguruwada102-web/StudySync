import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt } = await req.json()

        // Mock Response for now (You would replace this with a real OpenAI/Gemini call)
        // const apiKey = Deno.env.get('OPENAI_API_KEY')
        // const result = await fetch(...)

        const aiResponse = `[AI TUTOR]: You asked about "${prompt}". This is a mock response from your Edge Function. Connect an API Key to make me real!`;

        const data = {
            message: aiResponse,
            timestamp: new Date().toISOString()
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
