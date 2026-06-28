import {
  Factory,
  Truck,
  Wrench,
  Settings,
  Droplets,
  Gauge,
  Package,
  Cog,
  ShieldCheck,
  Building2,
  HardHat,
  Car,
  BatteryCharging,
  MapPinned,
  BadgeCheck,
  Boxes,
  Search,
} from "lucide-react";

export const capabilityCards = [
  {
    icon: Droplets,
    title: "Hydraulic Components",
    items: [
      "Hydraulic Pumps",
      "Control Valves",
      "Hydraulic Cylinders",
      "Seal Kits",
      "Hose Pipes",
      "Fittings & Couplings",
    ],
  },
  {
    icon: Package,
    title: "Heavy Equipment Parts",
    items: [
      "Volvo Parts",
      "Excavator Parts",
      "Loader Parts",
      "Motor Grader Parts",
      "Road Equipment Parts",
      "Construction Machinery",
    ],
  },
  {
    icon: Cog,
    title: "Mechanical Components",
    items: [
      "Bearings",
      "Bushes",
      "Gears",
      "Shafts",
      "Chains",
      "Couplings",
    ],
  },
  {
    icon: Settings,
    title: "Industrial MRO",
    items: [
      "Filters",
      "Lubrication",
      "Maintenance Parts",
      "Workshop Consumables",
      "Industrial Hoses",
      "Pneumatic Components",
    ],
  },
  {
    icon: Boxes,
    title: "OEM & Aftermarket",
    items: [
      "OEM Components",
      "OEM Alternatives",
      "Aftermarket Parts",
      "Imported Parts",
      "Made in India Options",
      "Replacement Components",
    ],
  },
  {
    icon: Search,
    title: "Custom Procurement",
    items: [
      "Part Number Sourcing",
      "Drawing Based Procurement",
      "Sample Matching",
      "Reverse Engineering Support",
      "Bulk Procurement",
      "Project Sourcing",
    ],
  },
];

export const industries = [
  { icon: Factory, title: "Manufacturing" },
  { icon: Building2, title: "Construction" },
  { icon: HardHat, title: "Mining" },
  { icon: Settings, title: "Engineering" },
  { icon: BatteryCharging, title: "Power & Energy" },
  { icon: Car, title: "Automotive" },
  { icon: Truck, title: "Infrastructure" },
  { icon: Wrench, title: "Industrial Maintenance" },
];

export const supportedBrands = {
  "Heavy Equipment": [
    "Volvo",
    "JCB",
    "Caterpillar",
    "Komatsu",
    "Hitachi",
    "Hyundai",
    "Doosan",
    "SANY",
  ],
  Hydraulics: [
    "Bosch Rexroth",
    "Parker",
    "Danfoss",
    "Yuken",
    "Linde",
    "Eaton",
    "Nachi",
    "Vickers",
  ],
  Bearings: [
    "SKF",
    "FAG",
    "NSK",
    "NTN",
    "INA",
    "Timken",
  ],
};

export const supplyRegions = [
  {
    region: "North India",
    cities: [
      "Delhi NCR",
      "Jaipur",
      "Bhiwadi",
      "Neemrana",
      "Gurugram",
      "Faridabad",
      "Ludhiana",
    ],
  },
  {
    region: "West India",
    cities: [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Mumbai",
      "Pune",
      "Nashik",
    ],
  },
  {
    region: "South India",
    cities: [
      "Bengaluru",
      "Chennai",
      "Hyderabad",
      "Coimbatore",
      "Hosur",
    ],
  },
  {
    region: "East India",
    cities: [
      "Kolkata",
      "Jamshedpur",
      "Ranchi",
      "Bhubaneswar",
      "Durgapur",
    ],
  },
  {
    region: "Central India",
    cities: [
      "Indore",
      "Bhopal",
      "Nagpur",
      "Raipur",
    ],
  },
];

export const whyChooseItems = [
  {
    icon: BadgeCheck,
    title: "Verified Supplier Network",
  },
  {
    icon: Truck,
    title: "Pan India Supply Support",
  },
  {
    icon: ShieldCheck,
    title: "OEM & Aftermarket Options",
  },
  {
    icon: Settings,
    title: "Industrial Buyer Assistance",
  },
  {
    icon: MapPinned,
    title: "RFQ Based Procurement",
  },
  {
    icon: Factory,
    title: "Bulk Industrial Sourcing",
  },
];