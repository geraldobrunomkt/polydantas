export type MemberRole = "master" | "full" | "engagement_only" | "agenda_only";

export type Module = "engajamento" | "agenda" | "ideias" | "admin";

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  pin_hash: string | null;
  active: boolean;
  created_at: string;
}

export interface EngagementPost {
  id: string;
  title: string;
  link: string;
  post_date: string;
  created_by: string | null;
  created_at: string;
}

export interface EngagementRosterMember {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface EngagementCheck {
  id: string;
  post_id: string;
  roster_id: string;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
}

export interface AgendaItem {
  id: string;
  item_date: string;
  item_time: string | null;
  location: string | null;
  title: string;
  description: string | null;
  content_idea: string | null;
  created_by: string | null;
  created_at: string;
}

export interface IdeaCard {
  id: string;
  text: string;
  color: string;
  created_by: string | null;
  created_at: string;
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  master: "Master (acesso total + admin)",
  full: "Acesso total",
  engagement_only: "Somente engajamento",
  agenda_only: "Somente agenda",
};
