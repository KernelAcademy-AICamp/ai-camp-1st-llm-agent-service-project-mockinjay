/**
 * LayoutExamplePage - Visual demonstration of layout components
 * This page showcases all layout components and patterns
 * Use this as a reference for implementing new pages
 *
 * TO USE THIS PAGE:
 * 1. Add route in AppRoutes.tsx:
 *    <Route path="/layout-examples" element={<LayoutExamplePage />} />
 *
 * 2. Navigate to /layout-examples to see all examples
 */

import React, { useState } from 'react';
import {
  PageContainer,
  PageSection,
  GridLayout,
  TwoColumnLayout,
} from '../components/layout/index';
import { Code, Layout } from 'lucide-react';

const LayoutExamplePage: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>('all');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <PageContainer>
          <div className="py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Layout className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-careplus-text-primary">
                  Layout System Examples
                </h1>
                <p className="text-careplus-text-secondary mt-1">
                  Interactive examples of all layout components and patterns
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'containers', 'grids', 'columns'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedExample(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedExample === tab
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Examples Container */}
      <PageContainer maxWidth="2xl">
        <div className="space-y-12">
          {/* PageContainer Examples */}
          {(selectedExample === 'all' || selectedExample === 'containers') && (
            <PageSection
              title="PageContainer Examples"
              subtitle="Standard page wrapper with responsive padding and max-width"
              spacing="lg"
            >
              <div className="space-y-6">
                {/* Small Container */}
                <ExampleBlock
                  title="Small Container (640px)"
                  description="Best for forms, login pages, narrow content"
                  code={`<PageContainer maxWidth="sm">
  <YourContent />
</PageContainer>`}
                >
                  <PageContainer maxWidth="sm">
                    <div className="bg-white rounded-lg border-2 border-dashed border-primary-300 p-6 text-center">
                      <p className="text-sm text-gray-600">Max width: 640px</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Perfect for login forms and narrow content
                      </p>
                    </div>
                  </PageContainer>
                </ExampleBlock>

                {/* Medium Container */}
                <ExampleBlock
                  title="Medium Container (768px)"
                  description="Best for articles, reading content"
                  code={`<PageContainer maxWidth="md">
  <Article />
</PageContainer>`}
                >
                  <PageContainer maxWidth="md">
                    <div className="bg-white rounded-lg border-2 border-dashed border-secondary-300 p-6 text-center">
                      <p className="text-sm text-gray-600">Max width: 768px</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Optimal line length for reading
                      </p>
                    </div>
                  </PageContainer>
                </ExampleBlock>

                {/* Large Container (Default) */}
                <ExampleBlock
                  title="Large Container (1024px) - Default"
                  description="Best for most pages"
                  code={`<PageContainer>
  {/* maxWidth="lg" is the default */}
  <StandardPage />
</PageContainer>`}
                >
                  <PageContainer maxWidth="lg">
                    <div className="bg-white rounded-lg border-2 border-dashed border-success-300 p-6 text-center">
                      <p className="text-sm text-gray-600">Max width: 1024px (default)</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Standard width for most pages
                      </p>
                    </div>
                  </PageContainer>
                </ExampleBlock>

                {/* XL Container */}
                <ExampleBlock
                  title="XL Container (1280px)"
                  description="Best for dashboards, wide content"
                  code={`<PageContainer maxWidth="xl">
  <Dashboard />
</PageContainer>`}
                >
                  <PageContainer maxWidth="xl">
                    <div className="bg-white rounded-lg border-2 border-dashed border-warning-300 p-6 text-center">
                      <p className="text-sm text-gray-600">Max width: 1280px</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Great for dashboards and analytics
                      </p>
                    </div>
                  </PageContainer>
                </ExampleBlock>
              </div>
            </PageSection>
          )}

          {/* GridLayout Examples */}
          {(selectedExample === 'all' || selectedExample === 'grids') && (
            <PageSection
              title="GridLayout Examples"
              subtitle="Responsive grids for card layouts"
              spacing="lg"
            >
              <div className="space-y-6">
                {/* 3 Column Grid */}
                <ExampleBlock
                  title="3 Column Grid (Default)"
                  description="1 col mobile, 2 tablet, 3 desktop"
                  code={`<GridLayout>
  <Card />
  <Card />
  <Card />
</GridLayout>`}
                >
                  <GridLayout>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 p-6 text-center"
                      >
                        <p className="text-lg font-semibold text-primary-600">Card {i}</p>
                      </div>
                    ))}
                  </GridLayout>
                </ExampleBlock>

                {/* 4 Column Grid */}
                <ExampleBlock
                  title="4 Column Grid with Large Gap"
                  description="Custom columns and spacing"
                  code={`<GridLayout columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
  <Card />
</GridLayout>`}
                >
                  <GridLayout columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 p-6 text-center"
                      >
                        <p className="text-lg font-semibold text-secondary-600">
                          Card {i}
                        </p>
                      </div>
                    ))}
                  </GridLayout>
                </ExampleBlock>

                {/* 2 Column Grid */}
                <ExampleBlock
                  title="2 Column Grid"
                  description="Simple two-column layout"
                  code={`<GridLayout columns={{ xs: 1, md: 2 }} gap="md">
  <Card />
</GridLayout>`}
                >
                  <GridLayout columns={{ xs: 1, md: 2 }} gap="md">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 p-6 text-center"
                      >
                        <p className="text-lg font-semibold text-success-600">
                          Card {i}
                        </p>
                      </div>
                    ))}
                  </GridLayout>
                </ExampleBlock>
              </div>
            </PageSection>
          )}

          {/* TwoColumnLayout Examples */}
          {(selectedExample === 'all' || selectedExample === 'columns') && (
            <PageSection
              title="TwoColumnLayout Examples"
              subtitle="Sidebar + content layouts with responsive stacking"
              spacing="lg"
            >
              <div className="space-y-6">
                {/* 1/3 - 2/3 Layout */}
                <ExampleBlock
                  title="Sidebar Layout (1/3 - 2/3)"
                  description="Standard sidebar with sticky option"
                  code={`<TwoColumnLayout
  left={<Sidebar />}
  right={<Content />}
  leftWidth="1/3"
  stickyLeft
/>`}
                >
                  <TwoColumnLayout
                    left={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-primary-600 mb-4">
                          Sidebar (33%)
                        </p>
                        <div className="space-y-2">
                          <div className="h-8 bg-gray-100 rounded"></div>
                          <div className="h-8 bg-gray-100 rounded"></div>
                          <div className="h-8 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    }
                    right={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-secondary-600 mb-4">
                          Main Content (67%)
                        </p>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-100 rounded"></div>
                          <div className="h-4 bg-gray-100 rounded"></div>
                          <div className="h-4 bg-gray-100 rounded"></div>
                          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                        </div>
                      </div>
                    }
                    leftWidth="1/3"
                  />
                </ExampleBlock>

                {/* 1/4 - 3/4 Layout */}
                <ExampleBlock
                  title="Narrow Sidebar (1/4 - 3/4)"
                  description="Narrow filter sidebar"
                  code={`<TwoColumnLayout
  left={<FilterPanel />}
  right={<Results />}
  leftWidth="1/4"
  stickyLeft
/>`}
                >
                  <TwoColumnLayout
                    left={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-primary-600 mb-4">
                          Filters (25%)
                        </p>
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-100 rounded"></div>
                          <div className="h-6 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    }
                    right={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-secondary-600 mb-4">
                          Results (75%)
                        </p>
                        <GridLayout columns={{ xs: 1, sm: 2, lg: 3 }} gap="md">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded"></div>
                          ))}
                        </GridLayout>
                      </div>
                    }
                    leftWidth="1/4"
                  />
                </ExampleBlock>

                {/* 50/50 Layout */}
                <ExampleBlock
                  title="Split Layout (50/50)"
                  description="Editor + Preview style"
                  code={`<TwoColumnLayout
  left={<Editor />}
  right={<Preview />}
  leftWidth="1/2"
  reverseOnMobile
/>`}
                >
                  <TwoColumnLayout
                    left={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-primary-600 mb-4">
                          Editor (50%)
                        </p>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        </div>
                      </div>
                    }
                    right={
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="font-semibold text-secondary-600 mb-4">
                          Preview (50%)
                        </p>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    }
                    leftWidth="1/2"
                    reverseOnMobile
                  />
                </ExampleBlock>
              </div>
            </PageSection>
          )}

          {/* PageSection Examples */}
          {selectedExample === 'all' && (
            <PageSection
              title="PageSection Examples"
              subtitle="Section dividers with consistent spacing"
              spacing="lg"
            >
              <div className="space-y-6">
                <ExampleBlock
                  title="Section with Title and Action"
                  code={`<PageSection
  title="Recent Posts"
  subtitle="Latest from the community"
  action={<Button>View All</Button>}
>
  <Content />
</PageSection>`}
                >
                  <div className="bg-gray-50 rounded-lg p-4">
                    <PageSection
                      title="Recent Posts"
                      subtitle="Latest from the community"
                      action={
                        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
                          View All
                        </button>
                      }
                    >
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="text-gray-600">Section content goes here...</p>
                      </div>
                    </PageSection>
                  </div>
                </ExampleBlock>
              </div>
            </PageSection>
          )}
        </div>
      </PageContainer>
    </div>
  );
};

// Helper component for code examples
const ExampleBlock: React.FC<{
  title: string;
  description?: string;
  code: string;
  children: React.ReactNode;
}> = ({ title, description, code, children }) => {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-careplus-text-primary mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-careplus-text-secondary">{description}</p>
            )}
          </div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Code size={16} />
            {showCode ? 'Hide' : 'Show'} Code
          </button>
        </div>

        {showCode && (
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
            <code>{code}</code>
          </pre>
        )}
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
};

export default LayoutExamplePage;
