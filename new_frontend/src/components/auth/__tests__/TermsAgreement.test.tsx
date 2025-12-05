import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TermsAgreement } from '../TermsAgreement';
import { TermsData, TermsAgreements } from '../types';

// Mock terms data
const mockTermsData: TermsData = {
  service_terms: {
    title: '서비스 이용약관',
    required: true,
    content: '서비스 이용약관 내용입니다.',
  },
  privacy_required: {
    title: '개인정보 수집·이용 동의 (필수)',
    required: true,
    content: '필수 개인정보 수집 내용입니다.',
  },
  privacy_optional: {
    title: '개인정보 수집·이용 동의 (선택)',
    required: false,
    content: '선택 개인정보 수집 내용입니다.',
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    required: false,
    content: '마케팅 정보 수신 내용입니다.',
  },
};

const mockAgreements: TermsAgreements = {
  all: false,
  service: false,
  privacyRequired: false,
  privacyOptional: false,
  marketing: false,
};

describe('TermsAgreement Component', () => {
  it('renders loading state when termsData is null', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={null as any}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('약관을 불러오는 중입니다...')).toBeInTheDocument();
  });

  it('renders all terms when termsData is provided', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    expect(screen.getByText('서비스 전체 약관에 동의합니다')).toBeInTheDocument();
    expect(screen.getByText(/서비스 이용약관/)).toBeInTheDocument();
    expect(screen.getByText(/개인정보 수집·이용 동의 \(필수\)/)).toBeInTheDocument();
    expect(screen.getByText(/개인정보 수집·이용 동의 \(선택\)/)).toBeInTheDocument();
    expect(screen.getByText(/마케팅 정보 수신 동의/)).toBeInTheDocument();
  });

  it('calls onAllAgreementChange when all checkbox is clicked', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    const allCheckbox = screen.getByLabelText('서비스 전체 약관에 동의합니다');
    fireEvent.click(allCheckbox);

    expect(onAllAgreementChange).toHaveBeenCalledWith(true);
  });

  it('calls onAgreementChange when individual checkbox is clicked', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    const serviceCheckbox = screen.getByLabelText(/서비스 이용약관/);
    fireEvent.click(serviceCheckbox);

    expect(onAgreementChange).toHaveBeenCalledWith('service', true);
  });

  it('expands and collapses term content when toggle button is clicked', async () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    const toggleButtons = screen.getAllByRole('button', { name: /내용 보기/ });
    const firstToggle = toggleButtons[0];

    // Initially content should not be visible
    expect(screen.queryByText('서비스 이용약관 내용입니다.')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(firstToggle);

    // Content should now be visible
    await waitFor(() => {
      expect(screen.getByText('서비스 이용약관 내용입니다.')).toBeInTheDocument();
    });

    // Click to collapse
    fireEvent.click(firstToggle);

    // Content should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('서비스 이용약관 내용입니다.')).not.toBeInTheDocument();
    });
  });

  it('shows validation notice when canProceed is false', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    expect(
      screen.getByText('필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다.')
    ).toBeInTheDocument();
  });

  it('hides validation notice when canProceed is true', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={{ ...mockAgreements, service: true, privacyRequired: true }}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={true}
        onNext={onNext}
      />
    );

    expect(
      screen.queryByText('필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다.')
    ).not.toBeInTheDocument();
  });

  it('disables next button when canProceed is false', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: '다음 단계로' });
    expect(nextButton).toBeDisabled();
  });

  it('enables next button when canProceed is true', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={{ ...mockAgreements, service: true, privacyRequired: true }}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={true}
        onNext={onNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: '다음 단계로' });
    expect(nextButton).not.toBeDisabled();
  });

  it('calls onNext when next button is clicked', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={{ ...mockAgreements, service: true, privacyRequired: true }}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={true}
        onNext={onNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: '다음 단계로' });
    fireEvent.click(nextButton);

    expect(onNext).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    const onAgreementChange = vi.fn();
    const onAllAgreementChange = vi.fn();
    const onNext = vi.fn();

    render(
      <TermsAgreement
        termsData={mockTermsData}
        agreements={mockAgreements}
        onAgreementChange={onAgreementChange}
        onAllAgreementChange={onAllAgreementChange}
        canProceed={false}
        onNext={onNext}
      />
    );

    expect(screen.getByRole('form', { name: '약관 동의' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: undefined })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '개별 약관 목록' })).toBeInTheDocument();
  });
});
