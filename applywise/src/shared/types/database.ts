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
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          job_role?: string | null;
          score: number;
          result_snapshot: AnalysisResult;
          user_id?: string | null;
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
