import { Translation } from '@suite/intl';
import { Button, Column, Icon, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

type AddressBookEmptyStateProps = {
    onAddContact: () => void;
};

export const AddressBookEmptyState = ({ onAddContact }: AddressBookEmptyStateProps) => (
    <Column alignItems="center" gap={spacings.md} margin={{ top: spacings.xxxl }}>
        <Icon name="bookOpenText" size={48} />
        <Column alignItems="center" gap={spacings.xs}>
            <Text typographyStyle="titleSmall">
                <Translation id="TR_ADDRESS_BOOK_EMPTY_TITLE" />
            </Text>
            <Text typographyStyle="body" color="textSubdued">
                <Translation id="TR_ADDRESS_BOOK_EMPTY_DESCRIPTION" />
            </Text>
        </Column>
        <Button onClick={onAddContact} icon="plus" data-testid="@address-book/add-contact-empty">
            <Translation id="TR_ADD_CONTACT" />
        </Button>
    </Column>
);
