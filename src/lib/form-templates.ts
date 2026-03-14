export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "time" | "date" | "section" | "stafflist" | "repeater";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  section?: string;
  fields?: FormField[]; // For repeater type
  defaultValue?: string | number;
}

export interface DepartmentTemplate {
  department: string;
  block?: string;
  category: string;
  forms: {
    name: string;
    slug: string;
    description: string;
    fields: FormField[];
  }[];
}

export const departmentTemplates: DepartmentTemplate[] = [
  // ===== A&E DEPARTMENT =====
  {
    department: "Accident & Emergency",
    block: "South Block",
    category: "Emergency",
    forms: [
      {
        name: "A&E Update",
        slug: "ae-update",
        description: "Accident and Emergency Department status update",
        fields: [
          { name: "reportTime", label: "Report Time", type: "time", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          // Staffing Section
          { name: "_staffing", label: "Staffing", type: "section" },
          { name: "consultantInCharge", label: "Consultant in Charge", type: "text", required: true },
          { name: "regRostered", label: "Registrar Rostered", type: "text" },
          { name: "regAbsent", label: "Registrar Absent", type: "text", defaultValue: "Nil" },
          { name: "hosRostered", label: "House Officers Rostered", type: "textarea", placeholder: "Comma-separated names" },
          { name: "obsgyn", label: "OBSGYN", type: "text" },
          { name: "hosAbsent", label: "House Officers Absent", type: "text", defaultValue: "Nil" },
          { name: "firstContactPhysician", label: "First Contact Physician", type: "text" },
          { name: "nurseInCharge", label: "Nurse in Charge", type: "text", required: true },
          { name: "rnRostered", label: "RN Rostered", type: "textarea", placeholder: "Comma-separated names" },
          { name: "rnAbsent", label: "RN Absent", type: "text", defaultValue: "Nil" },
          { name: "enaRostered", label: "ENA Rostered", type: "textarea" },
          { name: "enaAbsent", label: "ENA Absent", type: "text", defaultValue: "Nil" },
          { name: "ecgTechRostered", label: "ECG Technician Rostered", type: "text", defaultValue: "N/A" },
          { name: "ecgTechAbsent", label: "ECG Technician Absent", type: "text", defaultValue: "N/A" },
          { name: "pcaRostered", label: "PCA Rostered", type: "text", defaultValue: "N/A" },
          { name: "pcaAbsent", label: "PCA Absent", type: "text", defaultValue: "N/A" },
          { name: "emtRostered", label: "EMT Rostered", type: "textarea" },
          { name: "emtAbsent", label: "EMT Absent", type: "text", defaultValue: "Nil" },
          { name: "attendantsRostered", label: "Attendants Rostered", type: "text", defaultValue: "N/A" },
          { name: "attendantsAbsent", label: "Attendants Absent", type: "text", defaultValue: "N/A" },
          { name: "croRostered", label: "CRO Rostered", type: "text" },
          { name: "croAbsent", label: "CRO Absent", type: "text", defaultValue: "Nil" },
          { name: "clerksRostered", label: "Clerks Rostered", type: "textarea" },
          { name: "clerksAbsent", label: "Clerks Absent", type: "text", defaultValue: "Nil" },
          // Pre-Screening Section
          { name: "_prescreening", label: "Pre-Screening", type: "section" },
          { name: "screeningOfficers", label: "Screening Officers", type: "number", defaultValue: 0 },
          { name: "patientsBeingScreened", label: "Patients Being Screened", type: "number", defaultValue: 0 },
          { name: "patientsAwaitingScreening", label: "Patients Awaiting Screening", type: "number", defaultValue: 0 },
          // Triage Section
          { name: "_triage", label: "Triage", type: "section" },
          { name: "triageOfficers", label: "Triage Officers", type: "number" },
          { name: "patientBeingTriaged", label: "Patient Being Triaged", type: "number", defaultValue: 0 },
          { name: "patientsWaitingTriage", label: "Patients Waiting Triage", type: "number", defaultValue: 0 },
          { name: "fcpCount", label: "First Contact Physicians on Duty", type: "number" },
          { name: "fcpPatientBeingSeen", label: "FCP Patient Being Seen", type: "number" },
          { name: "fcpPatientsWaiting", label: "FCP Patients Waiting", type: "number", defaultValue: 0 },
          { name: "longestWaitingTime", label: "Longest Waiting Time", type: "text", defaultValue: "Nil At This Time" },
          // Patients Awaiting Inside Doctors
          { name: "_patientsAwaiting", label: "Patients Awaiting Inside Doctors", type: "section" },
          { name: "ctas1", label: "CTAS 1", type: "number", defaultValue: 0 },
          { name: "ctas2", label: "CTAS 2", type: "number", defaultValue: 0 },
          { name: "ctas3", label: "CTAS 3", type: "number", defaultValue: 0 },
          { name: "ctas45", label: "CTAS 4/5", type: "number", defaultValue: 0 },
          { name: "paeds", label: "PAEDS", type: "number", defaultValue: 0 },
          { name: "obgyn", label: "OBGYN", type: "number", defaultValue: 0 },
          { name: "longestWaitingCtas3", label: "Longest Waiting CTAS 3", type: "text" },
          { name: "longestWaitingCtas4", label: "Longest Waiting CTAS 4", type: "text" },
          { name: "longestWaitingPaeds", label: "Longest Waiting PAEDS", type: "text" },
          // Patients Awaiting Investigations
          { name: "_investigations", label: "Patients Awaiting Investigations", type: "section" },
          { name: "awaitingXray", label: "Awaiting X-ray", type: "number", defaultValue: 0 },
          { name: "awaitingCT", label: "Awaiting CT", type: "number", defaultValue: 0 },
          { name: "awaitingUSS", label: "Awaiting USS", type: "number", defaultValue: 0 },
          { name: "awaitingECG", label: "Awaiting ECG", type: "number", defaultValue: 0 },
          { name: "awaitingTreatment", label: "Awaiting Treatment", type: "number", defaultValue: 0 },
          { name: "awaitingSpecialist", label: "Awaiting Specialist Review", type: "number", defaultValue: 0 },
          { name: "patientsLessThan2yrs", label: "Patients less than 2 years", type: "number", defaultValue: 0 },
          // Trolley/Bed Occupancy
          { name: "_trolley", label: "Trolley / Bed Occupancy", type: "section" },
          { name: "hdu", label: "HDU", type: "number", defaultValue: 0 },
          { name: "bay1", label: "Bay 1", type: "number", defaultValue: 0 },
          { name: "bay2", label: "Bay 2", type: "number", defaultValue: 0 },
          { name: "bay3", label: "Bay 3", type: "number", defaultValue: 0 },
          { name: "resus", label: "Resus", type: "number", defaultValue: 0 },
          { name: "decontaminationRoom", label: "Decontamination Room", type: "number", defaultValue: 0 },
          { name: "respirationRoom", label: "Respiration Room", type: "number", defaultValue: 0 },
          { name: "observation", label: "Observation", type: "number", defaultValue: 0 },
          { name: "corridor", label: "Corridor (Outside Plaster Tech Room)", type: "number", defaultValue: 0 },
          { name: "isolation", label: "Isolation", type: "number", defaultValue: 0 },
          { name: "minorOT", label: "Minor OT", type: "number", defaultValue: 0 },
          // Bed Space Available
          { name: "_bedSpace", label: "Bed Space Available", type: "section" },
          { name: "bedMed1", label: "Med 1", type: "number", defaultValue: 0 },
          { name: "bedMed2", label: "Med 2", type: "number", defaultValue: 0 },
          { name: "bedSurg1", label: "Surg 1", type: "number", defaultValue: 0 },
          { name: "bedSurg2", label: "Surg 2", type: "number", defaultValue: 0 },
          { name: "bedSpillover", label: "Spillover (Ward 2)", type: "number", defaultValue: 0 },
          { name: "bedGynae", label: "Gynae", type: "number", defaultValue: 0 },
          { name: "bedECU", label: "ECU", type: "number", defaultValue: 0 },
          { name: "bedWard1", label: "Ward 1", type: "text", defaultValue: "0" },
          // Pending Admissions
          { name: "_pendingAdmissions", label: "Pending Admissions", type: "section" },
          { name: "pendingTotal", label: "Total Pending Admissions", type: "number", defaultValue: 0 },
          { name: "pendingMed1", label: "Pending - Med 1", type: "number", defaultValue: 0 },
          { name: "pendingMed2", label: "Pending - Med 2", type: "number", defaultValue: 0 },
          { name: "pendingICU", label: "Pending - ICU", type: "number", defaultValue: 0 },
          { name: "pendingSurg1", label: "Pending - Surg 1", type: "number", defaultValue: 0 },
          { name: "pendingSurg2", label: "Pending - Surg 2", type: "number", defaultValue: 0 },
          { name: "pendingGynae", label: "Pending - Gynae", type: "number", defaultValue: 0 },
          { name: "pendingPaeds", label: "Pending - Paeds", type: "number", defaultValue: 0 },
          { name: "pendingSpillover", label: "Pending - Spillover (Ward 2)", type: "number", defaultValue: 0 },
          // Summary
          { name: "_summary", label: "Summary", type: "section" },
          { name: "pendingAdmissionsInfoBy", label: "Pending Admissions Info Given By", type: "text" },
          { name: "staffInfoGivenBy", label: "Staff Info Given By", type: "text" },
          { name: "patientsRegistered", label: "Patients Registered (period)", type: "number" },
          { name: "patientsLWBS", label: "Patients Leaving Without Being Seen", type: "number", defaultValue: 0 },
          { name: "departmentalIssues", label: "Departmental Issues", type: "textarea" },
          { name: "preparedBy", label: "Prepared By", type: "text", required: true },
        ],
      },
    ],
  },

  // ===== WARD STATUS (shared template for multiple wards) =====
  ...[
    { dept: "Medical Ward 1", block: "South Block" },
    { dept: "Medical Ward 2", block: "South Block" },
    { dept: "Surgical Ward 1", block: "South Block" },
    { dept: "Surgical Ward 2", block: "South Block" },
    { dept: "Maternity Ward 4", block: "North Block" },
    { dept: "Gynae Ward 6", block: "North Block" },
    { dept: "ECU", block: "South Block" },
    { dept: "Ward 1", block: "South Block" },
    { dept: "Ward 2 - Male Spillover", block: "South Block" },
    { dept: "NICU", block: "North Block" },
  ].map((w) => ({
    department: w.dept,
    block: w.block,
    category: "Ward",
    forms: [
      {
        name: `${w.dept} Status`,
        slug: `${w.dept.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-status`,
        description: `Daily status report for ${w.dept}`,
        fields: [
          { name: "bedsAvailable", label: "Beds/Cots Available", type: "number" as const, required: true, defaultValue: 0 },
          { name: "pendingDischarges", label: "Pending Discharges", type: "number" as const, defaultValue: 0 },
          { name: "possibleDischarges", label: "Possible Discharges", type: "number" as const, defaultValue: 0 },
          { name: "pendingAdmissions", label: "Pending Admissions", type: "number" as const, defaultValue: 0 },
          { name: "pendingTransfer", label: "Pending Transfer", type: "number" as const, defaultValue: 0 },
          { name: "bedCapacity", label: "Bed Capacity", type: "number" as const, required: true },
          { name: "staffing", label: "Staffing", type: "select" as const, options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "staffingNotes", label: "Staffing Notes", type: "text" as const, placeholder: "e.g. 1 RN Absent" },
          { name: "issues", label: "Issues", type: "textarea" as const, placeholder: "List any issues or enter 'Nil'" },
          { name: "infoGivenBy", label: "Info Given By", type: "text" as const },
        ],
      },
    ],
  })),

  // ===== CRITICAL CARE =====
  {
    department: "Critical Care",
    block: "South Block",
    category: "Ward",
    forms: [
      {
        name: "Critical Care Status",
        slug: "critical-care-status",
        description: "ICU/Critical Care daily status report",
        fields: [
          { name: "bedsAvailable", label: "Beds Available", type: "number", required: true, defaultValue: 0 },
          { name: "pendingAdmissions", label: "Pending Admissions", type: "number", defaultValue: 0 },
          { name: "pendingStepDown", label: "Pending Step Down to Ward", type: "number", defaultValue: 0 },
          { name: "bedCapacity", label: "Bed Capacity", type: "number", required: true },
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", placeholder: "List any issues (ongoing, equipment, infrastructure)" },
        ],
      },
    ],
  },

  // ===== OPERATING THEATRES =====
  {
    department: "Operating Theatre - North Block",
    block: "North Block",
    category: "Theatre",
    forms: [
      {
        name: "North Block OT Report",
        slug: "north-block-ot-report",
        description: "North Block Operating Theatre daily cases report",
        fields: [
          { name: "_cases", label: "Cases by Specialty", type: "section" },
          { name: "gynaeCases", label: "Gynae Cases", type: "number", defaultValue: 0 },
          { name: "ophthalCases", label: "Ophthal Cases", type: "number", defaultValue: 0 },
          { name: "radiologyCases", label: "Radiology Cases", type: "number", defaultValue: 0 },
          { name: "totalCases", label: "Total Cases", type: "number", required: true },
          { name: "cancelledCases", label: "Cancelled Cases", type: "number", defaultValue: 0 },
          { name: "_scheduled", label: "Scheduled Surgeries", type: "section" },
          { name: "scheduledList", label: "Scheduled Surgeries List", type: "textarea", placeholder: "e.g. 5 Ophthal, 4 Gynae" },
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", defaultValue: "Nil reported" },
        ],
      },
    ],
  },
  {
    department: "Operating Theatre - NSGH",
    block: "South Block",
    category: "Theatre",
    forms: [
      {
        name: "NSGH OT Report",
        slug: "nsgh-ot-report",
        description: "NSGH Operating Theatre daily cases report",
        fields: [
          { name: "_cases", label: "Cases by Specialty", type: "section" },
          { name: "gynaeCases", label: "Gynae Cases", type: "number", defaultValue: 0 },
          { name: "genSurgCases", label: "General Surgery Cases", type: "number", defaultValue: 0 },
          { name: "orthoCases", label: "Ortho Cases", type: "number", defaultValue: 0 },
          { name: "urologyCases", label: "Urology Cases", type: "number", defaultValue: 0 },
          { name: "entCases", label: "ENT Cases", type: "number", defaultValue: 0 },
          { name: "aeCases", label: "A&E Cases", type: "number", defaultValue: 0 },
          { name: "emergencyCases", label: "Emergency Cases", type: "number", defaultValue: 0 },
          { name: "totalCases", label: "Total Cases", type: "number", required: true },
          { name: "cancelledCases", label: "Cancelled Cases", type: "number", defaultValue: 0 },
          { name: "cancelReason", label: "Cancellation Reason", type: "text" },
          { name: "staffing", label: "Staffing (Nurses)", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "patientsInRecovery", label: "Patients in Recovery Room", type: "number", defaultValue: 0 },
          { name: "issues", label: "Issues", type: "textarea" },
        ],
      },
    ],
  },

  // ===== WOUND CARE =====
  {
    department: "Wound Care Unit",
    block: "South Block",
    category: "Clinic",
    forms: [
      {
        name: "Wound Care Report",
        slug: "wound-care-report",
        description: "Wound Care Unit daily report",
        fields: [
          { name: "totalCarded", label: "Total Carded", type: "number", required: true },
          { name: "newPatients", label: "New Patients", type: "number", defaultValue: 0 },
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", defaultValue: "Nil reported" },
        ],
      },
    ],
  },

  // ===== ONCOLOGY =====
  {
    department: "Oncology",
    block: "South Block",
    category: "Clinic",
    forms: [
      {
        name: "Oncology Report",
        slug: "oncology-report",
        description: "Oncology daily treatment report",
        fields: [
          { name: "scheduledChemo", label: "Scheduled Chemo & Supportive Treatment", type: "number", required: true },
          { name: "newPatients", label: "New Patients", type: "number", defaultValue: 0 },
          { name: "oncoRevisit", label: "Onco Revisit", type: "number", defaultValue: 0 },
          { name: "haemRevisit", label: "Haem Revisit", type: "number", defaultValue: 0 },
          { name: "newCases", label: "New Cases", type: "number", defaultValue: 0 },
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", defaultValue: "Nil Reported" },
          { name: "infoGivenBy", label: "Info Given By", type: "text" },
        ],
      },
    ],
  },

  // ===== SIMPLE DEPARTMENTS (Staffing + Issues) =====
  ...[
    { dept: "Physiotherapy", block: "South Block" },
    { dept: "Pharmacy", block: "South Block" },
  ].map((d) => ({
    department: d.dept,
    block: d.block,
    category: "Support",
    forms: [
      {
        name: `${d.dept} Report`,
        slug: `${d.dept.toLowerCase()}-report`,
        description: `${d.dept} daily status report`,
        fields: [
          { name: "staffing", label: "Staffing", type: "select" as const, options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea" as const, defaultValue: "Nil" },
        ],
      },
    ],
  })),

  // ===== RADIOLOGY (North Block - detailed) =====
  {
    department: "Radiology - North Block",
    block: "North Block",
    category: "Diagnostic",
    forms: [
      {
        name: "Radiology North Block Report",
        slug: "radiology-north-report",
        description: "Radiology North Block report with sub-departments",
        fields: [
          { name: "_ultrasound", label: "Ultrasound", type: "section" },
          { name: "ussStaffing", label: "USS Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "ussIssues", label: "USS Issues", type: "textarea", defaultValue: "Nil" },
          { name: "_xray", label: "X-ray", type: "section" },
          { name: "xrayStaffing", label: "X-ray Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "xrayStaffingNotes", label: "X-ray Staffing Notes", type: "text" },
          { name: "xrayIssues", label: "X-ray Issues", type: "textarea", defaultValue: "Nil" },
          { name: "_ct", label: "CT", type: "section" },
          { name: "ctStaffing", label: "CT Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "ctIssues", label: "CT Issues", type: "textarea", defaultValue: "Nil" },
        ],
      },
    ],
  },

  // ===== RADIOLOGY (South Block - simple) =====
  {
    department: "Radiology - South Block",
    block: "South Block",
    category: "Diagnostic",
    forms: [
      {
        name: "Radiology South Block Report",
        slug: "radiology-south-report",
        description: "Radiology South Block daily status report",
        fields: [
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", defaultValue: "Nil" },
        ],
      },
    ],
  },

  // ===== BLOOD LAB =====
  {
    department: "Blood Lab",
    block: "South Block",
    category: "Diagnostic",
    forms: [
      {
        name: "Blood Lab Report",
        slug: "blood-lab-report",
        description: "Blood Lab daily report including test availability",
        fields: [
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea" },
          { name: "testAvailability", label: "Test Availability Updates", type: "textarea", placeholder: "Note any tests unavailable or limited" },
        ],
      },
    ],
  },

  // ===== BLOOD BANK =====
  {
    department: "Blood Bank",
    block: "South Block",
    category: "Diagnostic",
    forms: [
      {
        name: "Blood Bank Report",
        slug: "blood-bank-report",
        description: "Blood Bank status and blood units inventory",
        fields: [
          { name: "staffing", label: "Staffing", type: "select", options: ["Sufficient", "Insufficient", "Short Staffed"], required: true },
          { name: "issues", label: "Issues", type: "textarea", defaultValue: "Nil new" },
          { name: "update", label: "General Update", type: "textarea" },
          { name: "_bloodStock", label: "Blood Units In Stock", type: "section" },
          { name: "aPositive", label: "A+", type: "number", defaultValue: 0 },
          { name: "aNegative", label: "A-", type: "number", defaultValue: 0 },
          { name: "bPositive", label: "B+", type: "number", defaultValue: 0 },
          { name: "bNegative", label: "B-", type: "number", defaultValue: 0 },
          { name: "abPositive", label: "AB+", type: "number", defaultValue: 0 },
          { name: "abNegative", label: "AB-", type: "number", defaultValue: 0 },
          { name: "oPositive", label: "O+", type: "number", defaultValue: 0 },
          { name: "oNegative", label: "O-", type: "number", defaultValue: 0 },
        ],
      },
    ],
  },
];
