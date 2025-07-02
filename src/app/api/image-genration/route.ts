import { HfInference } from '@huggingface/inference';

const apiKey = process.env.HUGGINGFACE_API_KEY;
if (!apiKey) {
  throw new Error('HUGGINGFACE_API_KEY is not configured in environment variables');
}

const hf = new HfInference(apiKey);

async function blobToBase64(blob: any): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${blob.type || 'image/jpeg'};base64,${base64}`;
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('Starting image generation with prompt:', prompt);
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let response;

    while (attempts < maxAttempts) {
      try {
        response = await hf.textToImage({
          model: "stabilityai/stable-diffusion-xl-base-1.0",
          inputs: prompt,
          parameters: {
            negative_prompt: "blurry, bad quality, distorted, ugly, deformed, pixelated, low resolution, oversaturated",
            num_inference_steps: 50,
            guidance_scale: 7.5,
            width: 512,
            height: 512
          }
        });
        
        if (response) {
          break;
        }
        throw new Error('Empty response from API');
        
      } catch (retryError) {
        attempts++;
        if (attempts === maxAttempts) {
          throw retryError;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    if (!response) {
      throw new Error('No response from image generation API');
    }

    const base64Data = await blobToBase64(response);
    console.log('Successfully generated image');
    return base64Data;

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    if (error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Invalid or expired Hugging Face API key. Please check your credentials.');
    }
    if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.message?.includes('503')) {
      throw new Error('The image generation service is temporarily unavailable. Please try again later.');
    }
    
    throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}`);
  }
}