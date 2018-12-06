export enum ImmoType {
  TO_RENT,
  TO_BUY
}

export interface ImmoInterface {
  id: string;
  key: string;
  price: number;
  rooms: number;
  area: number;
  postalCode: string;
  type: ImmoType;
}
