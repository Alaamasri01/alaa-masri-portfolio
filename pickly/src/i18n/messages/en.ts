// English messages. This file defines the message shape; ar.ts must match it.
const en = {
  common: {
    appName: "Pickly",
    tagline: "Smart student pickup",
    signOut: "Sign out",
    switchLanguage: "العربية",
    switchLanguageLabel: "Switch to Arabic",
    loading: "Loading…",
    retry: "Try again",
    back: "Back",
    live: "Live",
    school: "School",
    class: "Class",
  },
  auth: {
    title: "Welcome back",
    subtitle: "Sign in to follow today’s pickups.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    invalidCredentials: "That email and password don’t match. Please try again.",
    genericError: "We couldn’t sign you in right now. Please try again.",
    demoTitle: "Demo accounts",
    demoHint: "Tap an account to fill in its details. Password for all: ",
    heroTitle: "Calm, safe dismissal for every school day.",
    heroBody:
      "Parents request pickup, teachers prepare students, the gate hands them over — everyone sees the same live status.",
  },
  roles: {
    platform_owner: "Platform owner",
    school_admin: "School administrator",
    teacher: "Teacher",
    gate_staff: "Gate staff",
    parent: "Parent",
  },
  workspaces: {
    parent: { title: "My children", description: "Request pickup and follow it live." },
    teacher: { title: "Pickup queue", description: "Students in your classes who are being collected." },
    gate: { title: "Gate", description: "Students ready for handover." },
    admin: { title: "School administration", description: "Students, families, classes, staff and history." },
    platform: { title: "Platform", description: "Schools on Pickly and their status." },
    switchTo: "Switch workspace",
  },
  status: {
    REQUESTED: "Requested",
    ON_THE_WAY: "On the way",
    PREPARING: "Preparing",
    READY: "Ready",
    PARENT_ARRIVED: "Parent arrived",
    COLLECTED: "Collected",
    CANCELLED: "Cancelled",
    none: "At school",
  },
  pickupErrors: {
    PK001: "This student or pickup is no longer available.",
    PK002: "This pickup has already moved on. The screen has been refreshed.",
    PK003: "Your role can’t do this step.",
    PK004: "This student is not active. Please contact the school.",
    generic: "Something went wrong. Please try again.",
  },
  noAccess: {
    title: "No school access yet",
    body: "Your account isn’t linked to an active school. Please contact your school’s administration.",
  },
  comingSoon: {
    title: "Workspace ready",
    body: "Your account, school and permissions are verified. This workspace’s screens arrive in the next milestone.",
    signedInAs: "Signed in as",
  },
  notFound: {
    title: "Page not found",
    body: "The page you’re looking for doesn’t exist.",
    home: "Go home",
  },
};

export default en;

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Messages = DeepString<typeof en>;
