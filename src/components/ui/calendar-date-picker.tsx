'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import HijriDate from 'hijri-date';

export type CalendarType = 'gregorian' | 'hijri';

interface CalendarDatePickerProps {
  name: string;
  label: string;
  value: string;
  calendarType: CalendarType;
  onChange: (value: string) => void;
  onCalendarTypeChange: (type: CalendarType) => void;
  required?: boolean;
  error?: string;
}

export function CalendarDatePicker({
  name,
  label,
  value,
  calendarType,
  onChange,
  onCalendarTypeChange,
  required = false,
  error,
}: CalendarDatePickerProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Convert Hijri date to Gregorian when user inputs Hijri date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    setDisplayValue(inputDate);

    if (calendarType === 'hijri' && inputDate) {
      try {
        // Parse the input date (YYYY-MM-DD format)
        const [year, month, day] = inputDate.split('-').map(Number);

        // Create Hijri date object
        const hijriDate = new HijriDate(year, month, day);

        // Convert to Gregorian
        const gregorianDate = hijriDate.toGregorian();

        // Format as YYYY-MM-DD
        const gregorianDateStr = `${gregorianDate.getFullYear()}-${String(gregorianDate.getMonth() + 1).padStart(2, '0')}-${String(gregorianDate.getDate()).padStart(2, '0')}`;

        // Store the Gregorian date
        onChange(gregorianDateStr);
      } catch (err) {
        console.error('Error converting Hijri to Gregorian:', err);
        onChange(inputDate);
      }
    } else {
      onChange(inputDate);
    }
  };

  // Convert display value when calendar type changes
  useEffect(() => {
    if (value && calendarType === 'hijri') {
      try {
        // Value is stored as Gregorian, convert to Hijri for display
        const gregorianDate = new Date(value);
        const hijriDate = new HijriDate(gregorianDate);

        // Format as YYYY-MM-DD in Hijri
        const hijriDateStr = `${hijriDate.getFullYear()}-${String(hijriDate.getMonth()).padStart(2, '0')}-${String(hijriDate.getDate()).padStart(2, '0')}`;
        setDisplayValue(hijriDateStr);
      } catch (err) {
        console.error('Error converting to Hijri:', err);
        setDisplayValue(value);
      }
    } else {
      setDisplayValue(value);
    }
  }, [calendarType, value]);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-foreground-secondary text-start block">
          {label}
          {required && <span className="text-error ms-1">*</span>}
        </label>
      )}

      {/* Calendar Type Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onCalendarTypeChange('gregorian')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            calendarType === 'gregorian'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-card-hover text-foreground-secondary hover:bg-card-hover/80 border border-card-border'
          }`}
        >
          ميلادي
        </button>
        <button
          type="button"
          onClick={() => onCalendarTypeChange('hijri')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            calendarType === 'hijri'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-card-hover text-foreground-secondary hover:bg-card-hover/80 border border-card-border'
          }`}
        >
          هجري
        </button>
      </div>

      {/* Date Input */}
      <div className="relative">
        <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10">
          <Calendar className="w-5 h-5" />
        </div>
        <input
          type="date"
          name={name}
          value={displayValue}
          onChange={handleDateChange}
          required={required}
          className={`w-full px-4 py-3 ps-10 text-base
            bg-card-hover border border-card-border rounded-xl
            text-foreground placeholder:text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
          dir="ltr"
        />
      </div>

      {/* Calendar Type Indicator */}
      <div className="text-xs text-muted text-start">
        {calendarType === 'hijri' ? 'التقويم الهجري' : 'التقويم الميلادي'}
      </div>

      {/* Error Message */}
      {error && <span className="text-xs text-error text-start block">{error}</span>}
    </div>
  );
}
