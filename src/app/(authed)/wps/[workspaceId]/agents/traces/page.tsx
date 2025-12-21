'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams } from 'next/navigation';

interface Trace {
  id: string;
  runId: string;
  input: string;
  status: string;
  steps: any[];
  finalOutput: string | null;
  createdAt: string;
}

export default function TraceViewerPage() {
  const params = useParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [traces, setTraces] = useState<Trace[]>([]);

  async function fetchTraces() {
    const res = await fetch(`/api/v2/workspaces/${params.workspaceId}/agent/traces`);
    if (res.ok) {
      const data = await res.json();
      setTraces(data);
    }
  }

  async function handleRun() {
    if (!input) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/workspaces/${params.workspaceId}/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error('Failed to run');
      setInput('');
      // Give DB a split second to commit
      setTimeout(fetchTraces, 1000);
    } catch (err) {
      console.error(err);
      alert('Error running agent');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTraces();
  }, []);

  return (
    <div className='p-6 space-y-6'>
      <h1 className='text-2xl font-bold'>Agent Playground</h1>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Run New Agent Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g., Get my open issues'
              disabled={loading}
            />
            <Button onClick={handleRun} disabled={loading || !input}>
              {loading ? 'Running...' : 'Run'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>Execution Traces</h2>
        <Button variant='outline' onClick={fetchTraces}>
          Refresh
        </Button>
      </div>

      <div className='grid gap-4'>
        {traces.length === 0 ? (
          <div className='text-muted-foreground'>No traces found. Run a task above!</div>
        ) : (
          traces.map((trace) => (
            <Card key={trace.id}>
              <CardHeader>
                <CardTitle className='flex justify-between items-center'>
                  <span className='text-sm font-mono'>{trace.runId.slice(0, 8)}...</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      trace.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {trace.status}
                  </span>
                </CardTitle>
                <div className='text-xs text-muted-foreground'>
                  {new Date(trace.createdAt).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className='space-y-2 text-sm'>
                <div>
                  <span className='font-semibold'>Goal:</span> {trace.input}
                </div>
                <Separator />
                <div>
                  <span className='font-semibold'>Steps ({trace.steps?.length || 0}):</span>
                  {trace.steps?.map((step: any, i: number) => (
                    <div key={i} className='mt-2 bg-muted/50 p-2 rounded'>
                      <div className='font-medium text-xs text-blue-600 uppercase mb-1'>
                        {step.tool}
                      </div>
                      <div className='text-xs mb-1'>Input: {JSON.stringify(step.input)}</div>
                      <div className='text-xs text-muted-foreground truncate'>
                        Output: {JSON.stringify(step.output).slice(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
                {trace.finalOutput && (
                  <>
                    <Separator />
                    <div className='bg-primary/5 p-2 rounded'>
                      <span className='font-semibold text-primary'>High-Level Answer:</span>
                      <p className='mt-1'>{trace.finalOutput}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
