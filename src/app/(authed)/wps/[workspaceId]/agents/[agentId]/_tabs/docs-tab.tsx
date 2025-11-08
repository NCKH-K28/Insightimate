type DocRef = {
  id: string;
  title: string;
  key: string; // key in s3
};

const docs: DocRef[] = [
  { id: '1', title: 'Document 1', key: 'doc1.pdf' },
  { id: '2', title: 'Document 2', key: 'doc2.pdf' },
  { id: '3', title: 'Document 3', key: 'doc3.pdf' },
];

const DocsList = () => {
  return (
    <div>
      <h2>Documents</h2>
      <ul>
        {docs.map((doc) => (
          <li key={doc.id}>
            <a href={`https://your-s3-bucket/${doc.key}`} target='_blank' rel='noopener noreferrer'>
              {doc.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function DocsTab() {
  return (
    <div>
      <DocsList />
    </div>
  );
}
