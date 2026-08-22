import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDatabase() {
  console.log('Connecting to Supabase project:', url);
  const supabase = createClient(url, anonKey);
  const adminClient = serviceKey ? createClient(url, serviceKey) : null;

  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('⚠️ profiles table check with anon key:', error.message);
    } else {
      console.log('✅ profiles table exists and is accessible!');
    }
  } catch (err: unknown) {
    console.error('Error checking profiles table:', err);
  }

  if (adminClient) {
    try {
      const { data, error } = await adminClient.from('profiles').select('*').limit(1);
      if (error) {
        console.log('⚠️ profiles table check with service key:', error.message);
      } else {
        console.log('✅ Service key connected! Rows in profiles:', data?.length);
      }
    } catch (err: unknown) {
      console.error('Error with service key:', err);
    }
  }
}

checkDatabase();
