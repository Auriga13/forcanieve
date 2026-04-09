export type ConditionBadge = "good" | "caution" | "not_recommended";
export type ActivityType = "ski_touring" | "mountaineering" | "both";

export interface Route {
  id: string;
  zoneId: string;
  name: string;
  difficulty: string;
  activityType: ActivityType;
  altitudeMin: number;
  altitudeMax: number;
  altitudeGain: number | null;
  description: string;
  coordinates: [number, number] | null;
  aspects: string[];
  season: string[];
  isActive: boolean;
}

export interface RouteWithCondition extends Route {
  conditionBadge: ConditionBadge;
  conditionReason: string;
}

export interface RouteRow {
  id: string;
  zone_id: string;
  name: string;
  difficulty: string;
  activity_type: ActivityType;
  altitude_min: number;
  altitude_max: number;
  altitude_gain: number | null;
  description: string;
  coordinates: [number, number] | null;
  aspects: string[];
  season: string[];
  is_active: boolean;
  created_at: string;
}
