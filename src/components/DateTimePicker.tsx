'use client';

import * as React from 'react';
import type { ChangeEvent } from 'react';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { clientPosterUpdateSchema } from '@/lib/zod';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDateForDisplay(date: Date) {
  return dateFormatter.format(date);
}

function formatTimeForInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

type PosterDateField = 'scheduledAt' | 'deleteAt';
type PosterFormValues = z.input<typeof clientPosterUpdateSchema>;

export type DateTimePickerProps = {
  field: ControllerRenderProps<PosterFormValues, PosterDateField>;
  placeholder: string;
  disabled: boolean;
};

export function DateTimePicker({ field, placeholder, disabled }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  const rawValue = field.value;
  let selected: Date | undefined;
  if (rawValue instanceof Date) {
    selected = rawValue;
  } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
    const parsed = new Date(rawValue);
    selected = Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } else {
    selected = undefined;
  }
  const timeValue = selected ? formatTimeForInput(selected) : '';

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) {
      field.onChange(undefined);
      field.onBlur();
      setOpen(false);
      return;
    }
    const nextDate = new Date(next);
    if (selected) {
      nextDate.setHours(selected.getHours(), selected.getMinutes(), selected.getSeconds(), 0);
    }
    field.onChange(nextDate);
    field.onBlur();
    setOpen(false);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const [hours, minutes, seconds = '0'] = event.target.value.split(':');
    const updated = new Date(selected);
    updated.setHours(Number(hours) || 0, Number(minutes) || 0, Number(seconds) || 0, 0);
    field.onChange(updated);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className="w-50 justify-between bg-card font-normal"
              disabled={disabled}
            >
              {hasMounted && selected ? formatDateForDisplay(selected) : placeholder}
              <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        step="60"
        className="w-auto appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        value={timeValue}
        onChange={handleTimeChange}
        onBlur={field.onBlur}
        disabled={disabled || !selected}
        placeholder="00:00"
      />
      {selected ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Effacer"
          onClick={() => {
            field.onChange(undefined);
            field.onBlur();
          }}
          disabled={disabled}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
