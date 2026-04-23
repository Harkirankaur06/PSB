const ROUTE_MAP = {
  dashboard: "/dashboard",
  portfolio: "/portfolio",
  invest: "/invest",
  goals: "/goals",
  insights: "/insights",
  actions: "/actions",
  security: "/security",
  contacts: "/contacts",
  settings: "/settings",
  twin: "/twin",
  banks: "/banks",
  protection: "/protection",
};

const ROUTE_KEYWORDS = {
  dashboard: ["dashboard", "dashboard page", "dashboard tab", "home page", "overview page"],
  portfolio: ["portfolio", "portfolio page", "portfolio tab", "holdings page"],
  invest: ["invest page", "invest tab", "investment tab", "sip page"],
  goals: ["goals page", "goals tab", "goal page", "planning page"],
  insights: ["insights", "ai insights", "insights page", "insights tab"],
  actions: ["actions", "action center", "actions page", "actions tab"],
  security: ["security", "security page", "security tab", "alerts page", "fraud page"],
  contacts: ["trusted contacts", "contacts page", "contacts tab", "contact page"],
  settings: ["settings", "settings page", "settings tab"],
  twin: ["twin", "securewealth twin", "twin page", "simulation page"],
  banks: ["bank connections", "banks page", "banks tab", "bank page"],
  protection: ["protection", "protection page", "protection tab", "freeze account page"],
};

const NAVIGATION_PHRASES = [
  "go to",
  "take me to",
  "open",
  "navigate to",
  "show me the",
  "which tab",
  "which page",
  "where do i",
  "where can i",
  "help me find",
];

function detectRouteTarget(message) {
  const lower = message.toLowerCase();

  for (const [key, keywords] of Object.entries(ROUTE_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return {
        routeKey: key,
        path: ROUTE_MAP[key],
      };
    }
  }

  return null;
}

function classifyIntent(message) {
  const lower = message.toLowerCase();
  const routeTarget = detectRouteTarget(lower);
  const isNavigation =
    NAVIGATION_PHRASES.some((phrase) => lower.includes(phrase)) && Boolean(routeTarget);

  if (isNavigation) {
    return { intent: "NAVIGATE", routeTarget };
  }

  if (
    lower.includes("risk") ||
    lower.includes("fraud") ||
    lower.includes("alert") ||
    lower.includes("duress")
  ) {
    return { intent: "RISK_ALERT", routeTarget };
  }

  if (
    lower.includes("freeze") ||
    lower.includes("transfer") ||
    lower.includes("add contact") ||
    lower.includes("connect bank") ||
    lower.includes("set up otp")
  ) {
    return { intent: "ACTION", routeTarget };
  }

  return { intent: "FINANCIAL_QUERY", routeTarget };
}

module.exports = {
  ROUTE_MAP,
  ROUTE_KEYWORDS,
  detectRouteTarget,
  classifyIntent,
};
