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
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      {/* Calendar Type Selection */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => onCalendarTypeChange('gregorian')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            calendarType === 'gregorian'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ميلادي
        </button>
        <button
          type="button"
          onClick={() => onCalendarTypeChange('hijri')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            calendarType === 'hijri'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          هجري
        </button>
      </div>

      {/* Date Input */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="date"
          name={name}
          value={displayValue}
          onChange={handleDateChange}
          required={required}
          className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          dir="ltr"
        />
      </div>

      {/* Calendar Type Indicator */}
      <div className="text-xs text-gray-500">
        {calendarType === 'hijri' ? 'التقويم الهجري' : 'التقويم الميلادي'}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
