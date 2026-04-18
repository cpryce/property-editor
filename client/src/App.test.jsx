import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import PropertyForm from './components/PropertyForm';
import * as api from './api';

vi.mock('./api', () => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.getAll.mockResolvedValue({ properties: [], total: 0, page: 1, limit: 10 });
});

test('shows validation only after touch and blocks invalid save', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
      onCancel={onCancel}
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

  expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  expect(onCancel).not.toHaveBeenCalled();

  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('only keeps one default item selected per collection', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);

  render(
    <PropertyForm
      selected={{
        id: '507f1f77bcf86cd799439011',
        firstName: 'Ada',
        lastName: 'Lovelace',
        gender: 'F',
        addresses: [
          {
            nickname: 'Home',
            type: 'shipping',
            street: '123 Main St',
            city: 'Austin',
            state: 'Texas',
            zip: '78701',
            isDefault: true,
            phones: [
              { number: '6127901965', label: 'mobile', isDefault: true },
            ],
          },
          {
            nickname: 'Office',
            type: 'billing',
            street: '456 State St',
            city: 'Austin',
            state: 'Texas',
            zip: '78702',
            isDefault: false,
          },
        ],
        creditCards: [],
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Addresses 2/i }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]);

  const defaultSwitch = screen.getByRole('switch', { name: 'Default' });
  fireEvent.click(defaultSwitch);

  fireEvent.click(screen.getByRole('button', { name: 'Update' }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    addresses: expect.arrayContaining([
      expect.objectContaining({ nickname: 'Home', isDefault: false }),
      expect.objectContaining({ nickname: 'Office', isDefault: true }),
    ]),
  }));
});

test('root back button returns to table view', () => {
  const onCancel = vi.fn();

  render(
    <PropertyForm
      selected={null}
      onSave={vi.fn()}
      onCancel={onCancel}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('update keeps the user on the current form', async () => {
  api.getAll.mockResolvedValue({
    properties: [{
      id: '507f1f77bcf86cd799439011',
      firstName: 'Ada',
      lastName: 'Lovelace',
      gender: 'F',
      addresses: [{
        nickname: 'Home',
        type: 'shipping',
        street: '123 Main St',
        city: 'Austin',
        state: 'Texas',
        zip: '78701',
        isDefault: true,
        phones: [],
      }],
      creditCards: [],
    }],
    total: 1,
    page: 1,
    limit: 10,
  });
  api.update.mockResolvedValue({
    id: '507f1f77bcf86cd799439011',
    firstName: 'Ada',
    lastName: 'Lovelace',
    gender: 'F',
    addresses: [{
      nickname: 'Home',
      type: 'shipping',
      street: '999 Saved St',
      city: 'Austin',
      state: 'Texas',
      zip: '78701',
      isDefault: true,
      phones: [],
    }],
    creditCards: [],
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Delete Ada Lovelace' })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Ada' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: /Addresses 1/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

  await waitFor(() => {
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  fireEvent.change(screen.getByDisplayValue('123 Main St'), { target: { value: '999 Saved St' } });

  fireEvent.click(screen.getByRole('button', { name: 'Update' }));

  await waitFor(() => {
    expect(api.update).toHaveBeenCalledTimes(1);
  });

  expect(api.update).toHaveBeenCalledWith(
    '507f1f77bcf86cd799439011',
    expect.objectContaining({
      addresses: expect.arrayContaining([
        expect.objectContaining({ street: '999 Saved St' }),
      ]),
    })
  );

  expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  expect(screen.getByDisplayValue('999 Saved St')).toBeInTheDocument();
});
