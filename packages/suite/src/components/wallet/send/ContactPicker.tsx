import { useState } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Dropdown, Input, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { selectAddressBookEntriesByCoin } from 'src/selectors/addressBookSelectors';
import { type AddressBookEntry } from 'src/types/addressBook';

type ContactPickerProps = {
    coin: NetworkSymbol;
    onSelect: (entry: AddressBookEntry) => void;
};

const truncate = (str: string, len = 12) =>
    str.length > len ? `${str.slice(0, 6)}…${str.slice(-6)}` : str;

export const ContactPicker = ({ coin, onSelect }: ContactPickerProps) => {
    const entries = useSelector(state => selectAddressBookEntriesByCoin(state, coin));
    const [search, setSearch] = useState('');

    if (entries.length === 0) return null;

    const filtered = entries.filter(e => {
        const q = search.toLowerCase();

        return e.label.toLowerCase().includes(q) || e.address.toLowerCase().includes(q);
    });

    return (
        <Dropdown
            iconName="addressBook"
            iconSize="small"
            data-testid="@send/address-book-picker"
            items={[
                {
                    key: 'search',
                    label: (
                        <Input
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search contacts"
                            data-testid="@contact-picker/search"
                        />
                    ),
                    onClick: () => {},
                    closeOnClick: false,
                },
                ...(filtered.length > 0
                    ? filtered.map(entry => ({
                          key: entry.id,
                          label: (
                              <Column gap={spacings.xxxs}>
                                  <Text typographyStyle="highlight">{entry.label}</Text>
                                  <Text typographyStyle="hint" color="textSubdued">
                                      {truncate(entry.address)}
                                  </Text>
                              </Column>
                          ),
                          onClick: () => onSelect(entry),
                      }))
                    : [
                          {
                              key: 'empty',
                              label: (
                                  <Text typographyStyle="hint" color="textSubdued">
                                      No contacts found
                                  </Text>
                              ),
                              onClick: () => {},
                          },
                      ]),
            ]}
        />
    );
};
