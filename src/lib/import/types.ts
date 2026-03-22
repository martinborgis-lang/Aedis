export interface ImportTask {
  name: string
  duration_days: number
  budget_ht: number
  description: string
}

export interface ImportLot {
  number: string
  name: string
  budget_ht: number
  tva_rate: number
  duration_days: number
  duration_source: 'document_dates' | 'ai_estimate'
  contractor_name: string | null
  depends_on: string[]
  can_overlap_with: string[]
  tasks: ImportTask[]
  calculated_start?: string
  calculated_end?: string
}

export interface ImportProject {
  name: string
  address: string | null
  client_name: string | null
  contractor_name: string
  total_budget_ht: number
  total_budget_ttc: number
  document_date: string | null
  duration_source: 'document_dates' | 'ai_estimate'
  confidence: 'high' | 'medium' | 'low'
}

export interface ImportResponse {
  project: ImportProject
  lots: ImportLot[]
  ai_notes: string
}

export interface CreateProjectData {
  projectData: {
    name: string
    address: string | null
    client_name: string | null
    contractor_name: string
    total_budget_ht: number
    start_date: string
  }
  lots: Array<ImportLot & {
    calculated_start: string
    calculated_end: string
  }>
  importMeta: {
    original_filename: string
    contractor_name: string
    total_budget_ht: number
    ai_notes: string
    confidence: string
    duration_source: string
  }
}

export interface DateRange {
  start: Date
  end: Date
}

export interface LotDateCalculation {
  lotNumber: string
  start: Date
  end: Date
  dependencies: string[]
}