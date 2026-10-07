import "server-only";

import type { Locale } from "./config";
import type { Messages } from "./messages/en";

const loaders: Record<Locale, () => Promise<Messages>> = {
  ar: () => import("./messages/ar").then((m) => m.default),
  en: () => import("./messages/en").then((m) => m.default),
};

export function getMessages(locale: Locale): Promise<Messages> {
  return loaders[locale]();
}
