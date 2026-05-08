import { type AddressBookEntry } from 'src/types/addressBook';

import {
    selectAddressBookEntriesByCoin,
    selectAddressBookEntryByAddress,
    selectAllAddressBookEntries,
} from '../addressBookSelectors';

const makeState = (entries: AddressBookEntry[]) => ({ addressBook: { entries } }) as any;

const btcEntry: AddressBookEntry = {
    id: '1',
    label: 'Alice',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf',
    coin: 'btc',
    createdAt: 1000,
    updatedAt: 1000,
};

const ethEntry: AddressBookEntry = {
    id: '2',
    label: 'Bob',
    address: '0xAbCd1234567890abcdef1234567890ABCDEF1234',
    coin: 'eth',
    createdAt: 2000,
    updatedAt: 2000,
};

const btcEntry2: AddressBookEntry = {
    id: '3',
    label: 'Carol',
    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    coin: 'btc',
    createdAt: 3000,
    updatedAt: 3000,
};

describe('selectAllAddressBookEntries', () => {
    it('returns empty array when no entries', () => {
        expect(selectAllAddressBookEntries(makeState([]))).toEqual([]);
    });

    it('returns all entries regardless of coin', () => {
        const entries = [btcEntry, ethEntry, btcEntry2];
        expect(selectAllAddressBookEntries(makeState(entries))).toHaveLength(3);
    });
});

describe('selectAddressBookEntriesByCoin', () => {
    const state = makeState([btcEntry, ethEntry, btcEntry2]);

    it('returns only btc entries', () => {
        const result = selectAddressBookEntriesByCoin(state, 'btc');
        expect(result).toHaveLength(2);
        expect(result.every(e => e.coin === 'btc')).toBe(true);
    });

    it('returns only eth entries', () => {
        const result = selectAddressBookEntriesByCoin(state, 'eth');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    it('returns empty array for coin with no entries', () => {
        const result = selectAddressBookEntriesByCoin(state, 'ltc');
        expect(result).toHaveLength(0);
    });
});

describe('selectAddressBookEntryByAddress', () => {
    const state = makeState([btcEntry, ethEntry]);

    it('finds entry by exact address', () => {
        const result = selectAddressBookEntryByAddress(state, btcEntry.address);
        expect(result?.id).toBe('1');
    });

    it('finds entry case-insensitively', () => {
        const result = selectAddressBookEntryByAddress(state, ethEntry.address.toLowerCase());
        expect(result?.id).toBe('2');
    });

    it('returns undefined for unknown address', () => {
        expect(selectAddressBookEntryByAddress(state, '0x000')).toBeUndefined();
    });

    it('returns undefined when entries are empty', () => {
        expect(selectAddressBookEntryByAddress(makeState([]), btcEntry.address)).toBeUndefined();
    });
});
