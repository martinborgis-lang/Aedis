-- Migration SQL pour la feature Import DPGF
-- À exécuter après le schema de base

-- 1. MODIFICATIONS DES TABLES EXISTANTES

-- Ajouter la colonne budget à la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC;

-- Ajouter les colonnes budget et lot à la table tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lot TEXT;

-- 2. NOUVELLES TABLES

-- Table de log des imports DPGF
CREATE TABLE IF NOT EXISTS project_imports (
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

-- Table future pour la Phase 2 (benchmarks de durées)
CREATE TABLE IF NOT EXISTS lot_duration_benchmarks (
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

-- 3. ROW LEVEL SECURITY (RLS)

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

-- RLS pour lot_duration_benchmarks (lecture publique pour l'IA)
ALTER TABLE lot_duration_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read duration benchmarks" ON lot_duration_benchmarks
    FOR SELECT USING (true);

CREATE POLICY "Only system can insert benchmarks" ON lot_duration_benchmarks
    FOR INSERT WITH CHECK (false);  -- Sera alimentée par des scripts système

-- 4. COMMENTAIRES POUR DOCUMENTATION

COMMENT ON TABLE project_imports IS 'Log des imports de DPGF via IA pour tracking et amélioration';
COMMENT ON COLUMN project_imports.confidence IS 'Niveau de confiance de l''analyse IA: high, medium, low';
COMMENT ON COLUMN project_imports.duration_source IS 'Source des durées: document_dates (extraites du PDF) ou ai_estimate';

COMMENT ON TABLE lot_duration_benchmarks IS 'Benchmarks de durées pour Phase 2 - alimentée automatiquement par les vrais projets';
COMMENT ON COLUMN lot_duration_benchmarks.duration_days_p25 IS '1er quartile (estimation basse) en jours ouvrés';
COMMENT ON COLUMN lot_duration_benchmarks.duration_days_p50 IS 'Médiane (estimation standard) en jours ouvrés';
COMMENT ON COLUMN lot_duration_benchmarks.duration_days_p75 IS '3ème quartile (estimation haute) en jours ouvrés';

COMMENT ON COLUMN projects.budget IS 'Budget total HT du projet en euros';
COMMENT ON COLUMN tasks.budget IS 'Budget HT de la tâche en euros';
COMMENT ON COLUMN tasks.lot IS 'Numéro de lot (ex: "01", "03", "14") pour regroupement';

-- 5. INDEX POUR PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_project_imports_project_id ON project_imports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_imports_created_at ON project_imports(created_at);
CREATE INDEX IF NOT EXISTS idx_lot_benchmarks_lot_type ON lot_duration_benchmarks(lot_type);
CREATE INDEX IF NOT EXISTS idx_tasks_lot ON tasks(lot);
CREATE INDEX IF NOT EXISTS idx_tasks_budget ON tasks(budget);

-- 6. VÉRIFICATION DE LA MIGRATION

-- Afficher le résumé des nouvelles tables
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION IMPORT DPGF TERMINÉE ===';
    RAISE NOTICE 'Nouvelles tables créées:';
    RAISE NOTICE '- project_imports (log des imports)';
    RAISE NOTICE '- lot_duration_benchmarks (phase 2)';
    RAISE NOTICE '';
    RAISE NOTICE 'Colonnes ajoutées:';
    RAISE NOTICE '- projects.budget (NUMERIC)';
    RAISE NOTICE '- tasks.budget (NUMERIC)';
    RAISE NOTICE '- tasks.lot (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE 'Prêt pour tester l''import DPGF!';
END $$;