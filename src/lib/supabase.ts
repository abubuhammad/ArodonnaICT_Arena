import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export const STORAGE_BUCKET = 'lms-course-uploads';

let storageBucketReady: Promise<void> | null = null;

export function getSupabaseStorageClient() {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured');
  }

  return supabase;
}

export async function ensureSupabaseStorageBucket() {
  const client = getSupabaseStorageClient();

  if (!storageBucketReady) {
    storageBucketReady = (async () => {
      const { data: buckets, error: listError } = await client.storage.listBuckets();

      if (listError) {
        throw listError;
      }

      if (!buckets.some((bucket) => bucket.name === STORAGE_BUCKET)) {
        const { error: createError } = await client.storage.createBucket(STORAGE_BUCKET, {
          public: true,
        });

        if (createError && createError.statusCode !== '409') {
          throw createError;
        }
      }
    })().catch((error) => {
      storageBucketReady = null;
      throw error;
    });
  }

  await storageBucketReady;
}
