import type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "@/lib/types/database";

declare global {
  type Json = Json;
  type Database = Database;
  type Tables<
    T extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  > = Tables<T>;
  type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    TablesInsert<T>;
  type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    TablesUpdate<T>;
  type Enums<T extends keyof Database["public"]["Enums"]> = Enums<T>;
  type CompositeTypes<
    T extends keyof Database["public"]["CompositeTypes"]
  > = CompositeTypes<T>;
}
