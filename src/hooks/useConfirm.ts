import { useState } from 'react';

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const cancel = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    confirm,
    confirmState,
    cancel,
  };
}
