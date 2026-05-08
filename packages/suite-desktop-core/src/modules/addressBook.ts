import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'address-book';

export const init: ModuleInit = ({ store }) => {
    ipcMain.handle('address-book/get-entries', () => store.getAddressBook());

    ipcMain.handle('address-book/set-entries', (_event, entries) => {
        store.setAddressBook(entries);
    });
};
