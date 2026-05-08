import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { Badge, Card, Column, IconButton, Row, Text } from '@trezor/components';

import { type AddressBookEntry } from 'src/types/addressBook';

type AddressBookRowProps = {
    entry: AddressBookEntry;
    onEdit: (entry: AddressBookEntry) => void;
    onDelete: (entry: AddressBookEntry) => void;
};

const truncateAddress = (address: string) =>
    address.length > 20 ? `${address.slice(0, 10)}…${address.slice(-10)}` : address;

export const AddressBookRow = ({ entry, onEdit, onDelete }: AddressBookRowProps) => {
    const network = getNetwork(entry.coin);

    return (
        <Card paddingType="small">
            <Row justifyContent="space-between" alignItems="center">
                <Column gap={16} flex="1" overflow="hidden">
                    <Row gap={8} alignItems="center">
                        <Text typographyStyle="body-md">{entry.label}</Text>
                        <Badge size="small">{network?.name ?? entry.coin.toUpperCase()}</Badge>
                    </Row>
                    <Column gap={4}>
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            {truncateAddress(entry.address)}
                        </Text>
                        {entry.note && (
                            <Text typographyStyle="body-sm" color="contentSecondary">
                                {entry.note}
                            </Text>
                        )}
                    </Column>
                </Column>
                <Row gap={8}>
                    <IconButton
                        icon="pencil"
                        size="small"
                        priority="secondary"
                        intent="neutral"
                        onClick={() => onEdit(entry)}
                        data-testid={`@address-book/edit/${entry.id}`}
                        label={<Translation id="TR_EDIT_CONTACT" />}
                    />
                    <IconButton
                        icon="trash"
                        size="small"
                        priority="secondary"
                        intent="neutral"
                        onClick={() => onDelete(entry)}
                        data-testid={`@address-book/delete/${entry.id}`}
                        label={<Translation id="TR_DELETE_CONTACT" />}
                    />
                </Row>
            </Row>
        </Card>
    );
};
