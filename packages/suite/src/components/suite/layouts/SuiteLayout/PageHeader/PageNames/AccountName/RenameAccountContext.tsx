import { type ReactNode, createContext, useContext, useMemo, useRef } from 'react';

type RenameTrigger = () => void;

type RenameAccountContextValue = {
    setTrigger: (trigger: RenameTrigger | null) => void;
    requestRename: () => void;
};

const RenameAccountContext = createContext<RenameAccountContextValue | null>(null);

export const RenameAccountProvider = ({ children }: { children: ReactNode }) => {
    const triggerRef = useRef<RenameTrigger | null>(null);

    const value = useMemo<RenameAccountContextValue>(
        () => ({
            setTrigger: trigger => {
                triggerRef.current = trigger;
            },
            requestRename: () => {
                triggerRef.current?.();
            },
        }),
        [],
    );

    return <RenameAccountContext.Provider value={value}>{children}</RenameAccountContext.Provider>;
};

export const useRenameAccount = (): RenameAccountContextValue | null =>
    useContext(RenameAccountContext);
