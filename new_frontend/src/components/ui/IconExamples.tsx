/**
 * Icon System Examples
 * 아이콘 시스템 사용 예제 모음
 *
 * This file demonstrates various icon usage patterns in the CareGuide application.
 * 이 파일은 CareGuide 애플리케이션의 다양한 아이콘 사용 패턴을 보여줍니다.
 */

import React from 'react';
import {
  Icon,
  LoadingSpinner,
  StatusIcon,
  EmptyStateIcon,
} from './Icon';
import {
  IconButton,
  CloseButton,
  MenuButton,
  BackButton,
  SearchButton,
  MoreButton,
} from './IconButton';
import {
  ButtonWithIcon,
  SendButton,
  DownloadButton,
  AddButton,
  EditButton,
  DeleteButton,
  ShareButton,
  RefreshButton,
} from './ButtonWithIcon';
import type { IconName } from '../../config/iconSystem';

export function IconExamples() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          CareGuide Icon System Examples
        </h1>
        <p className="text-lg text-gray-600">
          아이콘 시스템의 다양한 사용 예제를 확인하세요
        </p>
      </header>

      {/* Basic Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">1. Basic Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg space-y-2">
            <Icon name="heart" size="lg" color="primary" />
            <p className="text-sm text-gray-600">Heart Icon</p>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <Icon name="chat" size="lg" color="primary" />
            <p className="text-sm text-gray-600">Chat Icon</p>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <Icon name="diet" size="lg" color="primary" />
            <p className="text-sm text-gray-600">Diet Icon</p>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <Icon name="pill" size="lg" color="primary" />
            <p className="text-sm text-gray-600">Pill Icon</p>
          </div>
        </div>
      </section>

      {/* Icon Sizes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">2. Icon Sizes</h2>
        <div className="flex items-end gap-6 p-6 bg-gray-50 rounded-lg">
          <div className="text-center space-y-2">
            <Icon name="heart" size="xs" color="primary" />
            <p className="text-xs text-gray-600">xs (12px)</p>
          </div>
          <div className="text-center space-y-2">
            <Icon name="heart" size="sm" color="primary" />
            <p className="text-xs text-gray-600">sm (16px)</p>
          </div>
          <div className="text-center space-y-2">
            <Icon name="heart" size="md" color="primary" />
            <p className="text-xs text-gray-600">md (20px)</p>
          </div>
          <div className="text-center space-y-2">
            <Icon name="heart" size="lg" color="primary" />
            <p className="text-xs text-gray-600">lg (24px)</p>
          </div>
          <div className="text-center space-y-2">
            <Icon name="heart" size="xl" color="primary" />
            <p className="text-xs text-gray-600">xl (32px)</p>
          </div>
          <div className="text-center space-y-2">
            <Icon name="heart" size="2xl" color="primary" />
            <p className="text-xs text-gray-600">2xl (48px)</p>
          </div>
        </div>
      </section>

      {/* Status Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">3. Status Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg flex items-center gap-3">
            <StatusIcon status="success" />
            <span className="text-sm">Success</span>
          </div>
          <div className="p-4 border rounded-lg flex items-center gap-3">
            <StatusIcon status="error" />
            <span className="text-sm">Error</span>
          </div>
          <div className="p-4 border rounded-lg flex items-center gap-3">
            <StatusIcon status="warning" />
            <span className="text-sm">Warning</span>
          </div>
          <div className="p-4 border rounded-lg flex items-center gap-3">
            <StatusIcon status="info" />
            <span className="text-sm">Info</span>
          </div>
        </div>
      </section>

      {/* Loading Spinner */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">4. Loading Spinner</h2>
        <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-lg">
          <div className="text-center space-y-2">
            <LoadingSpinner preset="spinner" color="primary" />
            <p className="text-xs text-gray-600">Normal</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingSpinner preset="spinnerLarge" color="primary" />
            <p className="text-xs text-gray-600">Large</p>
          </div>
        </div>
      </section>

      {/* Icon Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">5. Icon Buttons</h2>

        <div className="space-y-6">
          {/* Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sizes</h3>
            <div className="flex items-center gap-4">
              <IconButton icon="heart" size="sm" aria-label="Small" />
              <IconButton icon="heart" size="md" aria-label="Medium" />
              <IconButton icon="heart" size="lg" aria-label="Large" />
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Variants</h3>
            <div className="flex items-center gap-4">
              <IconButton icon="heart" variant="default" aria-label="Default" />
              <IconButton icon="heart" variant="ghost" aria-label="Ghost" />
              <IconButton icon="heart" variant="outline" aria-label="Outline" />
              <IconButton icon="heart" variant="primary" aria-label="Primary" />
              <IconButton icon="delete" variant="destructive" aria-label="Delete" />
            </div>
          </div>

          {/* Specialized Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Specialized Buttons</h3>
            <div className="flex items-center gap-4">
              <CloseButton />
              <MenuButton isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />
              <BackButton />
              <SearchButton />
              <MoreButton />
            </div>
          </div>
        </div>
      </section>

      {/* Buttons with Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">6. Buttons with Icons</h2>

        <div className="space-y-6">
          {/* Icon Position */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Icon Position</h3>
            <div className="flex items-center gap-4">
              <ButtonWithIcon icon="download" iconPosition="left" variant="outline">
                다운로드
              </ButtonWithIcon>
              <ButtonWithIcon icon="external" iconPosition="right" variant="outline">
                외부 링크
              </ButtonWithIcon>
            </div>
          </div>

          {/* Specialized Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Specialized Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <SendButton variant="success">전송</SendButton>
              <DownloadButton variant="outline">다운로드</DownloadButton>
              <AddButton variant="success">추가</AddButton>
              <EditButton variant="outline">수정</EditButton>
              <DeleteButton>삭제</DeleteButton>
              <ShareButton variant="outline">공유</ShareButton>
              <RefreshButton
                variant="outline"
                refreshing={isLoading}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 2000);
                }}
              >
                새로고침
              </RefreshButton>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Pattern */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">7. Navigation Pattern</h2>
        <div className="space-y-2">
          {(['chat', 'diet', 'quiz', 'community', 'trends'] as IconName[]).map((iconName) => (
            <button
              key={iconName}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name={iconName} size="md" color="primary" />
              <span className="font-medium capitalize">{iconName}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">8. Empty State</h2>
        <div className="border rounded-lg p-12 text-center space-y-4">
          <EmptyStateIcon name="document" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">문서가 없습니다</h3>
            <p className="text-sm text-gray-600">새로운 문서를 추가하세요</p>
          </div>
          <AddButton>문서 추가</AddButton>
        </div>
      </section>

      {/* Health Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">9. Health & Medical Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['heart', 'heartPulse', 'activity', 'pill', 'stethoscope', 'thermometer'] as IconName[]).map((iconName) => (
            <div key={iconName} className="p-4 border rounded-lg space-y-2 text-center">
              <Icon name={iconName} size="xl" color="primary" />
              <p className="text-sm text-gray-600 capitalize">{iconName}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">10. Interactive Example</h2>
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">메시지 입력</h3>
            <CloseButton />
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon="image" variant="ghost" aria-label="이미지 첨부" />
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <IconButton icon="send" variant="primary" aria-label="전송" />
          </div>
        </div>
      </section>

      {/* Color Variations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">11. Color Variations</h2>
        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
          <Icon name="heart" size="xl" color="primary" />
          <Icon name="heart" size="xl" color="success" />
          <Icon name="heart" size="xl" color="error" />
          <Icon name="heart" size="xl" color="warning" />
          <Icon name="heart" size="xl" color="info" />
          <Icon name="heart" size="xl" color="muted" />
        </div>
      </section>
    </div>
  );
}

export default IconExamples;
