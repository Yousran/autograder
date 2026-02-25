// Augment next-intl's IntlMessages interface so useTranslations() and
// getTranslations() are fully type-safe against the actual message shape.
import en from "./messages/en.json";

type Messages = typeof en;

declare global {
  type IntlMessages = Messages;
}
