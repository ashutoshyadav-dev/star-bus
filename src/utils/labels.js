export const ID_PROOF_LABELS = {
  aadhaar: "Aadhaar Card", voter_id: "Voter ID (EPIC)", passport: "Passport",
  driving_license: "Driving Licence", pan_card: "PAN Card",
};
export const GENDER_LABELS = { male: "Male", female: "Female", other: "Other", prefer_not_to_say: "Prefer not to say" };
export const label = (map, v) => map[v] ?? (v ? String(v).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");