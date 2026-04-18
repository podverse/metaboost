'use client';

import { CheckboxField, type CheckboxFieldProps } from '../../form/CheckboxField/CheckboxField';

import styles from './Dropdown.module.scss';

export type DropdownMenuCheckboxRowProps = CheckboxFieldProps;

/** Checkbox row inside `Dropdown` `panelContent`; matches `.item` padding and label typography. */
export function DropdownMenuCheckboxRow(props: DropdownMenuCheckboxRowProps) {
  const { labelClassName, ...rest } = props;
  const mergedLabelClass = [styles.dropdownMenuCheckboxLabel, labelClassName]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.dropdownMenuPanelRow}>
      <CheckboxField {...rest} labelClassName={mergedLabelClass} />
    </div>
  );
}
