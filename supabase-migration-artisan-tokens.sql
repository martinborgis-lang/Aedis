-- Migration: Add artisan tokens for per-task artisan portal links
-- Run this AFTER the initial supabase-schema.sql has been applied

-- Artisan tokens table
CREATE TABLE artisan_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    artisan_name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE artisan_tokens ENABLE ROW LEVEL SECURITY;

-- Architect (project owner) can CRUD artisan tokens
CREATE POLICY "Users can CRUD artisan tokens for their projects" ON artisan_tokens
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Anyone with a valid token can look up artisan_tokens (needed for /artisan/[token] route)
CREATE POLICY "Anyone can view artisan tokens by token value" ON artisan_tokens
    FOR SELECT USING (true);

-- Artisan can update tasks linked to an artisan token (mark as done)
CREATE POLICY "Artisan can update tasks via token" ON tasks
    FOR UPDATE USING (
        id IN (
            SELECT task_id FROM artisan_tokens
        )
    );

-- Artisan can upload photos for tasks linked to an artisan token
CREATE POLICY "Artisan can upload photos via token" ON photos
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT task_id FROM artisan_tokens
        )
    );
