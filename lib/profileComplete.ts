type ProfileCheckable = {
  phone?: string | null;
  education?: string | null;
  role: string;
};

export function isProfileComplete(user: ProfileCheckable): boolean {
  if (!user.phone?.trim()) return false;
  if (user.role === "Student" && (!user.education || user.education === "None")) return false;
  return true;
}

export function profileMissingFields(user: ProfileCheckable): string[] {
  const fields: string[] = [];
  if (!user.phone?.trim()) fields.push("phone");
  if (user.role === "Student" && (!user.education || user.education === "None"))
    fields.push("education");
  return fields;
}
