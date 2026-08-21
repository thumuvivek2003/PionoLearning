import { useMemo } from 'react';
import type { SelectHTMLAttributes } from 'react';
import type { Option } from '@/types/common.types';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './ui.module.css';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly Option[];
  leadingIcon?: IconName;
}

/** Native select — keyboard accessible for free, and groups options by `group`. */
export function Select({ options, leadingIcon, className, ...rest }: SelectProps) {
  const grouped = useMemo(() => {
    const groups = new Map<string, Option[]>();
    for (const option of options) {
      const key = option.group ?? '';
      const bucket = groups.get(key);
      if (bucket) bucket.push(option);
      else groups.set(key, [option]);
    }
    return [...groups.entries()];
  }, [options]);

  return (
    <span className={styles.selectWrap}>
      {leadingIcon && (
        <span className={styles.leadingIcon}>
          <Icon name={leadingIcon} size={16} />
        </span>
      )}
      <select className={cn(styles.control, styles.select, className)} {...rest}>
        {grouped.map(([group, groupOptions]) =>
          group ? (
            <optgroup key={group} label={group}>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            groupOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          ),
        )}
      </select>
      <span className={styles.selectArrow}>
        <Icon name="chevron-down" size={16} />
      </span>
    </span>
  );
}
