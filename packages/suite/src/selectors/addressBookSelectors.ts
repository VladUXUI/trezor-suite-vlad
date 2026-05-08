import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type AppState } from 'src/types/suite';

export const selectAllAddressBookEntries = (state: AppState) => state.addressBook.entries;

export const selectAddressBookEntriesByCoin = (state: AppState, coin: NetworkSymbol) =>
    state.addressBook.entries.filter(e => e.coin === coin);

export const selectAddressBookEntryByAddress = (state: AppState, address: string) =>
    state.addressBook.entries.find(e => e.address.toLowerCase() === address.toLowerCase());
