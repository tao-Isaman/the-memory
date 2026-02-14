import OpenAI from 'openai';
import { toFile } from 'openai';

export async function generateCartoonImage(
  templateBuffer: Buffer,
  userImageBuffer: Buffer
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const openai = new OpenAI({ apiKey });

  const templateFile = await toFile(templateBuffer, 'template.png', {
    type: 'image/png',
  });
  const userFile = await toFile(userImageBuffer, 'photo.png', {
    type: 'image/png',
  });

  const response = await openai.images.edit({
    model: 'gpt-image-1.5',
    image: [templateFile, userFile],
    prompt:
      'Use style of first image apply to second image, Change the background to a soft pastel pink color.',
    size: '1024x1024',
    quality: 'medium',
  });

  const imageData = response.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error('No image data returned from OpenAI');
  }

  return imageData;
}
