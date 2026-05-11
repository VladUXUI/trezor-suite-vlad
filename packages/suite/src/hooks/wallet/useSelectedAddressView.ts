import { selectSiblingEvmAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

/**
 * Discriminated view of the currently-selected wallet account.
 *
 * - `aggregate`: an EVM address that lives on more than one chain. UI should
 *   render the chain-agnostic layout (summed balance, merged tokens, merged
 *   transactions, etc.).
 * - `single`: anything else (non-EVM accounts, or EVM accounts that happen to
 *   live on exactly one chain). UI renders today's per-account layout
 *   unchanged.
 *
 * The hook returns `null` when no account is selected (e.g. before a device is
 * connected) so callers can render their own loading / empty states.
 */
export type SelectedAddressView =
    | {
          kind: 'aggregate';
          descriptor: string;
          accounts: Account[];
          /**
           * Drives single-chain fallbacks: the destination of action buttons
           * before chain disambiguation, the route param when a tab needs a
           * single account to query, etc. After `sortByCoin` this is typically
           * the canonical chain (Ethereum mainnet).
           */
          primary: Account;
      }
    | { kind: 'single'; account: Account };

export const useSelectedAddressView = (): SelectedAddressView | null => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const siblings = useSelector(state =>
        selectedAccount
            ? selectSiblingEvmAccounts(
                  state,
                  selectedAccount.descriptor,
                  selectedAccount.deviceState,
              )
            : [],
    );

    if (!selectedAccount) return null;

    // EVM with >1 sibling → aggregate. Single-sibling EVM and all non-EVM fall
    // through to the per-account view, which keeps today's behavior intact for
    // any address that doesn't actually span chains.
    if (siblings.length > 1) {
        return {
            kind: 'aggregate',
            descriptor: selectedAccount.descriptor,
            accounts: siblings,
            primary: siblings[0],
        };
    }

    return { kind: 'single', account: selectedAccount };
};
