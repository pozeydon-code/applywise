import type { AnalysisResult } from "./domain";

export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string;
          created_at: string;
          job_role: string | null;
          score: number;
          result_snapshot: AnalysisResult;
        };
        Insert: {
          id?: string;
          created_at?: string;
          job_role?: string | null;
          score: number;
          result_snapshot: AnalysisResult;
        };
        Update: Partial<Database["public"]["Tables"]["analyses"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export type AnalysisRow = Database["public"]["Tables"]["analyses"]["Row"];
