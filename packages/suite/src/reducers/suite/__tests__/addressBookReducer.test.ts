import { type ExtraDependenciesForReducer } from '@suite-common/redux-utils';

import { addressBookSlice } from '../addressBookReducer';

const emptyExtraDeps = {
    actionTypes: {} as any,
    actions: {} as any,
    reducers: {} as any,
} satisfies ExtraDependenciesForReducer;

const reducer = addressBookSlice.prepareReducer(emptyExtraDeps);

const mockEntry = {
    id: 'entry-1',
    label: 'Alice',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf',
    coin: 'btc' as const,
    createdAt: 1000,
    updatedAt: 1000,
};

describe('addressBookReducer', () => {
    it('returns empty entries as initial state', () => {
        const state = reducer(undefined, { type: '@@INIT' } as any);
        expect(state.entries).toEqual([]);
    });

    it('addEntry appends a new contact', () => {
        const state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toEqual(mockEntry);
    });

    it('addEntry appends multiple contacts independently', () => {
        const second = { ...mockEntry, id: 'entry-2', label: 'Bob' };
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(state, addressBookSlice.actions.addEntry(second));
        expect(state.entries).toHaveLength(2);
    });

    it('updateEntry changes label, address, and note', () => {
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(
            state,
            addressBookSlice.actions.updateEntry({
                id: 'entry-1',
                changes: { label: 'Alice Updated', note: 'cold wallet' },
            }),
        );
        expect(state.entries[0].label).toBe('Alice Updated');
        expect(state.entries[0].note).toBe('cold wallet');
        expect(state.entries[0].address).toBe(mockEntry.address);
    });

    it('updateEntry updates updatedAt timestamp', () => {
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        const before = Date.now();
        state = reducer(
            state,
            addressBookSlice.actions.updateEntry({ id: 'entry-1', changes: { label: 'New' } }),
        );
        expect(state.entries[0].updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('updateEntry does nothing for unknown id', () => {
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(
            state,
            addressBookSlice.actions.updateEntry({ id: 'unknown', changes: { label: 'X' } }),
        );
        expect(state.entries[0].label).toBe(mockEntry.label);
    });

    it('deleteEntry removes the matching contact', () => {
        const second = { ...mockEntry, id: 'entry-2', label: 'Bob' };
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(state, addressBookSlice.actions.addEntry(second));
        state = reducer(state, addressBookSlice.actions.deleteEntry('entry-1'));
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0].id).toBe('entry-2');
    });

    it('deleteEntry does nothing for unknown id', () => {
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(state, addressBookSlice.actions.deleteEntry('unknown'));
        expect(state.entries).toHaveLength(1);
    });

    it('loadEntries replaces all existing entries', () => {
        const loaded = [
            { ...mockEntry, id: 'loaded-1' },
            { ...mockEntry, id: 'loaded-2', coin: 'eth' as const },
        ];
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(state, addressBookSlice.actions.loadEntries(loaded));
        expect(state.entries).toHaveLength(2);
        expect(state.entries[0].id).toBe('loaded-1');
        expect(state.entries[1].id).toBe('loaded-2');
    });

    it('loadEntries with empty array clears all entries', () => {
        let state = reducer(undefined, addressBookSlice.actions.addEntry(mockEntry));
        state = reducer(state, addressBookSlice.actions.loadEntries([]));
        expect(state.entries).toHaveLength(0);
    });
});
