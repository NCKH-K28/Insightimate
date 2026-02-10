'use client';

import { ProjectImport } from '@/contracts/project';
import { defaultProject } from '@/features/projects/contants';
import { upsertProjectDraftAtom } from '@/features/projects/state/project-draft-atom';
import { useSetAtom } from 'jotai';
import { createId } from '@paralleldrive/cuid2';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const setUpsert = useSetAtom(upsertProjectDraftAtom);

  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        try {
          const text = await file.text();
          const project: ProjectImport = JSON.parse(text);
          console.log('Uploaded project:', project);
          const draftId = createId();
          setUpsert({ id: draftId, data: project });

          // navigate to import page with draft id
          router.push(`/projects/import?d=${draftId}`);
        } catch (error) {
          console.error('Failed to read or parse the file:', error);
        }
      }
    };
    fileInput.click();
    fileInput.remove();
  };

  const exportMockProject = () => {
    const mockProject = {
      ...defaultProject,
      id: createId(),
      key: `MOCK-${Math.floor(Math.random() * 1000)}`,
      name: 'Mock Project',
    };

    const dataStr = JSON.stringify(mockProject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'mock-project.json';
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button
        onClick={handleUpload}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        Upload Project JSON
      </button>

      <button
        onClick={exportMockProject}
        className='ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
      >
        Export Mock Project JSON
      </button>
    </div>
  );
}
