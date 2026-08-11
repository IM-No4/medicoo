export type RecordItem = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  date: string;
  isSystem?: boolean;
  uri?: string;
  mimeType?: string;
  size: number;
};
