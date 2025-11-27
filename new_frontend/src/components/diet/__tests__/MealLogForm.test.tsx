/**
 * MealLogForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealLogForm } from '../MealLogForm';

describe('MealLogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all meal type tabs', () => {
    render(<MealLogForm />);

    expect(screen.getByRole('tab', { name: /breakfast/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /lunch/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dinner/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /snack/i })).toBeInTheDocument();
  });

  it('displays Korean meal names when language is ko', () => {
    render(<MealLogForm language="ko" />);

    expect(screen.getByRole('tab', { name: /아침/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /점심/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /저녁/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /간식/ })).toBeInTheDocument();
  });

  it('switches between meal tabs', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const lunchTab = screen.getByRole('tab', { name: /lunch/i });
    await user.click(lunchTab);

    expect(lunchTab).toHaveAttribute('data-state', 'active');
  });

  it('adds food items when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const addButton = screen.getByRole('button', { name: /add food/i });
    await user.click(addButton);

    const foodNameInputs = screen.getAllByPlaceholderText(/brown rice/i);
    expect(foodNameInputs).toHaveLength(2);
  });

  it('removes food items when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const addButton = screen.getByRole('button', { name: /add food/i });
    await user.click(addButton);

    const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[1]);

    const foodNameInputs = screen.getAllByPlaceholderText(/brown rice/i);
    expect(foodNameInputs).toHaveLength(1);
  });

  it('prevents removing the last food item', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const deleteButton = screen.getByRole('button', { name: /remove/i });
    expect(deleteButton).toBeDisabled();
  });

  it('updates food item name', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const nameInput = screen.getByPlaceholderText(/brown rice/i);
    await user.type(nameInput, 'White rice');

    expect(nameInput).toHaveValue('White rice');
  });

  it('updates food item amount', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const amountInput = screen.getByPlaceholderText('0');
    await user.type(amountInput, '150');

    expect(amountInput).toHaveValue(150);
  });

  it('selects different amount units', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const unitSelect = screen.getByRole('combobox');
    await user.click(unitSelect);

    const cupOption = screen.getByRole('option', { name: /cup/i });
    await user.click(cupOption);

    expect(unitSelect).toHaveTextContent('cup');
  });

  it('updates meal time', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const timeInput = screen.getByLabelText(/time/i);
    await user.clear(timeInput);
    await user.type(timeInput, '09:30');

    expect(timeInput).toHaveValue('09:30');
  });

  it('updates notes', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    const notesInput = screen.getByPlaceholderText(/add notes/i);
    await user.type(notesInput, 'Breakfast was delicious');

    expect(notesInput).toHaveValue('Breakfast was delicious');
  });

  it('calls onSave with meal data when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MealLogForm onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText(/brown rice/i);
    await user.type(nameInput, 'Oatmeal');

    const amountInput = screen.getByPlaceholderText('0');
    await user.type(amountInput, '100');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const callArgs = onSave.mock.calls[0][0];
    expect(callArgs.type).toBe('breakfast');
    expect(callArgs.foods).toHaveLength(1);
    expect(callArgs.foods[0].name).toBe('Oatmeal');
    expect(callArgs.foods[0].amount).toBe(100);
  });

  it('does not save if no food names are provided', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MealLogForm onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('resets form after successful save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MealLogForm onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText(/brown rice/i);
    await user.type(nameInput, 'Test food');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    await waitFor(() => {
      const resetInput = screen.getByPlaceholderText(/brown rice/i);
      expect(resetInput).toHaveValue('');
    });
  });

  it('maintains separate state for each meal tab', async () => {
    const user = userEvent.setup();
    render(<MealLogForm />);

    // Add breakfast food
    const breakfastInput = screen.getByPlaceholderText(/brown rice/i);
    await user.type(breakfastInput, 'Breakfast item');

    // Switch to lunch tab
    const lunchTab = screen.getByRole('tab', { name: /lunch/i });
    await user.click(lunchTab);

    // Lunch should have empty input
    const lunchInput = screen.getByPlaceholderText(/brown rice/i);
    expect(lunchInput).toHaveValue('');

    // Switch back to breakfast
    const breakfastTab = screen.getByRole('tab', { name: /breakfast/i });
    await user.click(breakfastTab);

    // Breakfast input should still have value
    const breakfastInputAgain = screen.getByPlaceholderText(/brown rice/i);
    expect(breakfastInputAgain).toHaveValue('Breakfast item');
  });

  it('is accessible with proper labels', () => {
    render(<MealLogForm />);

    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/food name 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit 1/i)).toBeInTheDocument();
  });
});
