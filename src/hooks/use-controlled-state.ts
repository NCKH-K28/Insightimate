import React, { useState } from 'react';

export const useControlledState = <T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internalValue;
  const setValue = React.useCallback(
    (newValue: T) => {
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
};
