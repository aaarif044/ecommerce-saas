import { createRng, pickMany, pickOne } from "@/lib/utils";
import type { Address, Customer, Merchant, StaffMember } from "@/lib/types";
import { daysAgo, monthsAgo } from "./catalog";

const FIRST_NAMES = [
  "Aditi", "Rohan", "Meera", "Kabir", "Ishita", "Vikram", "Nandini", "Arjun",
  "Priya", "Devika", "Siddharth", "Tara", "Nikhil", "Anaya", "Rhea", "Manav",
  "Sana", "Varun", "Kavya", "Ayaan", "Diya", "Farhan", "Ira", "Yash",
  "Neha", "Kunal", "Sonia", "Aman", "Ritu", "Harsh", "Lena", "Zoya",
  "Naveen", "Maya", "Ishaan", "Pooja", "Samar", "Aisha", "Vedant", "Rhea",
  "Kiran", "Simran", "Nikhil", "Tarun", "Juhi", "Gaurav", "Richa", "Om",
  "Sanjana", "Abhay", "Charvi", "Vishal", "Mrinali", "Aditya", "Bhavna", "Rishi",
  "Palak", "Siddharth", "Anusha", "Tejas", "Kavya", "Nikhil", "Ratan",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Nair", "Iyer", "Bose", "Kulkarni", "Chatterjee", "Menon",
  "Reddy", "Kapoor", "Banerjee", "Pillai", "Ghosh", "Desai", "Rao", "Joshi",
  "Malhotra", "Bhatt", "Saxena", "Chauhan", "Pandey", "Sinha", "Gupta", "Mehta",
  "Agarwal", "Khanna", "Bhat", "Shetty", "Rathore", "Dutta", "Pillai", "Kaur",
];

const CITIES: { city: string; state: string; postal: string; country: string; code: string }[] = [
  { city: "Bengaluru", state: "Karnataka", postal: "560001", country: "India", code: "IN" },
  { city: "Pune", state: "Maharashtra", postal: "411001", country: "India", code: "IN" },
  { city: "Chennai", state: "Tamil Nadu", postal: "600001", country: "India", code: "IN" },
  { city: "Hyderabad", state: "Telangana", postal: "500001", country: "India", code: "IN" },
  { city: "Delhi", state: "Delhi", postal: "110001", country: "India", code: "IN" },
  { city: "Mumbai", state: "Maharashtra", postal: "400001", country: "India", code: "IN" },
  { city: "Kolkata", state: "West Bengal", postal: "700001", country: "India", code: "IN" },
  { city: "Ahmedabad", state: "Gujarat", postal: "380001", country: "India", code: "IN" },
  { city: "Kochi", state: "Kerala", postal: "682001", country: "India", code: "IN" },
  { city: "Jaipur", state: "Rajasthan", postal: "302001", country: "India", code: "IN" },
];

const STREETS = [
  "12B Camellia Lane", "4 Cypress Court", "221 Harbour Road", "7B Palm Grove",
  "58 Lavender Street", "3 Willow Apartments", "19 Harbour View", "42 Cedar Walk",
  "9 Magnolia Terrace", "5B Banyan Enclave", "88 Quince Street", "31 Alder Court",
  "14 Rosewood Villas", "67 Orchard Lane", "2B Tulip Residency",
];

const CUSTOMER_TAGS = [
  "repeat buyer", "high value", "fashion", "tech lover", "home decorator",
  "price sensitive", "subscribed", "wholesale inquiry", "gift buyer", "early adopter",
];

const SEGMENT_POOL: Customer["segment"][] = [
  "vip", "loyal", "new", "at_risk", "dormant", "wholesale",
];

function buildAddress(rng: () => number, name: string, index: number): Address {
  const place = pickOne(rng, CITIES);
  return {
    id: `addr-${index}-${Math.floor(rng() * 900 + 100)}`,
    name,
    phone: `+91 ${String(7000000000 + Math.floor(rng() * 999999999)).slice(0, 10)}`,
    line1: pickOne(rng, STREETS),
    line2: rng() > 0.6 ? `Tower ${pickOne(rng, ["A", "B", "C"])}, Flat ${Math.floor(rng() * 900 + 100)}` : undefined,
    city: place.city,
    state: place.state,
    postalCode: place.postal,
    country: place.country,
    countryCode: place.code,
  };
}

export function buildCustomers(count = 60): Customer[] {
  const rng = createRng(1337);
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[(index * 7) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const createdAt = monthsAgo(1 + (index % 14), 1 + (index % 27));
    const orderCount = index % 11 === 0 ? 0 : 1 + Math.floor(rng() * 9);
    const averageOrderValue = 1200 + Math.floor(rng() * 9200);
    const totalSpent = orderCount * averageOrderValue;
    const segment =
      orderCount === 0
        ? SEGMENT_POOL[2 + (index % 2)]
        : orderCount >= 6
          ? "vip"
          : orderCount >= 3
            ? "loyal"
            : pickOne(rng, ["new", "at_risk", "dormant"] as const);
    return {
      id: `cus-${String(index + 1).padStart(3, "0")}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${index}@example.com`,
      phone: `+91 ${String(7000000000 + Math.floor(rng() * 999999999)).slice(0, 10)}`,
      createdAt,
      lastOrderAt: orderCount === 0 ? null : daysAgo(Math.floor(rng() * 60), 12, 10),
      orderCount,
      totalSpent,
      averageOrderValue,
      segment,
      tags: pickMany(rng, CUSTOMER_TAGS, 1 + Math.floor(rng() * 3)),
      addresses: [buildAddress(rng, name, index)],
      marketingConsent: rng() > 0.32,
      notes: index % 9 === 0 ? "Prefers WhatsApp updates. Always ships to the saved address." : "",
      status: index % 37 === 11 ? "blocked" : "active",
    } satisfies Customer;
  });
}

export const STAFF_SEED: {
  name: string;
  email: string;
  role: StaffMember["role"];
  status: StaffMember["status"];
}[] = [
  { name: "Naveen Raghavan", email: "naveen.raghavan@example.com", role: "owner", status: "active" },
  { name: "Priya Deshmukh", email: "priya.deshmukh@example.com", role: "admin", status: "active" },
  { name: "Arjun Sethi", email: "arjun.sethi@example.com", role: "manager", status: "active" },
  { name: "Fatima Qureshi", email: "fatima.qureshi@example.com", role: "support", status: "active" },
  { name: "Karthik Iyer", email: "karthik.iyer@example.com", role: "fulfillment", status: "active" },
  { name: "Sara Thomas", email: "sara.thomas@example.com", role: "support", status: "active" },
  { name: "Vikram Chauhan", email: "vikram.chauhan@example.com", role: "analyst", status: "active" },
  { name: "Leena Kapoor", email: "leena.kapoor@example.com", role: "manager", status: "active" },
  { name: "Dev Menon", email: "dev.menon@example.com", role: "fulfillment", status: "active" },
  { name: "Rhea Bhat", email: "rhea.bhat@example.com", role: "support", status: "invited" },
];

export function buildStaff(): StaffMember[] {
  return STAFF_SEED.map((seed, index) => ({
    id: `stf-${String(index + 1).padStart(2, "0")}`,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    status: seed.status,
    lastActiveAt:
      seed.status === "invited" ? null : daysAgo(Math.floor((index * 3) % 14), 15, 20),
    createdAt: monthsAgo(9 - (index % 8)),
    permissions: [],
  }));
}

const MERCHANT_CITIES = [
  { country: "India", code: "IN" },
  { country: "United Kingdom", code: "GB" },
  { country: "United States", code: "US" },
  { country: "United Arab Emirates", code: "AE" },
  { country: "Singapore", code: "SG" },
  { country: "Canada", code: "CA" },
];

const MERCHANT_NAMES = [
  "Blue Palm Traders", "Urban Foliage", "Copper Kettle Co.", "Saffron Lane",
  "Bright Harbour Goods", "Pine & Parcel", "Marigold Home", "Sundial Outfitters",
  "Tidal Ceramics", "Cedar and Salt", "Velvet Fig Studio", "Northwind Supply",
  "Amber Fox Apparel", "Quiet Meadow", "Lumen Pantry",
];

export function buildMerchants(count = 15): Merchant[] {
  const rng = createRng(777);
  return Array.from({ length: count }, (_, index) => {
    const place = MERCHANT_CITIES[index % MERCHANT_CITIES.length];
    const gmv = Math.round((180000 + rng() * 2400000) / 1000) * 1000;
    const orderCount = Math.round(gmv / (3200 + rng() * 4200));
    const status =
      index % 9 === 4
        ? "past_due"
        : index % 11 === 6
          ? "suspended"
          : index % 7 === 3
            ? "trial"
            : "active";
    return {
      id: `mer-${String(index + 1).padStart(3, "0")}`,
      businessName: MERCHANT_NAMES[index % MERCHANT_NAMES.length],
      ownerName: `${FIRST_NAMES[(index * 3) % FIRST_NAMES.length]} ${LAST_NAMES[(index * 5) % LAST_NAMES.length]}`,
      email: `owner@${MERCHANT_NAMES[index % MERCHANT_NAMES.length].toLowerCase().replace(/[^a-z]+/g, "")}.example`,
      storeName: `${MERCHANT_NAMES[index % MERCHANT_NAMES.length]} Store`,
      storeSlug: MERCHANT_NAMES[index % MERCHANT_NAMES.length].toLowerCase().replace(/[^a-z]+/g, "-"),
      country: place.country,
      countryCode: place.code,
      planId: `plan-${(index % 4) + 1}`,
      planName: ["Starter", "Growth", "Scale", "Enterprise"][index % 4],
      status,
      gmv,
      orderCount,
      productCount: 12 + Math.floor(rng() * 240),
      createdAt: monthsAgo(2 + index, 1 + (index % 26)),
      lastActiveAt: daysAgo(Math.floor(rng() * 20), 11, 0),
    } satisfies Merchant;
  });
}
