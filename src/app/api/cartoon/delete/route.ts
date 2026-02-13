import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { generationId, userId } = await request.json();

    if (!generationId || !userId) {
      return NextResponse.json(
        { error: 'Missing generationId or userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify ownership before deleting
    const { data: gen, error: fetchError } = await supabase
      .from('cartoon_generations')
      .select('id, user_id, original_image_url, cartoon_image_url')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !gen) {
      return NextResponse.json(
        { error: 'ไม่พบรูปภาพ' },
        { status: 404 }
      );
    }

    // Delete files from storage
    const filesToDelete: string[] = [];
    for (const url of [gen.original_image_url, gen.cartoon_image_url]) {
      if (url) {
        // Extract path after bucket name: .../cartoon-images/originals/xxx → originals/xxx
        const match = url.match(/cartoon-images\/(.+)$/);
        if (match) filesToDelete.push(match[1]);
      }
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from('cartoon-images').remove(filesToDelete);
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from('cartoon_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting cartoon generation:', deleteError);
      return NextResponse.json(
        { error: 'ลบรูปไม่สำเร็จ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cartoon delete error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
