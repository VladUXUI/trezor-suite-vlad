import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { AccountsView } from './AccountsView/AccountsView';

export const Accounts = () => {
    useLayout('Accounts', <PageHeader />);

    return <AccountsView />;
};
