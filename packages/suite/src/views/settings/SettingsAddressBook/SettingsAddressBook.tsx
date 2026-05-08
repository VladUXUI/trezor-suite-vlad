import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Button, Card, Column, Input } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAllAddressBookEntries } from 'src/selectors/addressBookSelectors';
import { type AddressBookEntry } from 'src/types/addressBook';

import { AddressBookEmptyState } from './AddressBookEmptyState';
import { AddressBookRow } from './AddressBookRow';

export const SettingsAddressBook = () => {
    const dispatch = useDispatch();
    const entries = useSelector(selectAllAddressBookEntries);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return entries;

        return entries.filter(
            e => e.label.toLowerCase().includes(q) || e.address.toLowerCase().includes(q),
        );
    }, [entries, search]);

    const handleAdd = () => dispatch(openModal({ type: 'add-contact' }));

    const handleEdit = (entry: AddressBookEntry) =>
        dispatch(openModal({ type: 'add-contact', prefill: entry }));

    const handleDelete = (entry: AddressBookEntry) =>
        dispatch(openModal({ type: 'delete-contact', id: entry.id, label: entry.label }));

    return (
        <SettingsLayout data-testid="@settings/address-book">
            <Column gap={40}>
                <Card>
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_ADDRESS_BOOK" />}
                            description={<Translation id="TR_ADDRESS_BOOK_DESCRIPTION" />}
                        />
                        <ActionColumn>
                            <Button
                                onClick={handleAdd}
                                iconLeft="plus"
                                data-testid="@address-book/add-contact"
                            >
                                <Translation id="TR_ADD_CONTACT" />
                            </Button>
                        </ActionColumn>
                    </SectionItem>
                </Card>

                <Column gap={16}>
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or address"
                        innerAddonAlign="left"
                        data-testid="@address-book/search"
                        size="small"
                    />

                    {entries.length === 0 ? (
                        <AddressBookEmptyState onAddContact={handleAdd} />
                    ) : (
                        <Column gap={8}>
                            {filtered.map(entry => (
                                <AddressBookRow
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </Column>
                    )}
                </Column>
            </Column>
        </SettingsLayout>
    );
};
