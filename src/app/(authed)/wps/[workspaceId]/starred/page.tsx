'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IssueStarButton } from '@/components/issue-star-button';
import Link from 'next/link';

interface StarredIssue {
  id: string;
  key: string;
  summary: string;
  projectId: string;
  status?: string;
  priority?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function StarredPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Giả lập fetch starred issues (thay bằng API thực tế)
  const { data: starredIssues, isLoading, error, refetch } = useQuery({
    queryKey: ['starred-issues', workspaceId],
    queryFn: async () => {
      // TODO: Replace với API thực tế
      // const response = await fetch(`/api/v2/issues/starred`);
      // return response.json();
      
      // Mock data for now
      return [
        {
          id: 'issue-1',
          key: 'PROJ-123',
          summary: 'Fix critical login bug',
          projectId: 'proj-1',
          status: 'In Progress',
          priority: 'High',
          assignee: {
            id: 'user-1',
            name: 'Alice',
            avatar: 'https://i.pravatar.cc/32?u=alice',
          },
        },
        {
          id: 'issue-2',
          key: 'PROJ-456',
          summary: 'Design new homepage layout',
          projectId: 'proj-1',
          status: 'Open',
          priority: 'Medium',
          assignee: {
            id: 'user-2',
            name: 'Bob',
            avatar: 'https://i.pravatar.cc/32?u=bob',
          },
        },
        {
          id: 'issue-3',
          key: 'PROJ-789',
          summary: 'Database optimization for performance',
          projectId: 'proj-2',
          status: 'Open',
          priority: 'High',
          assignee: null,
        },
      ] as StarredIssue[];
    },
    enabled: !!workspaceId,
  });

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="text-yellow-600" size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Starred Issues</h1>
            <p className="text-sm text-gray-600 mt-1">
              Your favorite issues in {starredIssues?.length ?? 0} total
            </p>
          </div>
        </div>

        {starredIssues && starredIssues.length > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">
              {starredIssues.length}
            </div>
            <p className="text-xs text-gray-500">issue{starredIssues.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">Loading starred issues...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load starred issues. Please try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!starredIssues || starredIssues.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Star className="text-gray-400 mb-3" size={48} />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No starred issues yet
          </h2>
          <p className="text-gray-500 text-sm mb-4 max-w-xs text-center">
            Star your favorite issues to keep track of them. Click the star icon on any issue to add it here.
          </p>
          <Link href={`/wps/${workspaceId}/projects`}>
            <Button variant="default" size="sm">
              Browse Issues
            </Button>
          </Link>
        </div>
      )}

      {/* Issues List */}
      {!isLoading && !error && starredIssues && starredIssues.length > 0 && (
        <div className="grid gap-3">
          {starredIssues.map((issue) => (
            <div
              key={issue.id}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-yellow-300 cursor-pointer"
              onClick={() => setSelectedIssueId(issue.id)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Issue Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/wps/${workspaceId}/projects/${issue.projectId}/board?issue=${issue.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 truncate"
                    >
                      {issue.key}
                    </Link>

                    {/* Status Badge */}
                    {issue.status && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {issue.status}
                      </span>
                    )}

                    {/* Priority Badge */}
                    {issue.priority && (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          issue.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : issue.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {issue.priority}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                    {issue.summary}
                  </h3>

                  {/* Assignee */}
                  {issue.assignee && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      {issue.assignee.avatar && (
                        <img
                          src={issue.assignee.avatar}
                          alt={issue.assignee.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span>Assigned to {issue.assignee.name}</span>
                    </div>
                  )}
                </div>

                {/* Right: Star Button */}
                <div className="flex-shrink-0">
                  <IssueStarButton
                    issueId={issue.id}
                    userId="user-current" // TODO: Get from session/auth
                    initialIsStarred={true}
                    initialStarCount={1}
                    variant="icon-only"
                    size="md"
                    onStarToggle={(isStarred) => {
                      if (!isStarred) {
                        // Remove from list
                        refetch();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {!isLoading && starredIssues && starredIssues.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Star issues to mark them as favorites. You can quickly access all starred issues from this page.
          </p>
        </div>
      )}
    </div>
  );
}
