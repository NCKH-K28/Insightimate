import { SourceRef } from '../types';

const sources: SourceRef[] = [
  {
    id: 'source1',
    srcType: 'file',
    srcId: 's3://your-s3-bucket/source1.pdf',
  },
  {
    id: 'source2',
    srcType: 'file',
    srcId: 's3://your-s3-bucket/source2.pdf',
  },
  {
    id: 'source3',
    srcType: 'file',
    srcId: 's3://your-s3-bucket/source3.pdf',
  },
];

const SourcesList = () => {
  return (
    <div className='space-y-4'>
      <h2>Sources Library</h2>
      <ul className='list-disc list-inside'>
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.srcId} target='_blank' rel='noopener noreferrer'>
              {source.id} ({source.srcType})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function SourcesTab() {
  return (
    <div className='space-y-4'>
      <SourcesList />
    </div>
  );
}
