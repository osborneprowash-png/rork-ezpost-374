export const DEFAULT_SERVICE_TYPES: string[] = [
  "House Washing",
  "Roof Cleaning",
  "Concrete Cleaning",
  "Concrete Sealing",
  "Driveway Cleaning",
  "Deck Cleaning",
  "Fence Cleaning",
  "Window Cleaning",
  "Gutter Cleaning",
  "Fleet Washing",
  "Building Washing",
  "Other",
];

export const TRADE_PRESETS: { id: string; label: string; services: string[] }[] = [
  {
    id: "pressure-washing",
    label: "Pressure / Soft Washing",
    services: DEFAULT_SERVICE_TYPES,
  },
  {
    id: "painting",
    label: "Painting",
    services: [
      "Interior Painting",
      "Exterior Painting",
      "Cabinet Refinishing",
      "Deck Staining",
      "Commercial Painting",
      "Other",
    ],
  },
  {
    id: "landscaping",
    label: "Landscaping / Lawn",
    services: [
      "Lawn Mowing",
      "Hedge Trimming",
      "Mulching",
      "Sod Install",
      "Landscape Design",
      "Leaf Removal",
      "Other",
    ],
  },
  {
    id: "roofing",
    label: "Roofing",
    services: ["Roof Replacement", "Roof Repair", "Gutter Install", "Roof Inspection", "Other"],
  },
  {
    id: "concrete",
    label: "Concrete",
    services: ["Driveway Pour", "Patio Install", "Concrete Repair", "Sealing", "Stamped Concrete", "Other"],
  },
  {
    id: "hvac",
    label: "HVAC",
    services: ["AC Install", "AC Repair", "Furnace Service", "Duct Cleaning", "Tune-Up", "Other"],
  },
  {
    id: "general",
    label: "General Contractor",
    services: ["Remodel", "Repair", "Install", "Inspection", "Other"],
  },
];
