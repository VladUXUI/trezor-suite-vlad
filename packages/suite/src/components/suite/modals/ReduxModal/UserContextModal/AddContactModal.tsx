import { useState } from 'react';

import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';
import { networks } from '@suite-common/wallet-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAddressValid } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Input, Modal, Select, Textarea } from '@trezor/components';

import {
    addAddressBookEntryThunk,
    updateAddressBookEntryThunk,
} from 'src/actions/suite/addressBookThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAddressBookEntryByAddress } from 'src/selectors/addressBookSelectors';

type AddContactModalProps = Omit<Extract<UserContextPayload, { type: 'add-contact' }>, 'type'> & {
    onCancel: () => void;
};

const LABEL_MAX = 50;
const NOTE_MAX = 200;

const networkOptions = Object.entries(networks).map(([symbol, network]) => ({
    label: network.name,
    value: symbol as NetworkSymbol,
}));

export const AddContactModal = ({ prefill, onCancel }: AddContactModalProps) => {
    const dispatch = useDispatch();
    const isEditing = !!prefill?.id;

    const [label, setLabel] = useState(prefill?.label ?? '');
    const [address, setAddress] = useState(prefill?.address ?? '');
    const [coin, setCoin] = useState<NetworkSymbol | undefined>(
        prefill?.coin ? (prefill.coin as NetworkSymbol) : undefined,
    );
    const [note, setNote] = useState(prefill?.note ?? '');
    const [addressError, setAddressError] = useState('');
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);

    const existingEntry = useSelector(state =>
        address ? selectAddressBookEntryByAddress(state, address) : undefined,
    );

    const isDuplicate = !!existingEntry && (!isEditing || existingEntry.id !== prefill?.id);

    const validateAddress = (value: string, symbol?: NetworkSymbol) => {
        if (!value) return;
        if (!symbol) {
            setAddressError('');

            return;
        }
        if (!isAddressValid(value, symbol)) {
            setAddressError('Invalid address for selected network');
        } else {
            setAddressError('');
        }
    };

    const handleAddressBlur = () => validateAddress(address, coin);

    const isFormValid =
        label.trim().length > 0 &&
        label.trim().length <= LABEL_MAX &&
        address.trim().length > 0 &&
        !addressError &&
        !!coin &&
        (!isDuplicate || ignoreDuplicate);

    const handleSave = () => {
        if (isDuplicate && !ignoreDuplicate) {
            setShowDuplicateWarning(true);

            return;
        }
        if (isEditing && prefill?.id) {
            dispatch(
                updateAddressBookEntryThunk({
                    id: prefill.id,
                    changes: { label: label.trim(), address: address.trim(), note: note.trim() },
                }),
            );
        } else {
            dispatch(
                addAddressBookEntryThunk({
                    label: label.trim(),
                    address: address.trim(),
                    coin: coin!,
                    note: note.trim() || undefined,
                }),
            );
        }
        dispatch(closeModal());
    };

    const handleClose = () => {
        dispatch(closeModal());
        onCancel();
    };

    return (
        <Modal
            heading={<Translation id={isEditing ? 'TR_EDIT_CONTACT' : 'TR_ADD_CONTACT'} />}
            onCancel={handleClose}
            bottomContent={
                <Button onClick={handleSave} isDisabled={!isFormValid} isFullWidth>
                    <Translation id={isEditing ? 'TR_SAVE' : 'TR_ADD_CONTACT'} />
                </Button>
            }
        >
            <Column gap={16}>
                {showDuplicateWarning && !ignoreDuplicate && (
                    <Banner
                        variant="warning"
                        rightContent={
                            <Button
                                variant="tertiary"
                                size="small"
                                onClick={() => setIgnoreDuplicate(true)}
                            >
                                Save anyway
                            </Button>
                        }
                    >
                        <Translation
                            id="TR_ADDRESS_BOOK_DUPLICATE_WARNING"
                            values={{ label: existingEntry?.label ?? '' }}
                        />
                    </Banner>
                )}
                <Input
                    label={<Translation id="TR_CONTACT_LABEL" />}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    maxLength={LABEL_MAX}
                    data-testid="@add-contact/label"
                />
                <Select
                    label={<Translation id="TR_CONTACT_NETWORK" />}
                    options={networkOptions}
                    value={networkOptions.find(o => o.value === coin) ?? null}
                    onChange={option => {
                        setCoin(option?.value);
                        if (address) validateAddress(address, option?.value);
                    }}
                    data-testid="@add-contact/network"
                />
                <Input
                    label={<Translation id="TR_CONTACT_ADDRESS" />}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    onBlur={handleAddressBlur}
                    inputState={addressError ? 'error' : undefined}
                    bottomText={addressError || undefined}
                    data-testid="@add-contact/address"
                />
                <Textarea
                    label={<Translation id="TR_CONTACT_NOTE" />}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    maxLength={NOTE_MAX}
                    rows={3}
                    data-testid="@add-contact/note"
                />
            </Column>
        </Modal>
    );
};
