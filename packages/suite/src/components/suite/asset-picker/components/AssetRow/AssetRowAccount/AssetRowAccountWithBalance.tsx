import { getDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo, NetworkIcon } from '@trezor/product-components';

import { ItemClickableContainer } from '../ItemClickableContainer';
import { AccountAmount } from './AccountAmount';
import { AggregatedAccountAmount } from './AggregatedAccountAmount';

export type AssetRowAccountWithBalanceProps = {
    account: Account;
    /** All sibling EVM sub-accounts sharing the same address. When provided and >1, renders chain icons and aggregated fiat. */
    siblingAccounts?: Account[];
    dataTestId?: string;
    onClick: (account: Account) => void;
};

export function AssetRowAccountWithBalance({
    dataTestId,
    account,
    siblingAccounts,
    onClick,
}: AssetRowAccountWithBalanceProps) {
    const isEvmGroup = siblingAccounts && siblingAccounts.length > 1;

    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <CoinLogo symbol={account.symbol} size={40} type="tokenWithNetwork" />
                <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
                    <Row gap={6} alignItems="center" overflow="hidden">
                        <Text typographyStyle="body-md" ellipsisLineCount={1} maxWidth="100%">
                            {getNetworkDisplaySymbolName(account.symbol)}
                        </Text>
                        {isEvmGroup && (
                            <Row gap={2} alignItems="center">
                                {siblingAccounts.map(a => (
                                    <NetworkIcon
                                        key={a.symbol}
                                        networkSymbol={a.symbol}
                                        size={12}
                                    />
                                ))}
                            </Row>
                        )}
                    </Row>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        {getDisplaySymbol(account.symbol)}
                    </Text>
                </Column>
            </Row>
            {isEvmGroup ? (
                <AggregatedAccountAmount accounts={siblingAccounts} />
            ) : (
                <AccountAmount account={account} />
            )}
        </ItemClickableContainer>
    );
}
