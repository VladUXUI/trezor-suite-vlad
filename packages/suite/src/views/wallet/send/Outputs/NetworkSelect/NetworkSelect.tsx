import { useState } from 'react';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Card, Column, IconButton, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useSendFormContext } from 'src/hooks/wallet';

import { NetworkSelectModal } from './NetworkSelectModal';

export const NetworkSelect = () => {
    const { account } = useSendFormContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {isModalOpen && (
                <NetworkSelectModal account={account} onClose={() => setIsModalOpen(false)} />
            )}

            <Card fillType="default" paddingType="normal" onClick={() => setIsModalOpen(true)}>
                <Column gap={spacings.xs}>
                    Network
                    <Row justifyContent="space-between">
                        <Row justifyContent="flex-start" gap={spacings.sm}>
                            <CoinLogo symbol={account.symbol} size={36} type="network" />
                            <Text intent="neutral" typographyStyle="body-md">
                                {getNetworkDisplaySymbolName(account.symbol)}
                            </Text>
                        </Row>
                        <IconButton icon="caretDown" intent="neutral" priority="secondary" />
                    </Row>
                </Column>
            </Card>
        </>
    );
};
