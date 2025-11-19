// Shared types and utility helpers for the stats page/components

export interface Role {
  role: string;
  package: number;
  package_details: string | null;
}

export interface Student {
  name: string;
  enrollment_number: string;
  email: string | null;
  role: string;
  package: number | null;
}

export interface Placement {
  company: string;
  roles: Role[];
  job_location: string[] | null;
  joining_date: string | null;
  students_selected: Student[];
  number_of_offers: number;
  additional_info: string;
  email_subject: string;
  email_sender: string;
  saved_at?: string;
  createdAt?: string;
  _id?: string;
}

export type StudentWithPlacement = Student & {
  company: string;
  roles: Role[];
  joining_date?: string;
  job_location?: string[] | null;
  placement: Placement;
};

export const formatPackage = (packageValue: number | null | undefined) => {
  if (packageValue == null) return "TBD";
  return `₹${packageValue.toFixed(1)} LPA`;
};

export const formatPercent = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
};

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "TBD";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "TBD";
  }
};

// Determine student package with multiple fallbacks (student -> exact role -> best viable role)
export const getStudentPackage = (
  student: Student,
  placement: Placement
): number | null => {
  if (student.package != null) return student.package;

  const exact = placement.roles.find((r) => r.role === student.role);
  if (exact && exact.package != null) return exact.package;

  const viable = placement.roles.filter((r) => r.package != null);
  if (viable.length === 1) return viable[0].package as number;
  if (viable.length > 1)
    return Math.max(...viable.map((r) => r.package as number));

  return null;
};
