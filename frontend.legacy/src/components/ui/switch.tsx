import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  onCheckedChange,
  label,
  disabled = false,
}) => {
  const handleChange = (newChecked: boolean) => {
    if (onChange) onChange(newChecked);
    if (onCheckedChange) onCheckedChange(newChecked);
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && handleChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <span className="ml-3 text-sm text-gray-700">{label}</span>
      )}
    </div>
  );
}; 