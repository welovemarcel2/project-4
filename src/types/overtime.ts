export interface OvertimeRates {
  normal: number;
  x1_5: number;
  x2: number;
}

export interface OvertimeData {
  baseHours: number;
  normalHours: number;
  x1_5Hours: number;
  x2Hours: number;
  rates: OvertimeRates;
  total?: number;
  overtimeDetails?: string;
}

export interface OvertimeSubPost {
  name: string;
  quantity: number;
  rate: number;
}

export interface OvertimeSubPosts {
  normal?: OvertimeSubPost;
  x1_5?: OvertimeSubPost;
  x2?: OvertimeSubPost;
  totalAmount?: number;
}

export interface OvertimeState {
  overtimeData: Record<string, OvertimeData>;
}