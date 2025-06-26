import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Get OpenAI API key from environment variable
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON body
    const body = await req.json();
    const { file: base64File, text, filename, contentType } = body;

    // Check if we have either file or text
    if (!base64File && !text) {
      return new Response(JSON.stringify({ error: "No file or text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If text is provided, use it directly
    // Otherwise, use the base64 file
    let content;
    if (text) {
      console.log("Processing extracted text");
      content = text;
    } else {
      // Check decoded file size (5MB limit)
      const decodedLength = atob(base64File).length;
      if (decodedLength > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "File size exceeds 5MB limit" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log(`Processing ${contentType} file: ${filename}`);
      content = `Base64 encoded ${contentType} file: ${base64File.substring(0, 100)}...`;
    }

    // Create messages for OpenAI
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that extracts information from invoices and receipts. Extract the following information: company name, amount before tax (HT), amount after tax (TTC), invoice date, and invoice number. Return the information in a structured JSON format with the following keys: companyName, amountHT, amountTTC, invoiceDate, invoiceNumber. Make sure to extract numeric values for amountHT and amountTTC as numbers without currency symbols, and format them as strings that can be parsed as floats."
      },
      {
        role: "user",
        content: `Please extract the key information from this invoice/receipt. I need the company name, amount before tax (HT), amount after tax (TTC), invoice date, and invoice number. Return the data in JSON format with the keys: companyName, amountHT, amountTTC, invoiceDate, invoiceNumber. Make sure the amountHT and amountTTC are numeric values without currency symbols.

Here is the content:
${content}`
      }
    ];

    // Call OpenAI API to extract information using gpt-4-turbo
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the response to extract the JSON
    const responseText = completion.choices[0].message.content || "";
    
    // Try to extract JSON from the response
    let extractedData = {};
    try {
      // Parse the JSON response
      extractedData = JSON.parse(responseText);
      
      // Ensure numeric fields are properly formatted
      if (extractedData.amountHT) {
        // Convert to string and remove any currency symbols or spaces
        const cleanedAmount = String(extractedData.amountHT).replace(/[^\d.,]/g, '').replace(',', '.');
        extractedData.amountHT = parseFloat(cleanedAmount);
      }
      
      if (extractedData.amountTTC) {
        // Convert to string and remove any currency symbols or spaces
        const cleanedAmount = String(extractedData.amountTTC).replace(/[^\d.,]/g, '').replace(',', '.');
        extractedData.amountTTC = parseFloat(cleanedAmount);
      }

      console.log("Successfully extracted data from document:", extractedData);
    } catch (error) {
      console.error("Error parsing JSON from OpenAI response:", error);
      extractedData = { rawText: responseText };
    }

    // Return the extracted data
    return new Response(JSON.stringify({ data: extractedData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error processing document",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});