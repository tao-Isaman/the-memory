import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { generateCartoonImage } from '@/lib/openai';
import {
  deductCreditsForCartoon,
  refundCreditsForCartoon,
  saveCartoonGeneration,
} from '@/lib/cartoon';
import { CARTOON_CREDIT_COST } from '@/lib/constants';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const imageFile = formData.get('image') as File;

    if (!userId || !imageFile) {
      return NextResponse.json(
        { error: 'Missing userId or image' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // 1. Deduct credits first (fail fast)
    const deductResult = await deductCreditsForCartoon(supabase, userId);
    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.error, balance: deductResult.newBalance },
        { status: 402 }
      );
    }

    try {
      // 2. Read template image
      const templatePath = join(process.cwd(), 'public', 'template', 'example.png');
      const templateBuffer = readFileSync(templatePath);

      // 3. Convert uploaded file to Buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const userImageBuffer = Buffer.from(arrayBuffer);

      // 4. Generate cartoon image via OpenAI
      const b64Image = await generateCartoonImage(templateBuffer, userImageBuffer);

      // 5. Upload original image to Supabase Storage (cartoon-images bucket)
      const originalFileName = `originals/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
      await supabase.storage
        .from('cartoon-images')
        .upload(originalFileName, userImageBuffer, {
          contentType: imageFile.type || 'image/png',
        });

      const { data: originalUrlData } = supabase.storage
        .from('cartoon-images')
        .getPublicUrl(originalFileName);

      // 6. Upload cartoon result to Supabase Storage
      const cartoonBuffer = Buffer.from(b64Image, 'base64');
      const cartoonFileName = `results/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
      await supabase.storage
        .from('cartoon-images')
        .upload(cartoonFileName, cartoonBuffer, {
          contentType: 'image/png',
        });

      const { data: cartoonUrlData } = supabase.storage
        .from('cartoon-images')
        .getPublicUrl(cartoonFileName);

      // 7. Save generation record
      await saveCartoonGeneration(supabase, {
        userId,
        originalImageUrl: originalUrlData.publicUrl,
        cartoonImageUrl: cartoonUrlData.publicUrl,
        creditsUsed: CARTOON_CREDIT_COST,
        prompt: 'cartoon style transfer with pastel pink background',
        status: 'completed',
      });

      return NextResponse.json({
        success: true,
        cartoonUrl: cartoonUrlData.publicUrl,
        newBalance: deductResult.newBalance,
      });
    } catch (genError) {
      // OpenAI or upload failed — refund credits
      console.error('Cartoon generation failed, refunding credits:', genError);
      await refundCreditsForCartoon(supabase, userId);

      // Save failed record
      await saveCartoonGeneration(supabase, {
        userId,
        originalImageUrl: null,
        cartoonImageUrl: null,
        creditsUsed: CARTOON_CREDIT_COST,
        prompt: 'cartoon style transfer with pastel pink background',
        status: 'failed',
      });

      return NextResponse.json(
        { error: 'สร้างรูปการ์ตูนไม่สำเร็จ เครดิตของคุณถูกคืนแล้ว', refunded: true },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Cartoon generate error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง' },
      { status: 500 }
    );
  }
}
