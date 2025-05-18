// src/services/aiEnrichmentService.ts
import OpenAI from 'openai';
import { Attribute, Product } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface AttributeValue {
  [key: string]: any;
}

/**
 * Enrich product data using AI
 * @param product The product to enrich
 * @param attributes The attribute definitions
 * @returns Enriched attributes object
 */
export async function enrichProductWithAI(
  product: Product, 
  attributes: Attribute[]
): Promise<AttributeValue> {
  try {
    // Current attributes (might be partially filled)
    const currentAttributes = product.attributes as AttributeValue || {};
    
    // Filter attributes that need enrichment (not already filled AND is_required is true)
    const attributesToEnrich = attributes.filter(attr => 
      attr.isRequired === true && (
        !currentAttributes[attr.name] || 
        (Array.isArray(currentAttributes[attr.name]) && currentAttributes[attr.name].length === 0) ||
        (typeof currentAttributes[attr.name] === 'object' && Object.keys(currentAttributes[attr.name]).length === 0)
      )
    );
    
    if (attributesToEnrich.length === 0) {
      return currentAttributes; // Nothing to enrich
    }
    
    // Determine if we have valid images
    const hasValidImages = product.images && product.images.length > 0 && 
                           product.images.some(img => isValidImageUrl(img));
    
    // Call the AI service with or without images
    let completion;
    if (hasValidImages) {
      // Create message content with images
      const content = await createContentWithImages(product, attributesToEnrich);
      
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use GPT-4o for image analysis
        messages: [
          { 
            role: "system", 
            content: "You are a product data specialist who extracts and infers product attributes from images and basic information. Analyze any provided images carefully to determine product details like color, size, materials, etc. Respond with a valid JSON object containing only the requested attributes."
          },
          { 
            role: "user", 
            content: content
          }
        ],
        response_format: { type: "json_object" }
      });
    } else {
      // Text-only approach (original implementation)
      const prompt = createEnrichmentPrompt(product, attributesToEnrich);
      
      completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { 
            role: "system", 
            content: "You are a product data specialist who extracts and infers product attributes from basic information. Respond with a valid JSON object containing only the requested attributes. Be accurate and realistic in your assessments."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      });
    }
    
    // Parse AI response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new ApiError(500, 'AI service returned empty response');
    }
    
    let enrichedData: AttributeValue;
    try {
      enrichedData = JSON.parse(responseText);
    } catch (error) {
      throw new ApiError(500, 'Failed to parse AI response as JSON');
    }
    
    // Validate and format each attribute based on its type
    const validatedAttributes = validateAndFormatAttributes(enrichedData, attributesToEnrich);
    
    // Merge with existing attributes
    return {
      ...currentAttributes,
      ...validatedAttributes
    };
  } catch (error) {
    console.error('AI enrichment error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    else {
      throw new ApiError(500, `AI enrichment failed: ${(error as Error).message || 'Unknown error'}`);
    }
  }
}

/**
 * Create message content with images for GPT-4o
 */
async function createContentWithImages(product: Product, attributesToEnrich: Attribute[]) {
  // Format text part of the message
  const textPrompt = `
I need to enrich the following product with additional attributes:

Product Name: ${product.name}
Brand: ${product.brand}
Barcode: ${product.barcode || 'Unknown'}

Please analyze the provided product images and extract or infer the following attributes:
${attributesToEnrich.map(attr => {
  let description = `- ${attr.name} (Type: ${attr.type})`;
  if (attr.unit) {
    description += ` with unit: ${attr.unit}`;
  }
  if (attr.options && attr.options.length > 0) {
    description += ` with options: [${attr.options.join(', ')}]`;
  }
  return description;
}).join('\n')}

Respond with a JSON object containing only these attributes. For each attribute, follow these rules:
- For SHORT_TEXT and LONG_TEXT: Provide a string value
- For RICH_TEXT: Provide HTML content as a string
- For NUMBER: Provide a numeric value
- For SINGLE_SELECT: Select one option from the provided list
- For MULTIPLE_SELECT: Select appropriate options from the provided list as an array
- For MEASURE: Provide an object with "value" (number) and "unit" properties

Example response format:
{
  "Item Weight": { "value": 150, "unit": "g" },
  "Ingredients": ["Wheat Flour", "Sugar", "Salt"],
  "Product Description": "<p>This is a premium product...</p>",
  "Storage Requirements": "Dry Storage",
  "Items per Package": 5
}

Carefully analyze the images to determine visual attributes like color, shape, materials, etc.
`;

  // Create content array with text and images
  const contentArray: any[] = [];

  // Add text as ChatCompletionContentPartText
  contentArray.push({
    type: "text",
    text: textPrompt
  });

  // Add valid images as ChatCompletionContentPartImage
  if (product.images && product.images.length > 0) {
    for (const imageUrl of product.images) {
      if (isValidImageUrl(imageUrl)) {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
    }
  }

  return contentArray;
}


/**
 * Helper function to check if a URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;  // For simplicity - in production you might want to check file extensions, etc.
  } catch {
    return false;
  }
}

/**
 * Original text-only prompt function (kept for fallback)
 */
function createEnrichmentPrompt(product: Product, attributesToEnrich: Attribute[]): string {
  // Format product data
  const productInfo = `
Product Name: ${product.name}
Brand: ${product.brand}
Barcode: ${product.barcode || 'Unknown'}
`;
  
  // Format attributes to be enriched
  const attributesInfo = attributesToEnrich.map(attr => {
    let description = `- ${attr.name} (Type: ${attr.type})`;
    
    if (attr.unit) {
      description += ` with unit: ${attr.unit}`;
    }
    
    if (attr.options && attr.options.length > 0) {
      description += ` with options: [${attr.options.join(', ')}]`;
    }
    
    return description;
  }).join('\n');
  
  // Create the full prompt
  return `
I need to enrich the following product with additional attributes:

${productInfo}

Please extract or infer the following attributes:
${attributesInfo}

Respond with a JSON object containing only these attributes. For each attribute, follow these rules:
- For SHORT_TEXT and LONG_TEXT: Provide a string value
- For RICH_TEXT: Provide HTML content as a string
- For NUMBER: Provide a numeric value
- For SINGLE_SELECT: Select one option from the provided list
- For MULTIPLE_SELECT: Select appropriate options from the provided list as an array
- For MEASURE: Provide an object with "value" (number) and "unit" properties

Example response format:
{
  "Item Weight": { "value": 150, "unit": "g" },
  "Ingredients": ["Wheat Flour", "Sugar", "Salt"],
  "Product Description": "<p>This is a premium product...</p>",
  "Storage Requirements": "Dry Storage",
  "Items per Package": 5
}

Be realistic and accurate based on the product information provided. If you're absolutely uncertain about an attribute, use null.
`;
}

/**
 * Validate and format attributes based on their type
 */
function validateAndFormatAttributes(
  enrichedData: AttributeValue, 
  attributesToEnrich: Attribute[]
): AttributeValue {
  const validatedAttributes: AttributeValue = {};
  
  attributesToEnrich.forEach(attr => {
    const value = enrichedData[attr.name];
    
    // Skip if value is null or undefined
    if (value === null || value === undefined) {
      return;
    }
    
    try {
      switch (attr.type) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT':
          if (typeof value === 'string') {
            validatedAttributes[attr.name] = value;
          }
          break;
          
        case 'RICH_TEXT':
          if (typeof value === 'string') {
            // Simple HTML validation could be added here
            validatedAttributes[attr.name] = value;
          }
          break;
          
        case 'NUMBER':
          if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
            validatedAttributes[attr.name] = Number(value);
          }
          break;
          
        case 'SINGLE_SELECT':
          if (typeof value === 'string' && attr.options?.includes(value)) {
            validatedAttributes[attr.name] = value;
          }
          break;
          
        case 'MULTIPLE_SELECT':
          if (Array.isArray(value) && value.every(item => typeof item === 'string' && attr.options?.includes(item))) {
            validatedAttributes[attr.name] = value;
          }
          break;
          
        case 'MEASURE':
          if (
            typeof value === 'object' && 
            value !== null &&
            'value' in value && 
            'unit' in value &&
            typeof value.unit === 'string' &&
            (typeof value.value === 'number' || (typeof value.value === 'string' && !isNaN(Number(value.value))))
          ) {
            validatedAttributes[attr.name] = {
              value: Number(value.value),
              unit: value.unit
            };
          }
          break;
      }
    } catch (error) {
      console.warn(`Failed to validate attribute ${attr.name}:`, error);
      // Skip the attribute if validation fails
    }
  });
  
  return validatedAttributes;
}