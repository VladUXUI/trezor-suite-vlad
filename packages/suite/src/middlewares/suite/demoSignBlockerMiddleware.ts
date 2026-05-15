import type { MiddlewareAPI } from 'redux';

import { openModal } from '@suite/modal';

import type { Action, AppState, Dispatch } from 'src/types/suite';

// Sign / address-verify actions that would dispatch real TrezorConnect calls.
// We short-circuit them and pop the "demo mode" modal instead.
const SIGN_BLOCKED_SUBSTRINGS = [
    '/signTransactionThunk/',
    '/pushSendFormTransactionThunk/',
    '/pushSendFormRawTransactionThunk/',
    '/confirmAddressOnDeviceThunk/',
    '/stakeFormEthereum',
    '/stablecoinYieldApprovalThunks/signAndPushApproveTransactionThunk/',
];

// Background read-only sync actions. These call TrezorConnect.getAccountInfo
// or hit public APIs and on /fulfilled overwrite our seeded state with empty
// real-chain data. Silently kill them. NOTE: the strings here are the actual
// action types emitted at runtime — they do NOT always match the thunk's
// exported variable name (e.g. updateFiatRatesThunk → "/updateFiatRates",
// updateTxsFiatRatesThunk → "/updateTxsRates").
const SILENT_BLOCKED_SUBSTRINGS = [
    // accounts
    '@common/wallet-core/accounts/fetchAndUpdateAccountThunk',
    '@common/wallet-core/accounts/reportWalletBalance',
    // blockchain — any of these end up firing account/tx fetches via TrezorConnect
    '@common/wallet-core/blockchain/syncAccountsThunk',
    '@common/wallet-core/blockchain/subscribeBlockchainThunk',
    '@common/wallet-core/blockchain/onBlockchainConnectThunk',
    '@common/wallet-core/blockchain/onBlockMinedThunk',
    '@common/wallet-core/blockchain/onNotificationThunk',
    '@common/wallet-core/blockchain/onBlockchainDisconnectThunk',
    '@common/wallet-core/blockchain/initBlockchainThunk',
    '@common/wallet-core/blockchain/reconnectBlockchainThunk',
    // fiat rates
    '@common/wallet-core/fiat-rates/updateFiatRates',
    '@common/wallet-core/fiat-rates/updateTxsRates',
    '@common/wallet-core/fiat-rates/updateMissingTxRates',
    '@common/wallet-core/fiat-rates/fetchFiatRates',
    '@common/wallet-core/fiat-rates/periodicFetchFiatRates',
    // transactions
    '@common/wallet-core/transactions/fetchTransactionsPageThunk',
    '@common/wallet-core/transactions/fetchAllTransactionsForAccountThunk',
    '@common/wallet-core/transactions/replaceTransactionThunk',
];

// Bare action types that the reducer treats as a full account/discovery
// replacement. These are not thunks (no /pending suffix) — RTK createAction
// strings. Blocking them keeps our seeded data intact.
const ACCOUNT_MUTATION_TYPES = new Set([
    '@common/wallet-core/accounts/createAccount',
    '@common/wallet-core/accounts/updateAccount',
    '@common/wallet-core/accounts/updateAccountRefreshTimestamp',
    '@common/wallet-core/accounts/createAccountFromAccountInfo',
    // Discovery actions — auto-fired on boot, would overwrite our 'complete'
    // status with 'starting' → 'failed' (Device not found).
    '@common/wallet-core/discovery/start',
    '@common/wallet-core/discovery/update',
    '@common/wallet-core/discovery/delete',
]);

// Thunk lifecycle suffixes — the actual state mutation usually happens on
// /fulfilled, so blocking only /pending isn't enough. We block all three.
const isThunkLifecycle = (type: string) =>
    type.endsWith('/pending') || type.endsWith('/fulfilled') || type.endsWith('/rejected');

const matches = (type: string, substrings: string[]) =>
    isThunkLifecycle(type) && substrings.some(s => type.includes(s));

const demoSignBlockerMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (typeof (action as { type?: unknown }).type === 'string') {
            const { type } = action as { type: string };

            // Sign-flow thunks (only react to /pending, that's when the user clicks)
            if (type.endsWith('/pending') && SIGN_BLOCKED_SUBSTRINGS.some(s => type.includes(s))) {
                api.dispatch(openModal({ type: 'demo-sign-blocked' }));

                return action;
            }

            if (matches(type, SILENT_BLOCKED_SUBSTRINGS)) {
                return action;
            }

            // Direct, non-thunk mutations of state.wallet.accounts that would
            // overwrite our seed (e.g. updateAccount fired from a notification).
            if (ACCOUNT_MUTATION_TYPES.has(type)) {
                return action;
            }
        }

        return next(action);
    };

export default demoSignBlockerMiddleware;
