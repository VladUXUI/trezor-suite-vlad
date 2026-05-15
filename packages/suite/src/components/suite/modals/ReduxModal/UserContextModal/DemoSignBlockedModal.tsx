import { closeModal } from '@suite/modal';
import { Column, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

export const DemoSignBlockedModal = () => {
    const dispatch = useDispatch();
    const onCancel = () => dispatch(closeModal());

    return (
        <Modal
            data-testid="@demo-sign-blocked"
            intent="brand"
            onCancel={onCancel}
            heading="Demo mode"
            bottomContent={
                <Modal.Button onClick={onCancel} data-testid="@demo-sign-blocked/close">
                    Got it
                </Modal.Button>
            }
        >
            <Column gap={spacings.md}>
                <Paragraph>
                    This is a demo build of Trezor Suite running without a connected device. In a
                    real session, your Trezor would have prompted you to confirm and sign the
                    transaction here.
                </Paragraph>
                <Paragraph>No funds were moved, no signature was produced.</Paragraph>
            </Column>
        </Modal>
    );
};
