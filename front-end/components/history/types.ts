
export interface Transaction {
  id: number;
  title: string;
  date: string;
  displayDate: string;
  amount: number;
  type: 'in' | 'out';
  status: string;
  ref: string;
}
