import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ---- Types ----
export type CareerValue = string;

export interface CareerCommandSelectProps {
  value: CareerValue;
  onChange: (value: CareerValue) => void;
  error?: string;
}

const CAREER_OPTIONS: CareerValue[] = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Cybersecurity',
  'Information Technology',
  'Artificial Intelligence',
  'Web Development',
  'Mobile App Development',
  'Cloud Computing',
  'DevOps Engineering',
  'Business Administration',
  'Finance',
  'Accounting',
  'Marketing',
  'Economics',
  'Management',
  'Entrepreneurship',
  'International Business',
  'Human Resources',
  'Supply Chain Management',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Industrial Engineering',
  'Environmental Engineering',
  'Nursing',
  'Medicine',
  'Public Health',
  'Pharmacy',
  'Physical Therapy',
  'Psychology',
  'Nutrition',
  'Healthcare Administration',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Environmental Science',
  'Geology',
  'Political Science',
  'Sociology',
  'Anthropology',
  'History',
  'English',
  'Philosophy',
  'Communications',
  'Graphic Design',
  'UX/UI Design',
  'Fine Arts',
  'Architecture',
  'Fashion Design',
  'Interior Design',
  'Education',
  'Early Childhood Education',
  'Special Education',
  'Law',
  'Criminal Justice',
  'Paralegal Studies',
];

// ---- Component ----
export default function CareerCommandSelect({
  value,
  onChange,
  error,
}: CareerCommandSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  const filteredOptions = CAREER_OPTIONS.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (currentValue: CareerValue) => {
    onChange(currentValue === value ? '' : currentValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateCustom = (): void => {
    const trimmed = searchValue.trim();
    if (trimmed) {
      onChange(trimmed);
      setOpen(false);
      setSearchValue('');
    }
  };

  const showCreateOption: boolean =
    !!searchValue.trim() &&
    !CAREER_OPTIONS.some(
      (option) => option.toLowerCase() === searchValue.toLowerCase()
    );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Major / Career Field
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value || 'Select or type your career field...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search career fields..."
              value={searchValue}
              onValueChange={setSearchValue}
            />

            <CommandList>
              <CommandEmpty>
                {showCreateOption ? (
                  <div className="px-2 py-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleCreateCustom}
                    >
                      ✨ Create "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm">
                    No career field found.
                  </div>
                )}
              </CommandEmpty>

              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === option ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <span>{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {showCreateOption && filteredOptions.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={handleCreateCustom}>
                    ✨ Create "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
