import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { ensureSupabaseStorageBucket, getSupabaseStorageClient, STORAGE_BUCKET } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    authenticateUser(request.headers);

    const formData = await request.formData();
    const file = formData.get('thumbnail');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    await ensureSupabaseStorageBucket();
    const client = getSupabaseStorageClient();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error } = await client.storage.from(STORAGE_BUCKET).upload(fileName, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) || 401 });
    }

    console.error('Thumbnail upload route error:', error);
    return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
  }
}
