import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerFieldProps = {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between border-zinc-800 bg-zinc-950/40 px-3 text-zinc-100 hover:bg-zinc-900",
            !value && "text-zinc-500"
          )}
        >
          <span>
            {value ? format(value, "dd/MM/yyyy", { locale: fr }) : placeholder}
          </span>
          <CalendarIcon className="size-4 text-zinc-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[100] w-auto border border-zinc-800 bg-zinc-950 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          locale={fr}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date(2100, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}
