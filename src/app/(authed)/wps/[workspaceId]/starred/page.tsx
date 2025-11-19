'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
  } | null;
}

export default function StarredPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;

  const [userId, setUserId] = useState<string | null>(null);

  // 🟦 FETCH USER ID
  useEffect(() => {
    let isMounted = true; // Prevent memory leak
    
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        
        // ✅ Check response status
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // ✅ Check if component still mounted & data valid
        if (isMounted && data?.id) {
          setUserId(data.id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        // ✅ Set null on error to indicate fetch failed
        if (isMounted) {
          setUserId(null);
        }
      }
    };
    
    fetchUser();
    
    // ✅ Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // ⛔ Khi chưa có userId → chưa query API
  const enabled = !!workspaceId && !!userId;

  // ⭐ Fetch starred issues FROM REAL API
  const { data: starredIssues, isLoading, error, refetch } = useQuery({
    queryKey: ['starred-issues', workspaceId],
    enabled,
    queryFn: async () => {
      const res = await fetch(`/api/v2/star`, {
        headers: { 'x-user-id': userId ?? '' }
      });

      if (!res.ok) throw new Error("Failed to fetch starred issues");

      const response = await res.json();
      
      // Transform response to match StarredIssue interface
      return response.data.map((star: any) => ({
        id: star.issue.id,
        key: star.issue.key,
        summary: star.issue.summary,
        projectId: star.issue.projectId,
        status: star.issue.status?.name,
        priority: star.issue.priority?.name,
        assignee: star.issue.assignee ? {
          id: star.issue.assignee.id,
          name: star.issue.assignee.name,
          avatar: star.issue.assignee.avatar,
        } : null,
      })) as StarredIssue[];
    }
  });

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="text-red-500" />
      </div>
    );
  }

  // Không render gì cho đến khi có userId
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
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

        {starredIssues && (
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">
              {starredIssues.length}
            </div>
            <p className="text-xs text-gray-500">
              issue{starredIssues.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="animate-spin text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">Loading starred issues...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load starred issues.
            <Button size="sm" variant="outline" onClick={() => refetch()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!starredIssues || starredIssues.length === 0) && (
        <div className="flex flex-col items-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
          <Star className="text-gray-400 mb-3" size={48} />
          <h2 className="text-lg font-semibold text-gray-700">No starred issues yet</h2>
          <p className="text-gray-500 text-sm max-w-xs text-center mb-4">
            Star your favorite issues to keep track of them.
          </p>
          <Link href={`/wps/${workspaceId}/projects`}>
            <Button>Browse Issues</Button>
          </Link>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && starredIssues && starredIssues.length > 0 && (
        <div className="grid gap-3">
          {starredIssues.map(issue => (
            <Link
              key={issue.id}
              href={`/wps/${workspaceId}/projects/${issue.projectId}/issues/${issue.id}`}
              className="block group bg-white border rounded-lg p-4 hover:shadow-md hover:border-yellow-300 cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-800 truncate">
                      {issue.key}
                    </span>

                    {issue.status && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {issue.status}
                      </span>
                    )}

                    {issue.priority && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
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

                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {issue.summary}
                  </h3>

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

                {/* Star Button */}
                <div 
                  onClick={(e) => e.preventDefault()} 
                  className="flex-shrink-0"
                >
                  <IssueStarButton
                    issueId={issue.id}
                    initialIsStarred={true}
                    initialStarCount={1}
                    variant="icon-only"
                    size="md"
                    onStarToggle={() => refetch()}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      {starredIssues && starredIssues.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Star issues to keep them easily accessible.
          </p>
        </div>
      )}
    </div>
  );
}
