import { type NetworkSymbol } from '@suite-common/wallet-config';

export interface AddressBookEntry {
    id: string;
    label: string;
    address: string;
    coin: NetworkSymbol;
    note?: string;
    createdAt: number;
    updatedAt: number;
}

export interface AddressBookState {
    entries: AddressBookEntry[];
}
