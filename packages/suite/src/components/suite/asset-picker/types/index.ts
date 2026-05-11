import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export type AssetGroupSpaceSize = 'md' | 'lg';

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: AccountWithSuiteSyncLabel;
          /** All sibling EVM sub-accounts sharing the same address. Present only for grouped EVM rows; undefined for single-chain accounts. */
          siblingAccounts?: Account[];
          height: number;
      }
    | {
          type: 'token';
          account: AccountWithSuiteSyncLabel;
          token: TokensWithRates;
          height: number;
      }
    | {
          type: 'hidden-tokens';
          account: AccountWithSuiteSyncLabel;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      }
    | {
          type: 'non-tradable-tokens';
          account: AccountWithSuiteSyncLabel;
          tokens: TokensWithRates[];
          height: number;
          expanded: boolean;
      };
