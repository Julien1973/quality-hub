export interface StaffMember {
  name: string;
  phone: string;
}

export interface RosterRole {
  title: string;
  staff: StaffMember[];
}

export interface RosterDepartment {
  name: string;
  roles: RosterRole[];
}

// Daily schedule: which staff are on duty on which day
export interface DailyScheduleEntry {
  day: number; // day of month (1-31)
  staffNames: string[]; // last names / short names on duty
}

export interface DepartmentSchedule {
  department: string;
  schedule: DailyScheduleEntry[];
}

export interface ParsedRoster {
  departments: RosterDepartment[];
  month: string; // e.g. "2026-03"
  schedules: DepartmentSchedule[];
}

const DEPARTMENT_PATTERNS = [
  "Internal Medicine",
  "Nephrology",
  "Oncology",
  "Haematology",
  "Surgery",
  "Orthopaedics",
  "Paediatrics",
  "Obstetrics",
  "Gynaecology",
  "O&G",
  "Urology",
  "Ear Nose & Throat",
  "ENT",
  "Anaesthetics",
  "Psychiatry",
  "Radiology",
  "Emergency",
  "A&E",
  "Accident & Emergency",
  "Critical Care",
  "ICU",
  "Ophthalmology",
  "Mental Health",
  "Microbiology",
];

const ROLE_PATTERNS = [
  /House Officers?:?\s*$/i,
  /SMO\/Reg\.?:?\s*$/i,
  /SMO\/Reg\.?\/HO:?\s*$/i,
  /SMO\/Registrar:?\s*$/i,
  /Registrar:?\s*$/i,
  /Registrars?:?\s*$/i,
  /Interns?\s*$/i,
  /Consultant:?\s*$/i,
  /SMOs?:?\s*$/i,
];

const DAY_PATTERN = /^(Sun|Mon|Tues?|Wed|Thurs?|Fri|Sat)\s+(\d{1,2})\s+(.+)/i;

// Words to ignore in rota lines
const ROTA_NOISE = new Set([
  "-do-", "--", "---", "----", "(--)", "(----)", "(-)", "",
  "bhagaloo", "md", "cto", "vl",
]);

function cleanName(raw: string): { name: string; phone: string } {
  let line = raw.replace(/^\*+\s*/, "").trim();
  const phoneMatch = line.match(/(\d{3}\s*[-–]\s*\d{4}(?:\s*[/;,]\s*\d{3}\s*[-–]\s*\d{4})*)/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : "";
  let name = line
    .replace(/\d{3}\s*[-–]\s*\d{4}(?:\s*[/;,]\s*\d{3}\s*[-–]\s*\d{4})*/g, "")
    .replace(/\d{1,2}\s+\w+\s+\d{2,4}\s*[-–]\s*\d{1,2}\s+\w+\s+\d{2,4}/g, "")
    .replace(/\w+\s+\d{2}\s*[-–]\s*\w+\s+\d{2}/g, "")
    .replace(/\(CTO\)/gi, "")
    .replace(/\(VL\)/gi, "")
    .replace(/\(ML\)/gi, "")
    .replace(/\(NPL\)/gi, "")
    .replace(/\(SL\)/gi, "")
    .replace(/Dr\.\s*/gi, "")
    .trim();
  name = name
    .replace(/\s+(Internal Medicine|Gen Surg\/Ortho|O&G|Paediatrics|Surgery|Orthopaedics)\s*$/i, "")
    .trim();
  name = name.replace(/\s+/g, " ").replace(/[,;:]+$/, "").trim();
  return { name, phone };
}

function isDepartmentHeader(line: string): string | null {
  const trimmed = line.trim();
  for (const dept of DEPARTMENT_PATTERNS) {
    if (trimmed.toLowerCase().startsWith(dept.toLowerCase())) {
      return trimmed.replace(/[:]/g, "").trim();
    }
  }
  return null;
}

function isRoleHeader(line: string): string | null {
  const trimmed = line.trim();
  for (const pattern of ROLE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(/[:]/g, "").trim();
    }
  }
  if (/^(SMO|Reg|HO|House|Intern|Consultant)/i.test(trimmed) && trimmed.includes(":")) {
    return trimmed.replace(/[:]/g, "").trim();
  }
  return null;
}

function isStaffLine(line: string): boolean {
  const trimmed = line.trim();
  if (/\d{3}\s*[-–]\s*\d{4}/.test(trimmed)) {
    const name = trimmed.replace(/^\*+\s*/, "").replace(/\d{3}\s*[-–]\s*\d{4}.*/g, "").trim();
    return name.length > 2 && name.length < 50;
  }
  return false;
}

function isSkipLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^(Holidays|Vacation|I confirm|NAME OF|SIGNATURE|DATES OF|Medical Director|SANGRE GRANDE|HOUSE OFFICERS|FOR THE PERIOD|FOR PERIOD|_+|N\.?B\.?\s|HOD|DAY\s+DATE)/i.test(trimmed)) return true;
  if (trimmed.length < 3) return true;
  return false;
}

function isRotaLine(line: string): { day: number; staffNames: string[] } | null {
  const match = line.trim().match(DAY_PATTERN);
  if (!match) return null;

  const dayNum = parseInt(match[2]);
  if (dayNum < 1 || dayNum > 31) return null;

  const namesStr = match[3];
  // Split on double+ spaces or known separators
  const tokens = namesStr
    .split(/\s{2,}|[/]/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Further split single-spaced tokens that might be multiple names
  const names: string[] = [];
  for (const token of tokens) {
    // Check if it looks like "Initial. Lastname" (keep together)
    if (/^[A-Z]\.\s*\w+/.test(token)) {
      const cleaned = token.trim();
      if (!ROTA_NOISE.has(cleaned.toLowerCase())) {
        names.push(cleaned);
      }
    } else {
      // Split by single space — each word is likely a last name
      const parts = token.split(/\s+/);
      for (const p of parts) {
        const cleaned = p.replace(/[()[\]]/g, "").trim();
        if (cleaned.length > 1 && !ROTA_NOISE.has(cleaned.toLowerCase()) && !/^\d+$/.test(cleaned)) {
          names.push(cleaned);
        }
      }
    }
  }

  // Deduplicate
  const unique = [...new Set(names)];
  return unique.length > 0 ? { day: dayNum, staffNames: unique } : null;
}

export function parseRosterText(text: string): ParsedRoster {
  const lines = text.split("\n");
  const departments: RosterDepartment[] = [];
  const schedules: DepartmentSchedule[] = [];
  let currentDept: RosterDepartment | null = null;
  let currentRole: RosterRole | null = null;
  let currentScheduleDept: string | null = null;
  let currentSchedule: DailyScheduleEntry[] = [];
  let inRotaTable = false;

  // Try to detect month from text (e.g., "MARCH 01st, 2026")
  let month = "";
  const monthMatch = text.match(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(\d{4})/i);
  if (monthMatch) {
    const monthNames: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    month = `${monthMatch[2]}-${monthNames[monthMatch[1].toLowerCase()]}`;
  }

  for (const line of lines) {
    // Check for rota table lines first
    const rotaData = isRotaLine(line);
    if (rotaData) {
      if (!inRotaTable) {
        inRotaTable = true;
        // Use the most recent department name as the schedule department
        if (currentDept) {
          // Save previous schedule if any
          if (currentScheduleDept && currentSchedule.length > 0) {
            // Merge with existing schedule for same dept
            const existing = schedules.find(s => s.department === currentScheduleDept);
            if (existing) {
              for (const entry of currentSchedule) {
                const ex = existing.schedule.find(e => e.day === entry.day);
                if (ex) {
                  ex.staffNames = [...new Set([...ex.staffNames, ...entry.staffNames])];
                } else {
                  existing.schedule.push(entry);
                }
              }
            } else {
              schedules.push({ department: currentScheduleDept, schedule: [...currentSchedule] });
            }
          }
          currentScheduleDept = currentDept.name;
          currentSchedule = [];
        }
      }
      currentSchedule.push(rotaData);
      continue;
    }

    if (inRotaTable && !rotaData) {
      // We might be at the end of a rota table, but only if this isn't a header row
      if (!/^(DAY|DATE|TRIAGE|REGISTRAR|SMO|HO|MD|One Day|8am|7am|6:00|2:00|10:00|10am|9am|7pm)\s/i.test(line.trim()) && line.trim().length > 2) {
        // Save the schedule
        if (currentScheduleDept && currentSchedule.length > 0) {
          const existing = schedules.find(s => s.department === currentScheduleDept);
          if (existing) {
            for (const entry of currentSchedule) {
              const ex = existing.schedule.find(e => e.day === entry.day);
              if (ex) {
                ex.staffNames = [...new Set([...ex.staffNames, ...entry.staffNames])];
              } else {
                existing.schedule.push(entry);
              }
            }
          } else {
            schedules.push({ department: currentScheduleDept, schedule: [...currentSchedule] });
          }
        }
        inRotaTable = false;
        currentSchedule = [];
      }
    }

    if (isSkipLine(line)) continue;

    const deptName = isDepartmentHeader(line);
    if (deptName) {
      const existing = departments.find(
        (d) => d.name.toLowerCase() === deptName.toLowerCase()
      );
      if (existing) {
        currentDept = existing;
      } else {
        currentDept = { name: deptName, roles: [] };
        departments.push(currentDept);
      }
      currentRole = null;
      continue;
    }

    const roleName = isRoleHeader(line);
    if (roleName && currentDept) {
      currentRole = { title: roleName, staff: [] };
      currentDept.roles.push(currentRole);
      continue;
    }

    if (isStaffLine(line)) {
      const { name, phone } = cleanName(line);
      if (name.length > 1) {
        if (currentRole) {
          if (!currentRole.staff.find((s) => s.name === name)) {
            currentRole.staff.push({ name, phone });
          }
        } else if (currentDept) {
          if (!currentDept.roles.length || currentDept.roles[currentDept.roles.length - 1].title !== "Staff") {
            currentRole = { title: "Staff", staff: [] };
            currentDept.roles.push(currentRole);
          } else {
            currentRole = currentDept.roles[currentDept.roles.length - 1];
          }
          if (!currentRole.staff.find((s) => s.name === name)) {
            currentRole.staff.push({ name, phone });
          }
        }
      }
    }
  }

  // Save any remaining schedule
  if (currentScheduleDept && currentSchedule.length > 0) {
    const existing = schedules.find(s => s.department === currentScheduleDept);
    if (existing) {
      for (const entry of currentSchedule) {
        const ex = existing.schedule.find(e => e.day === entry.day);
        if (ex) {
          ex.staffNames = [...new Set([...ex.staffNames, ...entry.staffNames])];
        } else {
          existing.schedule.push(entry);
        }
      }
    } else {
      schedules.push({ department: currentScheduleDept, schedule: [...currentSchedule] });
    }
  }

  return { departments, month, schedules };
}

// Get all staff names as a flat list
export function getAllStaffNames(roster: ParsedRoster): string[] {
  const names = new Set<string>();
  for (const dept of roster.departments) {
    for (const role of dept.roles) {
      for (const staff of role.staff) {
        names.add(staff.name);
      }
    }
  }
  return Array.from(names).sort();
}

// Staff tier classification based on role title
export type StaffTier = "ho" | "registrar" | "smo" | "consultant" | "other";

function classifyRole(roleTitle: string): StaffTier {
  const lower = roleTitle.toLowerCase();
  // HO / House Officers / Interns
  if (/house\s*officer/i.test(lower) || /\bho\b/.test(lower) || /intern/i.test(lower)) return "ho";
  // Registrar (without SMO)
  if (/registrar/i.test(lower) && !/smo/i.test(lower)) return "registrar";
  // SMO/Reg combined → registrar tier
  if (/smo/i.test(lower) && /reg/i.test(lower)) return "registrar";
  // SMO alone
  if (/smo/i.test(lower)) return "smo";
  // Consultant
  if (/consultant/i.test(lower)) return "consultant";
  return "other";
}

// Get staff for a specific department
export function getStaffByDepartment(roster: ParsedRoster, deptName: string): StaffMember[] {
  const dept = roster.departments.find(
    (d) => d.name.toLowerCase().includes(deptName.toLowerCase())
  );
  if (!dept) return [];
  const allStaff: StaffMember[] = [];
  const seen = new Set<string>();
  for (const role of dept.roles) {
    for (const staff of role.staff) {
      if (!seen.has(staff.name)) {
        seen.add(staff.name);
        allStaff.push(staff);
      }
    }
  }
  return allStaff;
}

// Get staff for a specific department, grouped by tier
export function getStaffByDepartmentGrouped(
  roster: ParsedRoster,
  deptName: string
): Record<StaffTier, StaffMember[]> {
  const result: Record<StaffTier, StaffMember[]> = {
    ho: [],
    registrar: [],
    smo: [],
    consultant: [],
    other: [],
  };
  const dept = roster.departments.find(
    (d) => d.name.toLowerCase().includes(deptName.toLowerCase())
  );
  if (!dept) return result;

  for (const role of dept.roles) {
    const tier = classifyRole(role.title);
    for (const staff of role.staff) {
      if (!result[tier].find((s) => s.name === staff.name)) {
        result[tier].push(staff);
      }
    }
  }
  return result;
}

// Get staff on duty for a specific department on a specific day of the month
export function getStaffOnDuty(roster: ParsedRoster, deptName: string, dayOfMonth: number): string[] {
  // Find matching schedule
  const schedule = roster.schedules.find(
    (s) => s.department.toLowerCase().includes(deptName.toLowerCase()) ||
      deptName.toLowerCase().includes(s.department.toLowerCase())
  );
  if (!schedule) return [];

  const entry = schedule.schedule.find(e => e.day === dayOfMonth);
  if (!entry || !Array.isArray(entry.staffNames)) return [];

  // Try to match short names from rota against full names from staff list
  const allDeptStaff = getStaffByDepartment(roster, deptName);
  const matchedNames: string[] = [];

  for (const shortName of entry.staffNames) {
    // Find the full name that matches this short name (last name match)
    const match = allDeptStaff.find(s => {
      const parts = s.name.split(" ");
      const lastName = parts[parts.length - 1];
      return lastName.toLowerCase() === shortName.toLowerCase() ||
        s.name.toLowerCase().includes(shortName.toLowerCase());
    });
    if (match) {
      matchedNames.push(match.name);
    } else {
      // Use the short name as-is if no match
      matchedNames.push(shortName);
    }
  }

  return [...new Set(matchedNames)];
}
