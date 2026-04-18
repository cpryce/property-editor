import React, { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import PropertyTable from './PropertyTable';

test('renders without React console warnings', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <StrictMode>
      <PropertyTable
        properties={[
          {
            id: '1',
            firstName: 'Ada',
            lastName: 'Lovelace',
            gender: 'F',
            characterName: 'Enchantress',
            updatedAt: '2026-04-17T12:00:00.000Z',
          },
        ]}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </StrictMode>
  );

  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete Ada Lovelace' })).toBeInTheDocument();
  expect(errorSpy).not.toHaveBeenCalled();

  errorSpy.mockRestore();
});