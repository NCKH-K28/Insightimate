/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable react/display-name */

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export type MentionListProps = {
  items: string[];
  command: (props: { id: string }) => void;
  onKeyDown: ({ event }: { event: KeyboardEvent }) => boolean;
};
export default forwardRef<{ onKeyDown: MentionListProps['onKeyDown'] }, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command({ id: item });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return (
      <div className='dropdown-menu'>
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              className={index === selectedIndex ? 'is-selected' : ''}
              key={index}
              onClick={() => selectItem(index)}
            >
              {item}
            </button>
          ))
        ) : (
          <div className='item'>No result</div>
        )}
      </div>
    );
  },
);

// type MentionListProps = {};

// export default forwardRef<MentionListProps>((props, ref) => {
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   const selectItem = (index) => {
//     const item = props.items[index];

//     if (item) {
//       props.command({ id: item });
//     }
//   };

//   return null;
// });
