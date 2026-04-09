export type Frequency = "daily" | "weekly";

export interface Subscriber {
  id: string;
  email: string;
  zones: string[];
  frequency: Frequency;
  isVerified: boolean;
  isActive: boolean;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberRow {
  id: string;
  email: string;
  zones: string[];
  frequency: Frequency;
  is_verified: boolean;
  is_active: boolean;
  verify_token: string | null;
  verify_expires_at: string | null;
  unsubscribe_token: string;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}
