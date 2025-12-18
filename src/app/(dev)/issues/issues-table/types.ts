import { ProjectImport } from "@/features/project/model";

export type FormValues = ProjectImport;
export type Option = {
  value: string;
  label?: string;
  iconURL?: string | null;
  color?: string | null;
};

export type RowItem = ProjectImport["issues"][number];
