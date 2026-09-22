export type MemberRole =
  | "master"
  | "full"
  | "engagement_only"
  | "agenda_only"
  | "approval_only";

export type Module = "engajamento" | "agenda" | "ideias" | "admin" | "aprovacao";

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
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
  approval_only: "Somente aprovação de posts",
};

export type PostStatus = "pending" | "approved" | "rejected" | "scheduled" | "published";

export interface ContentPost {
  id: string;
  caption: string | null;
  target_platforms: string[];
  status: PostStatus;
  scheduled_at: string | null;
  buffer_update_ids: string[] | null;
  review_note: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  scheduled_by: string | null;
  created_at: string;
}

export interface ContentPostFile {
  id: string;
  post_id: string;
  storage_path: string;
  provider: "supabase" | "drive";
  file_type: string;
  position: number;
}
