import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Button, Modal, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { deleteAddressBookEntryThunk } from 'src/actions/suite/addressBookThunks';
import { useDispatch } from 'src/hooks/suite';

type DeleteContactModalProps = Omit<
    Extract<UserContextPayload, { type: 'delete-contact' }>,
    'type'
> & {
    onCancel: () => void;
};

export const DeleteContactModal = ({ id, label, onCancel }: DeleteContactModalProps) => {
    const dispatch = useDispatch();

    const handleDelete = () => {
        dispatch(deleteAddressBookEntryThunk(id));
        dispatch(closeModal());
    };

    const handleCancel = () => {
        dispatch(closeModal());
        onCancel();
    };

    return (
        <Modal
            heading={<Translation id="TR_DELETE_CONTACT" />}
            onCancel={handleCancel}
            bottomContent={
                <Row gap={spacings.sm} justifyContent="flex-end">
                    <Button variant="tertiary" onClick={handleCancel}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        data-testid="@delete-contact/confirm"
                    >
                        <Translation id="TR_DELETE_CONTACT" />
                    </Button>
                </Row>
            }
        >
            <Paragraph>
                <Translation id="TR_DELETE_CONTACT_CONFIRM" values={{ label }} />
            </Paragraph>
        </Modal>
    );
};
