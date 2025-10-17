"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

function formatDate(d?: Date) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(d?: Date) {
  return !!d && !isNaN(d.getTime());
}

interface DatePickerInputProps {
  label: string;
  initialDate?: string | Date;
  onChange?: (date?: Date) => void;
}

export default function DatePickerInput({ label, initialDate, onChange }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (initialDate) {
      const d = typeof initialDate === "string" ? new Date(initialDate) : initialDate;
      if (isValidDate(d)) {
        setDate(d);
        setMonth(d);
        setValue(formatDate(d));
      }
    }
  }, [initialDate]);

  return (
    <div className="mt-4">
      <h4 className="font-medium text-gray-800">{label}</h4>
      <div className="mt-2 relative flex items-center gap-2">
        <Input
          value={value}
          placeholder="Select date"
          className="bg-background pr-10"
          onChange={(e) => {
            const d = new Date(e.target.value);
            setValue(e.target.value);
            if (isValidDate(d)) {
              setDate(d);
              setMonth(d);
              onChange?.(d);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end" sideOffset={10}>
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={(d) => {
                setDate(d);
                setValue(formatDate(d));
                setOpen(false);
                onChange?.(d);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
