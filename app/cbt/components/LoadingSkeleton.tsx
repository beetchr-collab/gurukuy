/**
 * Komponen LoadingSkeleton
 * Menampilkan skeleton loading modern untuk UX yang lebih baik
 * Support untuk:
 * - ExamHeader skeleton
 * - QuestionCard skeleton
 * - Sidebar skeleton
 */

'use client';

import React from 'react';

interface SkeletonProps {
  isDarkMode: boolean;
  count?: number;
}

/**
 * Skeleton untuk header ujian
 */
export const ExamHeaderSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`border-bottom py-3 px-3 ${isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}`}>
      <div className="row align-items-center">
        <div className="col-12 col-md-auto mb-3 mb-md-0">
          <div className="d-flex align-items-center gap-3">
            {/* Logo Skeleton */}
            <div
              className={`rounded-circle ${isDarkMode ? 'bg-secondary' : 'bg-light'} placeholder`}
              style={{ width: '45px', height: '45px' }}
            />
            {/* Info Skeleton */}
            <div style={{ flex: 1 }}>
              <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '20px', width: '150px' }} />
              <div className={`placeholder placeholder-wave ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '16px', width: '100px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton untuk question card
 */
export const QuestionCardSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`card border-0 shadow-sm rounded-4 ${isDarkMode ? 'bg-dark' : 'bg-white'}`}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="mb-4">
          <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '24px', width: '100px' }} />
          <div className={`placeholder placeholder-wave mb-3 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '16px', width: '150px' }} />
        </div>

        {/* Pertanyaan */}
        <div className="mb-3">
          <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '24px', width: '100%' }} />
          <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '24px', width: '95%' }} />
          <div className={`placeholder placeholder-wave ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '24px', width: '80%' }} />
        </div>

        {/* Opsi */}
        <div className="d-flex flex-column gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="d-flex gap-2">
              <div className={`placeholder ${isDarkMode ? 'bg-secondary' : ''}`} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
              <div className={`placeholder placeholder-wave flex-grow-1 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '20px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton untuk sidebar
 */
export const SidebarSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`p-3 ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
      {/* Header */}
      <div className="mb-4">
        <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '20px', width: '80%' }} />
      </div>

      {/* Grid */}
      <div className="row row-cols-3 g-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="col">
            <div
              className={`placeholder placeholder-wave ${isDarkMode ? 'bg-secondary' : 'bg-light'}`}
              style={{ height: '40px', borderRadius: '20px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton untuk timer box
 */
export const TimerBoxSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`border-bottom py-2 px-3 ${isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}`}>
      <div className="row align-items-center gap-2">
        <div className="col-auto">
          <div className={`card border-0 ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
            <div className="card-body p-2">
              <div className={`placeholder placeholder-wave mb-2 ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '16px', width: '60px' }} />
              <div className={`placeholder placeholder-wave ${isDarkMode ? 'bg-secondary' : ''}`} style={{ height: '32px', width: '80px' }} />
            </div>
          </div>
        </div>
        <div className="col-auto">
          <div className={`placeholder ${isDarkMode ? 'bg-secondary' : 'bg-light'}`} style={{ width: '100px', height: '28px', borderRadius: '20px' }} />
        </div>
      </div>
    </div>
  );
};

/**
 * Full page skeleton untuk exam page
 */
export const ExamPageSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`d-flex flex-column h-100 ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
      <TimerBoxSkeleton isDarkMode={isDarkMode} />
      <ExamHeaderSkeleton isDarkMode={isDarkMode} />

      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Sidebar */}
        <div className={`d-none d-lg-block border-end ${isDarkMode ? 'border-secondary' : ''}`} style={{ width: '200px', overflowY: 'auto' }}>
          <SidebarSkeleton isDarkMode={isDarkMode} />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 overflow-y-auto">
          <div className="container-fluid">
            <QuestionCardSkeleton isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
};
