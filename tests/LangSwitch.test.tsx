import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { LangSwitch } from '../src/components/LangSwitch';

it('marks the active language and reports changes', () => {
  const onChange = vi.fn();
  render(<LangSwitch lang="en" onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(onChange).toHaveBeenCalledWith('es');
});
