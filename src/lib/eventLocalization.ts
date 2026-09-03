// @ts-nocheck
export function getLocalizedEventText(event, field, locale) {
  if (locale === "en") {
    const enValue = event[field + "En"];
    if (enValue && String(enValue).trim().length > 0) {
      return enValue;
    }
  }
  return event[field] || "";
}
