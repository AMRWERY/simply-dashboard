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
      customers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string;
          link: string | null;
          city: string | null;
          image_url: string | null;
          status: "active" | "new" | "follow-up";
          amount_due: number;
          amount_paid: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          phone: string;
          link?: string | null;
          city?: string | null;
          image_url?: string | null;
          status?: "active" | "new" | "follow-up";
          amount_due?: number;
          amount_paid?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          phone?: string;
          link?: string | null;
          city?: string | null;
          image_url?: string | null;
          status?: "active" | "new" | "follow-up";
          amount_due?: number;
          amount_paid?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_payments: {
        Row: {
          id: string;
          customer_id: string;
          owner_id: string;
          amount: number;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          owner_id: string;
          amount: number;
          paid_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          owner_id?: string;
          amount?: number;
          paid_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_schedules: {
        Row: {
          id: string;
          customer_id: string;
          owner_id: string;
          scheduled_at: string;
          done: boolean;
          done_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          owner_id?: string;
          scheduled_at: string;
          done?: boolean;
          done_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          owner_id?: string;
          scheduled_at?: string;
          done?: boolean;
          done_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_schedules_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
