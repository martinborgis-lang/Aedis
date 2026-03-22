-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE reserve_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE reserve_status AS ENUM ('open', 'in_progress', 'resolved');

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    description TEXT,
    start_date DATE,
    estimated_end_date DATE,
    status project_status DEFAULT 'active',
    portal_token TEXT UNIQUE NOT NULL,
    portal_enabled BOOLEAN DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    budget NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    sort_order INTEGER DEFAULT 0,
    trade TEXT,
    dependencies UUID[] DEFAULT '{}',
    budget NUMERIC,
    lot TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Artisan tokens table
CREATE TABLE artisan_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    artisan_name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Reserves table
CREATE TABLE reserves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    assigned_to TEXT,
    priority reserve_priority DEFAULT 'medium',
    status reserve_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_photo_url TEXT,
    resolution_notes TEXT
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisan_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can CRUD their own projects" ON projects
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view projects via portal token" ON projects
    FOR SELECT USING (portal_enabled = true);

-- RLS Policies for tasks
CREATE POLICY "Users can CRUD tasks for their projects" ON tasks
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view tasks via portal" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE portal_enabled = true
        )
    );

-- RLS Policies for photos
CREATE POLICY "Users can CRUD photos for their projects" ON photos
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view photos via portal" ON photos
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE portal_enabled = true
        )
    );

CREATE POLICY "Anyone can upload photos via portal" ON photos
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE portal_enabled = true
        )
    );

-- RLS Policies for artisan_tokens
CREATE POLICY "Users can CRUD artisan tokens for their projects" ON artisan_tokens
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view artisan tokens by token value" ON artisan_tokens
    FOR SELECT USING (true);

-- Artisan can update tasks via artisan token
CREATE POLICY "Artisan can update tasks via token" ON tasks
    FOR UPDATE USING (
        id IN (
            SELECT task_id FROM artisan_tokens
        )
    );

-- Artisan can upload photos via artisan token
CREATE POLICY "Artisan can upload photos via token" ON photos
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT task_id FROM artisan_tokens
        )
    );

-- RLS Policies for reserves
CREATE POLICY "Users can CRUD reserves for their projects" ON reserves
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view reserves via portal" ON reserves
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE portal_enabled = true
        )
    );

CREATE POLICY "Artisan can update reserves assigned to them" ON reserves
    FOR UPDATE USING (
        assigned_to IN (
            SELECT artisan_name FROM artisan_tokens
            WHERE project_id = reserves.project_id
        )
    );

-- RLS Policies for reports
CREATE POLICY "Users can CRUD reports for their projects" ON reports
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view reports via portal" ON reports
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE portal_enabled = true
        )
    );

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anonymous users can upload photos" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public read access for photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload reports" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Public read access for reports" ON storage.objects
    FOR SELECT USING (bucket_id = 'reports');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set resolved_at when reserve status changes to resolved
CREATE OR REPLACE FUNCTION update_reserve_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = now();
    ELSIF NEW.status != 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reserves_resolved_at
    BEFORE UPDATE ON reserves
    FOR EACH ROW
    EXECUTE FUNCTION update_reserve_resolved_at();

-- Table de log des imports DPGF
CREATE TABLE project_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    original_filename TEXT,
    contractor_name TEXT,
    total_lots INTEGER,
    total_tasks INTEGER,
    total_budget_ht NUMERIC,
    ai_notes TEXT,
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    duration_source TEXT CHECK (duration_source IN ('document_dates', 'ai_estimate')),
    import_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour project_imports
ALTER TABLE project_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects can view own imports" ON project_imports
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Architects can insert imports" ON project_imports
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Table future pour la Phase 2 (benchmarks de durées)
CREATE TABLE lot_duration_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_type TEXT NOT NULL,        -- 'DEMOLITION', 'GROS-OEUVRE', etc.
    budget_min NUMERIC,            -- fourchette budget
    budget_max NUMERIC,
    project_size TEXT,             -- 'small'|'medium'|'large'|'xl'
    duration_days_p25 INTEGER,     -- 1er quartile (estimation basse)
    duration_days_p50 INTEGER,     -- médiane
    duration_days_p75 INTEGER,     -- 3ème quartile (estimation haute)
    sample_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour lot_duration_benchmarks (lecture publique pour l'IA)
ALTER TABLE lot_duration_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read duration benchmarks" ON lot_duration_benchmarks
    FOR SELECT USING (true);

CREATE POLICY "Only system can insert benchmarks" ON lot_duration_benchmarks
    FOR INSERT WITH CHECK (false);  -- Sera alimentée par des scripts système