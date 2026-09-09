import type { Plan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: {
    photos: 20,
    videos: 0,
    music: 0,
    privatePrivacy: false,
    featuredEligible: false,
  },
  PREMIUM: {
    photos: 500,
    videos: 20,
    music: 10,
    privatePrivacy: true,
    featuredEligible: true,
  },
  LIFETIME: {
    photos: 2000,
    videos: 50,
    music: 25,
    privatePrivacy: true,
    featuredEligible: true,
  },
} as const satisfies Record<
  Plan,
  {
    photos: number;
    videos: number;
    music: number;
    privatePrivacy: boolean;
    featuredEligible: boolean;
  }
>;

export const THEMES = [
  { id: "serene", label: "Serene Mist", accent: "#4a6b5c" },
  { id: "dusk", label: "Quiet Dusk", accent: "#3d4f66" },
  { id: "warmth", label: "Soft Warmth", accent: "#6b5344" },
  { id: "garden", label: "Memorial Garden", accent: "#3f5d4a" },
] as const;

export function displayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}
