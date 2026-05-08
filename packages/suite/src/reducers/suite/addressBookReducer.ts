import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

import { type AddressBookEntry, type AddressBookState } from 'src/types/addressBook';

const initialState: AddressBookState = {
    entries: [],
};

export const addressBookSlice = createSliceWithExtraDeps({
    name: 'addressBook',
    initialState,
    reducers: {
        addEntry: (state, { payload }: PayloadAction<AddressBookEntry>) => {
            state.entries.push(payload);
        },
        updateEntry: (
            state,
            {
                payload,
            }: PayloadAction<{
                id: string;
                changes: Partial<Pick<AddressBookEntry, 'label' | 'address' | 'note'>>;
            }>,
        ) => {
            const entry = state.entries.find(e => e.id === payload.id);
            if (entry) {
                Object.assign(entry, payload.changes, { updatedAt: Date.now() });
            }
        },
        deleteEntry: (state, { payload }: PayloadAction<string>) => {
            state.entries = state.entries.filter(e => e.id !== payload);
        },
        loadEntries: (state, { payload }: PayloadAction<AddressBookEntry[]>) => {
            state.entries = payload;
        },
    },
    extraReducers: () => {},
});

export const { addEntry, updateEntry, deleteEntry, loadEntries } = addressBookSlice.actions;
