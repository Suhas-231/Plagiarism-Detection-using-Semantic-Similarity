/*
  # Plagiarism Detection System Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `plagiarism_checks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `source_document_id` (uuid, references documents)
      - `checked_content` (text)
      - `overall_similarity_score` (numeric)
      - `status` (text) - 'processing', 'completed', 'failed'
      - `created_at` (timestamptz)
    
    - `similarity_results`
      - `id` (uuid, primary key)
      - `check_id` (uuid, references plagiarism_checks)
      - `compared_document_id` (uuid, references documents)
      - `similarity_score` (numeric)
      - `matching_segments` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own documents and plagiarism checks
    - Authenticated users can read all documents for comparison purposes
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plagiarism_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  source_document_id uuid REFERENCES documents(id),
  checked_content text NOT NULL,
  overall_similarity_score numeric DEFAULT 0,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS similarity_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid REFERENCES plagiarism_checks(id) NOT NULL,
  compared_document_id uuid REFERENCES documents(id) NOT NULL,
  similarity_score numeric NOT NULL,
  matching_segments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE similarity_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all documents for comparison"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plagiarism checks"
  ON plagiarism_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plagiarism checks"
  ON plagiarism_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plagiarism checks"
  ON plagiarism_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plagiarism checks"
  ON plagiarism_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view similarity results for their checks"
  ON similarity_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plagiarism_checks
      WHERE plagiarism_checks.id = similarity_results.check_id
      AND plagiarism_checks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert similarity results for their checks"
  ON similarity_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plagiarism_checks
      WHERE plagiarism_checks.id = similarity_results.check_id
      AND plagiarism_checks.user_id = auth.uid()
    )
  );

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_plagiarism_checks_user_id ON plagiarism_checks(user_id);
CREATE INDEX idx_similarity_results_check_id ON similarity_results(check_id);