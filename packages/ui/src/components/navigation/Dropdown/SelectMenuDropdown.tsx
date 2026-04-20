'use client';

import { Dropdown, type DropdownItem, type DropdownProps } from './Dropdown';

export type SelectMenuOption = {
  value: string;
  label: string;
};

export type SelectMenuDropdownProps = Omit<
  DropdownProps,
  'trigger' | 'triggerVariant' | 'items' | 'panelContent'
> & {
  options: SelectMenuOption[];
  value: string;
  onChange: (value: string) => void;
};

/**
 * Small set of mutually exclusive choices (borderless label + caret trigger). For URL-driven or
 * form-driven state, call `onChange` from menu item handlers.
 */
export function SelectMenuDropdown({
  options,
  value,
  onChange,
  ...props
}: SelectMenuDropdownProps) {
  const selected = options.find((opt) => opt.value === value);
  const selectedLabel = selected?.label ?? value;

  const items: DropdownItem[] = options.map((opt) => ({
    type: 'button',
    label: opt.label,
    onClick: () => {
      onChange(opt.value);
    },
    selected: opt.value === value,
  }));

  return (
    <Dropdown
      {...props}
      triggerVariant="textMenu"
      trigger={
        <>
          <span>{selectedLabel}</span>
          <i className="fa-solid fa-caret-down" aria-hidden />
        </>
      }
      items={items}
    />
  );
}
