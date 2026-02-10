const worktypes = [
  { id: '1', name: 'Bug' },
  { id: '2', name: 'Feature' },
  { id: '3', name: 'Task' },
];

export const WorkTypeSettings = (props: { projectId: string }) => {
  return (
    <div className='p-4'>
      <h2 className='text-xl font-semibold mb-4'>
        Work Type Settings for Project: {props.projectId}
      </h2>
      <ul>
        {worktypes.map((worktype) => (
          <li key={worktype.id} className='mb-1'>
            {worktype.name}
          </li>
        ))}
      </ul>
    </div>
  );
};
