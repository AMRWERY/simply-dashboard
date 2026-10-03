export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; avatar_url: string | null; updated_at: string };
        Insert: { id: string; avatar_url?: string | null; updated_at?: string };
        Update: {
          id?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
