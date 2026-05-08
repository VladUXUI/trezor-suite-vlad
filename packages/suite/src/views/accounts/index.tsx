import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import { AssetsView } from 'src/views/dashboard/AssetsView/AssetsView';

export const Accounts = () => {
    useLayout('Accounts', <PageHeader />);

    return <AssetsView />;
};
