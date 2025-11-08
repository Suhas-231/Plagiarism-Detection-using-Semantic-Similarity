import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Document = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
};

export type PlagiarismCheck = {
  id: string;
  user_id: string;
  source_document_id?: string;
  checked_content: string;
  overall_similarity_score: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
};

export type SimilarityResult = {
  id: string;
  check_id: string;
  compared_document_id: string;
  similarity_score: number;
  matching_segments: any[];
  created_at: string;
};
