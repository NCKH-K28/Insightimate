/* eslint-disable @typescript-eslint/no-unused-vars */

import { computePosition, flip, shift } from '@floating-ui/dom';
import { Editor, posToDOMRect, ReactRenderer } from '@tiptap/react';

import MentionList from './mention-list';
import { MentionOptions } from '@tiptap/extension-mention';

const updatePosition = (editor: Editor, element: any) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content';
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

const sourceSuggestion: MentionOptions['suggestions'][number] = {
  char: '[[',
  items: ({ query }) => {
    return ['My project'];
  },
  render: () => {
    let component: ReactRenderer<{ onKeyDown: any }>;

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor });
        if (!props.clientRect) return;
        component.element.style.position = 'absolute';
        document.body.appendChild(component.element);
        updatePosition(props.editor, component.element);
      },

      onUpdate(props) {
        component.updateProps(props);
        if (!props.clientRect) return;
        updatePosition(props.editor, component.element);
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        component.destroy();
      },
    };
  },
  allowSpaces: true,
};

const userSuggestion: MentionOptions['suggestions'][number] = {
  char: '@',
  items: ({ query }) => {
    return ['Lea Thompson', 'Cyndi Lauper', 'Tom Cruise', 'Madonna', 'Jerry Hall'];
  },
  render: () => {
    let component: ReactRenderer<{ onKeyDown: any }>;

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor });
        if (!props.clientRect) return;
        component.element.style.position = 'absolute';
        document.body.appendChild(component.element);
        updatePosition(props.editor, component.element);
      },

      onUpdate(props) {
        component.updateProps(props);
        if (!props.clientRect) return;
        updatePosition(props.editor, component.element);
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        component.destroy();
      },
    };
  },
  allowSpaces: true,
};

export const mentionSuggestions = [userSuggestion, sourceSuggestion];
export default mentionSuggestions;
