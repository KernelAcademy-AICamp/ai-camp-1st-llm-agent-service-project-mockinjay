import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MyPage } from '../MyPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockLogout = vi.fn();
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: '홍길동',
      },
      logout: mockLogout,
      isAuthenticated: true,
    }),
  };
});

// Helper function to render MyPage with required providers
const renderMyPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <MyPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MyPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the page title', () => {
      renderMyPage();
      expect(screen.getByText('프로필')).toBeInTheDocument();
    });

    it('should render the profile card with gradient background', () => {
      renderMyPage();
      const profileCard = screen.getByText('홍길동').closest('div');
      expect(profileCard).toBeInTheDocument();
    });

    it('should display user stats (points, level, tokens, subscription)', () => {
      renderMyPage();
      expect(screen.getByText('포인트')).toBeInTheDocument();
      expect(screen.getByText('200P')).toBeInTheDocument();
      expect(screen.getByText('지식레벨')).toBeInTheDocument();
      expect(screen.getByText('Lv3')).toBeInTheDocument();
      expect(screen.getByText('토큰')).toBeInTheDocument();
      expect(screen.getByText('550')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
      expect(screen.getByText('없음')).toBeInTheDocument();
    });

    it('should render all three tabs', () => {
      renderMyPage();
      expect(screen.getByText('계정정보')).toBeInTheDocument();
      expect(screen.getByText('개인정보')).toBeInTheDocument();
      expect(screen.getByText('질환정보')).toBeInTheDocument();
    });

    it('should display personal information tab by default', () => {
      renderMyPage();
      expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
      expect(screen.getByText('사용자 유형')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to account info tab when clicked', () => {
      renderMyPage();
      const accountTab = screen.getByText('계정정보');
      fireEvent.click(accountTab);

      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    });

    it('should switch to disease info tab when clicked', () => {
      renderMyPage();
      const diseaseTab = screen.getByText('질환정보');
      fireEvent.click(diseaseTab);

      expect(screen.getByLabelText('병원 진단 명')).toBeInTheDocument();
    });

    it('should highlight the active tab', () => {
      renderMyPage();
      const personalTab = screen.getByText('개인정보');

      // Personal tab should be active by default
      expect(personalTab).toHaveClass('text-[#00C9B7]');

      // Switch to account tab
      const accountTab = screen.getByText('계정정보');
      fireEvent.click(accountTab);

      expect(accountTab).toHaveClass('text-[#00C9B7]');
      expect(personalTab).not.toHaveClass('text-[#00C9B7]');
    });
  });

  describe('Form Interactions', () => {
    it('should update nickname input in personal tab', () => {
      renderMyPage();
      const nicknameInput = screen.getByLabelText('닉네임') as HTMLInputElement;

      fireEvent.change(nicknameInput, { target: { value: '김철수' } });
      expect(nicknameInput.value).toBe('김철수');
    });

    it('should update height and weight inputs', () => {
      renderMyPage();
      const heightInput = screen.getByLabelText('키 (cm)') as HTMLInputElement;
      const weightInput = screen.getByLabelText('체중 (kg)') as HTMLInputElement;

      fireEvent.change(heightInput, { target: { value: '180' } });
      fireEvent.change(weightInput, { target: { value: '75' } });

      expect(heightInput.value).toBe('180');
      expect(weightInput.value).toBe('75');
    });

    it('should select user type in personal tab', () => {
      renderMyPage();
      const researcherButton = screen.getByText('연구자');

      fireEvent.click(researcherButton);
      expect(researcherButton).toHaveClass('bg-[#E0F7FA]');
      expect(researcherButton).toHaveClass('text-[#00C9B7]');
    });

    it('should select gender in personal tab', () => {
      renderMyPage();
      const femaleButton = screen.getByText('여성');

      fireEvent.click(femaleButton);
      expect(femaleButton).toHaveClass('bg-[#E0F7FA]');
      expect(femaleButton).toHaveClass('text-[#00C9B7]');
    });

    it('should update disease stage in disease tab', () => {
      renderMyPage();
      fireEvent.click(screen.getByText('질환정보'));

      const diseaseSelect = screen.getByLabelText('병원 진단 명') as HTMLSelectElement;
      fireEvent.change(diseaseSelect, { target: { value: 'CKD4' } });

      expect(diseaseSelect.value).toBe('CKD4');
    });
  });

  describe('Action Buttons', () => {
    it('should navigate to test results page when card is clicked', () => {
      renderMyPage();
      const testResultsButton = screen.getByText('병원검사결과').closest('button');

      fireEvent.click(testResultsButton!);
      expect(mockNavigate).toHaveBeenCalledWith('/mypage/test-results');
    });

    it('should navigate to subscription page when card is clicked', () => {
      renderMyPage();
      const subscriptionButton = screen.getByText('구독결제').closest('button');

      fireEvent.click(subscriptionButton!);
      expect(mockNavigate).toHaveBeenCalledWith('/mypage/subscription');
    });

    it('should call logout and navigate to chat when logout button is clicked', () => {
      renderMyPage();
      const logoutButton = screen.getByLabelText('로그아웃');

      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });

    it('should call logout and navigate to chat when withdrawal button is clicked', () => {
      renderMyPage();
      const withdrawalButton = screen.getByLabelText('회원탈퇴');

      fireEvent.click(withdrawalButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  describe('Save Buttons', () => {
    it('should log account info when save button is clicked in account tab', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      renderMyPage();

      fireEvent.click(screen.getByText('계정정보'));
      const saveButton = screen.getByLabelText('계정정보 저장');

      fireEvent.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Saving account info:',
        expect.objectContaining({ email: 'gildong@example.com' })
      );

      consoleSpy.mockRestore();
    });

    it('should log personal info when save button is clicked in personal tab', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      renderMyPage();

      const saveButton = screen.getByLabelText('개인정보 저장');
      fireEvent.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Saving personal info:',
        expect.objectContaining({ nickname: '홍길동' })
      );

      consoleSpy.mockRestore();
    });

    it('should log disease info when save button is clicked in disease tab', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      renderMyPage();

      fireEvent.click(screen.getByText('질환정보'));
      const saveButton = screen.getByLabelText('질환정보 저장');

      fireEvent.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith('Saving disease info:', 'CKD3');

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      renderMyPage();

      expect(screen.getByLabelText('알림')).toBeInTheDocument();
      expect(screen.getByLabelText('로그아웃')).toBeInTheDocument();
      expect(screen.getByLabelText('회원탈퇴')).toBeInTheDocument();
    });

    it('should have role="tablist" for tab navigation', () => {
      renderMyPage();
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('should have role="tabpanel" for tab content', () => {
      renderMyPage();
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should mark active tab with aria-current', () => {
      renderMyPage();
      const personalTab = screen.getByText('개인정보');
      expect(personalTab).toHaveAttribute('aria-current', 'page');
    });

    it('should have proper aria-pressed for toggle buttons', () => {
      renderMyPage();
      const patientButton = screen.getByText('신장병 환우');
      expect(patientButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Mobile Header', () => {
    it('should render mobile header on small screens', () => {
      renderMyPage();
      expect(screen.getByText('마이페이지')).toBeInTheDocument();
    });
  });

  describe('Disease Options', () => {
    it('should display all CKD stage options in dropdown', () => {
      renderMyPage();
      fireEvent.click(screen.getByText('질환정보'));

      const diseaseSelect = screen.getByLabelText('병원 진단 명');
      const options = diseaseSelect.querySelectorAll('option');

      expect(options).toHaveLength(10);
      expect(options[0]).toHaveTextContent('만성신장병 1단계');
      expect(options[4]).toHaveTextContent('만성신장병 5단계');
      expect(options[5]).toHaveTextContent('혈액투석환자');
      expect(options[9]).toHaveTextContent('해당없음');
    });
  });
});
