'use client';

import KanbanBoard from '@/components/dashboard/board/KanbanBoard';

export default function BoardPage() {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Board</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your job applications through every stage.</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
