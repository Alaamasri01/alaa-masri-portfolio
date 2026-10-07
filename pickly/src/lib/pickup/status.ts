import type { Enums } from "@/lib/supabase/database.types";

export type PickupStatus = Enums<"pickup_status">;
export type ActorRole = Enums<"actor_role">;

export const PICKUP_STATUSES: readonly PickupStatus[] = [
  "REQUESTED",
  "ON_THE_WAY",
  "PREPARING",
  "READY",
  "PARENT_ARRIVED",
  "COLLECTED",
  "CANCELLED",
];

export const TERMINAL_STATUSES: readonly PickupStatus[] = ["COLLECTED", "CANCELLED"];

export function isOpenStatus(status: PickupStatus) {
  return !TERMINAL_STATUSES.includes(status);
}

/** The main journey shown on the parent's live timeline. */
export const JOURNEY: readonly PickupStatus[] = ["REQUESTED", "PREPARING", "READY", "PARENT_ARRIVED", "COLLECTED"];

/**
 * UI mirror of private.pickup_transition_roles() in the database. Used only to
 * decide which buttons to show; the database function is the authority and
 * rejects anything not allowed (PK002 / PK003).
 */
const TRANSITIONS: Record<PickupStatus, Partial<Record<PickupStatus, readonly ActorRole[]>>> = {
  REQUESTED: {
    ON_THE_WAY: ["parent", "school_admin"],
    PREPARING: ["teacher", "school_admin"],
    READY: ["teacher", "school_admin"],
    CANCELLED: ["parent", "school_admin"],
  },
  ON_THE_WAY: {
    PREPARING: ["teacher", "school_admin"],
    READY: ["teacher", "school_admin"],
    CANCELLED: ["parent", "school_admin"],
  },
  PREPARING: { READY: ["teacher", "school_admin"], CANCELLED: ["school_admin"] },
  READY: { PARENT_ARRIVED: ["gate_staff", "parent", "school_admin"], CANCELLED: ["school_admin"] },
  PARENT_ARRIVED: { COLLECTED: ["gate_staff", "school_admin"], CANCELLED: ["school_admin"] },
  COLLECTED: {},
  CANCELLED: {},
};

export function canTransition(from: PickupStatus, to: PickupStatus, role: ActorRole) {
  return TRANSITIONS[from][to]?.includes(role) ?? false;
}

/** Visual tone per status — maps to the --color-status-* design tokens. */
export const STATUS_TONE: Record<PickupStatus, { text: string; soft: string; ring: string; solid: string }> = {
  REQUESTED: {
    text: "text-status-requested",
    soft: "bg-status-requested-soft",
    ring: "ring-status-requested-ring",
    solid: "bg-status-requested",
  },
  ON_THE_WAY: {
    text: "text-status-on-the-way",
    soft: "bg-status-on-the-way-soft",
    ring: "ring-status-on-the-way-ring",
    solid: "bg-status-on-the-way",
  },
  PREPARING: {
    text: "text-status-preparing",
    soft: "bg-status-preparing-soft",
    ring: "ring-status-preparing-ring",
    solid: "bg-status-preparing",
  },
  READY: {
    text: "text-status-ready",
    soft: "bg-status-ready-soft",
    ring: "ring-status-ready-ring",
    solid: "bg-status-ready",
  },
  PARENT_ARRIVED: {
    text: "text-status-arrived",
    soft: "bg-status-arrived-soft",
    ring: "ring-status-arrived-ring",
    solid: "bg-status-arrived",
  },
  COLLECTED: {
    text: "text-status-collected",
    soft: "bg-status-collected-soft",
    ring: "ring-status-collected-ring",
    solid: "bg-status-collected",
  },
  CANCELLED: {
    text: "text-status-cancelled",
    soft: "bg-status-cancelled-soft",
    ring: "ring-status-cancelled-ring",
    solid: "bg-status-cancelled",
  },
};

/** Maps a database error code from the workflow functions to a message key. */
export function pickupErrorKey(code: string | undefined): "PK001" | "PK002" | "PK003" | "PK004" | "generic" {
  return code === "PK001" || code === "PK002" || code === "PK003" || code === "PK004" ? code : "generic";
}
