import { useMemo } from 'react';
import { FormattedDate } from 'react-intl';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getNetwork, networks } from '@suite-common/wallet-config';
import {
    type AddressTransaction,
    selectAddressTransactions,
    selectBaseCurrency,
    selectHistoricFiatRates,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    groupTransactionsByDate,
    isPending,
    parseTransactionDateKey,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { Card, Column, Grid, Row, Text } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';
import { arrayPartition } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { HiddenPlaceholder } from 'src/components/suite';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';

type AggregatedTransactionListProps = {
    accounts: Account[];
    descriptor: string;
    deviceState: ReturnType<() => Account['deviceState']>;
};

/**
 * Renders one row per merged transaction. The existing `TransactionItem`
 * already shows the source chain's logo via the `network` prop, so each row
 * naturally surfaces which chain it came from once we feed it the right
 * `sourceAccount`. We re-key by `${chainSymbol}:${txid}` because the same txid
 * could in principle appear on multiple chains (rare but possible across
 * forks); per-chain keying avoids React diff confusion.
 */
const renderTransactionRow = (transaction: AddressTransaction, index: number) => {
    const network = getNetwork(transaction.sourceAccount.symbol);

    return (
        <TransactionItem
            key={`${transaction.sourceAccount.symbol}:${transaction.txid}`}
            transaction={transaction}
            isPending={isPending(transaction)}
            accountKey={transaction.sourceAccount.key}
            network={network}
            accountType={transaction.sourceAccount.accountType}
            index={index}
            // Bump-fee on a multi-chain merged list is fiddly (the lowest-nonce
            // calculation is per-chain). Disable it in the aggregate view; users
            // who need to bump can switch to the chain-specific view via the
            // address switcher. This keeps the merged feed read-only-ish for v1.
            disableBumpFee={true}
        />
    );
};

/**
 * A simplified day header for the merged feed. The original `DayHeader`
 * assumes a single chain (it shows a per-day crypto sum like "+0.5 ETH"), but
 * a chain-agnostic feed mixes ETH from mainnet with ETH from Arbitrum etc. —
 * a single number wouldn't be meaningful. We surface only the date + per-day
 * fiat sum here, which *is* meaningful (rates resolve per-tx, then add up).
 */
const AggregatedDayHeader = ({
    dateKey,
    transactions,
}: {
    dateKey: string;
    transactions: WalletAccountTransaction[];
}) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const parsedDate = parseTransactionDateKey(dateKey);
    const isDateValid = !isNaN(parsedDate.getTime());
    const totalFiat = sumTransactionsFiat(transactions, baseCurrencyCode, historicFiatRates);

    return (
        <Grid columns="1fr max-content" columnGap={24} flex="1">
            <Text typographyStyle="body-sm-strong" intent="neutral" priority="secondary" as="div">
                {isDateValid && (
                    <FormattedDate value={parsedDate} day="numeric" month="long" year="numeric" />
                )}
            </Text>
            {!totalFiat.isZero() && (
                <HiddenPlaceholder>
                    <Text
                        typographyStyle="body-sm-strong"
                        intent="neutral"
                        priority="secondary"
                        as="div"
                    >
                        <BaseCurrencyAmountFormatter
                            value={totalFiat}
                            currency={baseCurrencyCode.toUpperCase()}
                        />
                    </Text>
                </HiddenPlaceholder>
            )}
        </Grid>
    );
};

/**
 * Chain-agnostic transaction list for an aggregated address view. Pulls the
 * merged transactions from `selectAddressTransactions` (already sorted by
 * `blockTime` desc, with each entry tagged by its source sub-account), groups
 * them by date, and renders each row through the existing `TransactionItem`
 * keyed to the source chain.
 *
 * Pagination caveat: the underlying per-account fetcher
 * (`useVisibleTransactions`) is account-keyed and can't cleanly stream a
 * cross-account merged page. For v1 we render *whatever's already cached* in
 * Redux for the sibling accounts — that's typically the first page that the
 * sidebar/wallet view loaded earlier. If a user wants deeper history they can
 * still drop into the per-chain view via the address switcher. A proper
 * cross-chain paginator is a follow-up.
 */
export const AggregatedTransactionList = ({
    accounts,
    descriptor,
    deviceState,
}: AggregatedTransactionListProps) => {
    const transactions = useSelector(state =>
        selectAddressTransactions(state, descriptor, deviceState),
    );

    const [pendingTxs, confirmedTxs] = useMemo(
        () => arrayPartition(transactions, isPending),
        [transactions],
    );

    const confirmedByDate = useMemo(
        () => groupTransactionsByDate(confirmedTxs, 'day'),
        [confirmedTxs],
    );

    const hasAnyTransactions = pendingTxs.length > 0 || confirmedTxs.length > 0;

    return (
        <DashboardSection
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            data-testid="@wallet/accounts/aggregated-transaction-list"
        >
            <Column gap={32} padding={{ top: 16 }}>
                {!hasAnyTransactions ? (
                    <Card>
                        <Column alignItems="center">
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_NO_VISIBLE_TRANSACTIONS" />
                            </Text>
                            <Row gap={6} alignItems="center" margin={{ top: 8 }}>
                                <Text
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id="TR_ADDRESS_BALANCE_ACROSS_CHAINS"
                                        values={{ count: accounts.length }}
                                    />
                                </Text>
                                <Row gap={2} alignItems="center">
                                    {accounts.map(a => (
                                        <NetworkIcon
                                            key={a.symbol}
                                            networkSymbol={a.symbol}
                                            size={14}
                                        />
                                    ))}
                                </Row>
                            </Row>
                        </Column>
                    </Card>
                ) : (
                    <Column gap={40}>
                        {pendingTxs.length > 0 && (
                            <Column gap={16}>
                                <PendingGroupHeader txsCount={pendingTxs.length} />
                                {pendingTxs.map(renderTransactionRow)}
                            </Column>
                        )}
                        {Object.entries(confirmedByDate).map(([dateKey, txs]) => (
                            <Column gap={10} key={dateKey}>
                                <AggregatedDayHeader
                                    dateKey={dateKey}
                                    transactions={txs as WalletAccountTransaction[]}
                                />
                                <Column gap={16}>
                                    {(txs as AddressTransaction[]).map(renderTransactionRow)}
                                </Column>
                            </Column>
                        ))}
                    </Column>
                )}
            </Column>
        </DashboardSection>
    );
};

// Helper for the parent so we don't leak `networks` import everywhere.
export const getAggregatedNetworkNames = (accounts: Account[]) =>
    accounts.map(a => networks[a.symbol]?.name ?? a.symbol).join(', ');
