function buildNavigationGuide(routeTarget) {
  if (!routeTarget) {
    return [];
  }

  const guides = {
    "/invest": [
      "Open the Invest page from the sidebar.",
      "Review the available investment options and suggested actions.",
      "Choose an investment flow or SIP option that matches your plan.",
    ],
    "/contacts": [
      "Open Trusted Contacts from the sidebar.",
      "Click Add Contact.",
      "Enter the contact details and save the new trusted contact.",
    ],
    "/security": [
      "Open Security Timeline from the sidebar.",
      "Review recent alerts, verification status, and risk events.",
      "Open Settings if you need to adjust PIN, OTP, or private protection.",
    ],
    "/banks": [
      "Open Bank Connections from the sidebar.",
      "Choose one of the available dummy banks.",
      "Click Connect to sync that bank into your account data.",
    ],
  };

  return guides[routeTarget.path] || [`Open ${routeTarget.path} from the sidebar to continue.`];
}

function buildActionsForIntent(intent, routeTarget) {
  const actions = [];

  if (routeTarget) {
    actions.push({
      type: "NAVIGATE",
      target: routeTarget.path,
      label: "Open suggested page",
      requiresConfirmation: false,
    });
  }

  if (intent === "ACTION" && routeTarget?.path === "/protection") {
    actions.push({
      type: "SUGGEST",
      target: "freeze_account",
      label: "Review Freeze Option",
      requiresConfirmation: true,
    });
  }

  return actions;
}

module.exports = {
  buildNavigationGuide,
  buildActionsForIntent,
};
