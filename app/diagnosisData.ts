export const DIAGNOSIS_DATA: Record<string, any> = {
  engine_icon: {
    title: "Engine Issue Light",
    importance: "High",
    explanation:
      "This is supposed to be a engine failure issue and this may happened because of Emission Control Issues, Ignition System Faults, Fuel System Problems, Engine Mechanical Issues or Transmission-Related issues.",
    solution:
      "Tighten or Replace the Gas Cap. If the issue persists, visit a repair center immediately.",
  },
  battery_icon: {
    title: "Battery Alert",
    importance: "Critical",
    explanation:
      "Your car’s charging system is malfunctioning. The car is running on battery power alone and may stall soon.",
    solution:
      "Turn off non-essential electronics and pull over safely immediately. Call for help.",
  },
  oil_pressure_icon: {
    title: "Low Oil Pressure",
    importance: "Critical",
    explanation:
      "Loss of oil pressure. Driving significantly damages the engine.",
    solution: "STOP IMMEDIATELY. Check oil levels. Do not drive until fixed.",
  },
  parking_brake_icon: {
    title: "Brake System",
    importance: "High",
    explanation: "Your parking brake is on or brake fluid is low.",
    solution: "Check handbrake release and brake fluid levels.",
  },
  power_steering_icon: {
    title: "Power Steering",
    importance: "Medium",
    explanation: "Power steering assist failure. Steering will be heavy.",
    solution: "Visit a mechanic. The car is safe to drive but requires effort.",
  },
  default: {
    title: "Unknown Icon",
    importance: "Low",
    explanation:
      "We detected an issue but could not identify the specific icon.",
    solution: "Please consult your manual or rescan clearly.",
  },
};
