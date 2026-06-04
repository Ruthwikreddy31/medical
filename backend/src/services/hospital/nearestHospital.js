export function nearestHospital(location) {
  return [
    {
      name: "Nearest emergency department",
      location,
      type: "Emergency",
      instruction: "Use local emergency services for severe symptoms."
    },
    {
      name: "Primary care clinic",
      location,
      type: "Clinic",
      instruction: "Schedule a consultation for moderate or persistent symptoms."
    }
  ];
}
