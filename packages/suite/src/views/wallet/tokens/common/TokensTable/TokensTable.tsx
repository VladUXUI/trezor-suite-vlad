import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    type EnhancedTokenInfo,
    type TokenManagementAction,
} from '@suite-common/token-definitions';
import { tradingThunks } from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Card, Paragraph, Table } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

import { TokenRow } from './TokenRow';
import type { TokensTableType } from './types';
import { DropdownRow } from '../../DropdownRow';

const NoSearchResults = () => (
    <Paragraph margin={{ top: spacings.xxl, bottom: spacings.xxl }} align="center">
        <Translation id="TR_NO_SEARCH_RESULTS" />
    </Paragraph>
);

export const NoSearchResultsWrapped = () => (
    <Card paddingType="none" overflow="hidden">
        <NoSearchResults />
    </Card>
);

interface TokensTableProps {
    type?: TokensTableType;
    account: Account;
    tokensWithBalance: EnhancedTokenInfo[];
    tokensWithoutBalance: EnhancedTokenInfo[];
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    searchQuery?: string;
    isUnverifiedTable?: boolean;
    yieldOpportunities?: YieldDto[];
    /**
     * Forwarded to each row's `AssetLogo`. Set when the surrounding view
     * mixes tokens from multiple chains (the chain-agnostic address page).
     */
    showNetworkIcon?: boolean;
}

export const TokensTable = ({
    type = 'default',
    account,
    tokensWithBalance,
    tokensWithoutBalance,
    network,
    tokenStatusType,
    hideRates,
    searchQuery,
    isUnverifiedTable,
    yieldOpportunities,
    showNetworkIcon,
}: TokensTableProps) => {
    const dispatch = useDispatch();
    const [isZeroBalanceOpen, setIsZeroBalanceOpen] = useState(false);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'buy' }));
    }, [dispatch]);

    return (
        <Card paddingType="none">
            {tokensWithBalance.length === 0 && tokensWithoutBalance.length === 0 && searchQuery ? (
                <NoSearchResults />
            ) : (
                <Table
                    margin={{ top: spacings.xs }}
                    colWidths={[
                        { minWidth: '200px', maxWidth: '250px' },
                        { minWidth: '140px', maxWidth: '250px' }, // due to HiddenPlaceholder - it changes content width when hovered
                    ]}
                    isRowHighlightedOnHover
                >
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="TR_TOKEN" />
                            </Table.Cell>
                            <Table.Cell colSpan={hideRates ? 2 : 1}>
                                <Translation id="TR_VALUES" />
                            </Table.Cell>
                            {!hideRates && (
                                <>
                                    <Table.Cell align="end">
                                        <Translation id="TR_EXCHANGE_RATE" />
                                    </Table.Cell>
                                    {type !== 'defi' && (
                                        <Table.Cell colSpan={2}>
                                            <Translation id="TR_7D_CHANGE" />
                                        </Table.Cell>
                                    )}
                                </>
                            )}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tokensWithBalance.map(token => (
                            <TokenRow
                                type={type}
                                key={token.contract}
                                token={token}
                                account={account}
                                network={network}
                                tokenStatusType={tokenStatusType}
                                isUnverifiedTable={isUnverifiedTable}
                                hideRates={hideRates}
                                yieldOpportunities={yieldOpportunities}
                                showNetworkIcon={showNetworkIcon}
                            />
                        ))}
                        {tokensWithoutBalance.length !== 0 && (
                            <>
                                <Table.Row onClick={() => setIsZeroBalanceOpen(!isZeroBalanceOpen)}>
                                    <Table.Cell colSpan={1}>
                                        <DropdownRow
                                            isActive={isZeroBalanceOpen}
                                            text="ZERO_BALANCE_TOKENS"
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        />
                                    </Table.Cell>
                                    <Table.Cell colSpan={hideRates ? 2 : 4} />
                                </Table.Row>
                                {tokensWithoutBalance.map(token => (
                                    <TokenRow
                                        type={type}
                                        key={token.contract}
                                        token={token}
                                        account={account}
                                        network={network}
                                        tokenStatusType={tokenStatusType}
                                        isUnverifiedTable={isUnverifiedTable}
                                        hideRates={hideRates}
                                        isCollapsed={!isZeroBalanceOpen}
                                        yieldOpportunities={yieldOpportunities}
                                        showNetworkIcon={showNetworkIcon}
                                    />
                                ))}
                            </>
                        )}
                    </Table.Body>
                </Table>
            )}
        </Card>
    );
};
