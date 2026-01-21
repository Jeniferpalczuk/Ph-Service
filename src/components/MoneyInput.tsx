import React, { useEffect, useState } from 'react';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number | string; // Accept string too just in case, but prefer number
    onChange: (value: number) => void;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, className, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');

    // Update display when value changes externally
    useEffect(() => {
        if (value === '' || value === undefined || value === null) {
            setDisplayValue('');
            return;
        }
        const numVal = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numVal)) {
            setDisplayValue(numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Get only digits
        const rawValue = e.target.value.replace(/\D/g, '');

        if (!rawValue) {
            onChange(0);
            setDisplayValue('');
            return;
        }

        // Convert to number (divide by 100 for cents)
        const numericValue = parseInt(rawValue, 10) / 100;

        onChange(numericValue);
        // setDisplayValue is handled by useEffect or we can set it here for immediate feedback, 
        // but useEffect is safer for sync. 
        // Actually, for smooth typing, we might want to update local state immediately.
        // But the parent update might cause a re-render. 
        // For "ATM" style, usually we want to see the formatting update as we type.
        // e.g. user types '1' -> '0,01'. 
    };

    return (
        <input
            {...props}
            type="text"
            className={className}
            value={displayValue}
            onChange={handleChange}
            inputMode="numeric" // Mobile numeric keyboard
        />
    );
};
