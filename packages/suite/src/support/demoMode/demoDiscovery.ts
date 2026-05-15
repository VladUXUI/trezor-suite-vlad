import { type Discovery } from '@suite-common/wallet-types';
import { asDeviceUniquePath } from '@trezor/connect';

import { DEMO_DEVICE_PATH } from './demoConstants';

// Marking discovery as `complete` so:
// - AccountsView doesn't show the "Your wallet is ready" empty state
// - The auto-start-discovery thunk skips (status is already complete)
export const demoDiscovery: Discovery = {
    [asDeviceUniquePath(DEMO_DEVICE_PATH)]: {
        status: 'complete',
        hasLoadedAnyNonEmptyAccount: true,
    },
};
