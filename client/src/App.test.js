import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PropertyForm from './components/PropertyForm';

test('shows validation only after touch and blocks invalid save', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <PropertyForm
      selected={{
        id: '507f1f77bcf86cd799439011',
        firstName: '',
        lastName: '',
        gender: 'M',
        addresses: [],
        creditCards: [],
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  const updateButton = screen.getByRole('button', { name: 'Update' });
  const firstNameInput = screen.getByPlaceholderText('First Name');
  const lastNameInput = screen.getByPlaceholderText('Last Name');

  expect(screen.queryByText('First Name is required.')).not.toBeInTheDocument();

  fireEvent.focus(firstNameInput);
  fireEvent.blur(firstNameInput);

  expect(screen.getByText('First Name is required.')).toBeInTheDocument();

  fireEvent.click(updateButton);
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText('Last Name is required.')).toBeInTheDocument();

  fireEvent.change(firstNameInput, { target: { value: 'Ada' } });
  fireEvent.blur(firstNameInput);
  fireEvent.change(lastNameInput, { target: { value: 'Lovelace' } });
  fireEvent.blur(lastNameInput);

  fireEvent.click(updateButton);

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});
