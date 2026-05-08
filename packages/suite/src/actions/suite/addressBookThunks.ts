import { createThunk } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { selectAllAddressBookEntries } from 'src/selectors/addressBookSelectors';
import { type AddressBookEntry } from 'src/types/addressBook';

import {
    addEntry,
    deleteEntry,
    loadEntries,
    updateEntry,
} from '../../reducers/suite/addressBookReducer';

const ADDRESS_BOOK_PREFIX = '@suite/addressBook';

const persistEntries = (entries: AddressBookEntry[]) => {
    if (desktopApi.available) {
        desktopApi.setAddressBookEntries(entries);
    }
};

export const initAddressBookThunk = createThunk(
    `${ADDRESS_BOOK_PREFIX}/init`,
    async (_args, { dispatch }) => {
        if (!desktopApi.available) return;
        const entries = await desktopApi.getAddressBookEntries();
        dispatch(loadEntries(entries));
    },
);

export const addAddressBookEntryThunk = createThunk(
    `${ADDRESS_BOOK_PREFIX}/add`,
    (entry: Omit<AddressBookEntry, 'id' | 'createdAt' | 'updatedAt'>, { dispatch, getState }) => {
        const newEntry: AddressBookEntry = {
            ...entry,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        dispatch(addEntry(newEntry));
        persistEntries(selectAllAddressBookEntries(getState()));
    },
);

export const updateAddressBookEntryThunk = createThunk(
    `${ADDRESS_BOOK_PREFIX}/update`,
    (
        payload: {
            id: string;
            changes: Partial<Pick<AddressBookEntry, 'label' | 'address' | 'note'>>;
        },
        { dispatch, getState },
    ) => {
        dispatch(updateEntry(payload));
        persistEntries(selectAllAddressBookEntries(getState()));
    },
);

export const deleteAddressBookEntryThunk = createThunk(
    `${ADDRESS_BOOK_PREFIX}/delete`,
    (id: string, { dispatch, getState }) => {
        dispatch(deleteEntry(id));
        persistEntries(selectAllAddressBookEntries(getState()));
    },
);
