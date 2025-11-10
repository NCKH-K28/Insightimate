 

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const template: Record<string, string> = {
  story: `User Story
As a [type of user], I want [an action] so that [a benefit/a value].
Acceptance Criteria:
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]
`,
  scenario: `Scenario: [Title of the scenario]
Given [initial context],
When [an event occurs],
Then [ensure some outcomes].
`,
};

type AITextInputProps = {
  onChange?: (value: string) => void;
};
export const AITextInput = ({ onChange }: AITextInputProps) => {
  const [count, setCount] = React.useState(0);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setCount((e.target as HTMLTextAreaElement).value.length);
  };

  const insertAtSelection = (insertText: string) => {
    const ta = textAreaRef.current;
    if (!ta) return;

    if (document.activeElement !== ta) ta.focus({ preventScroll: true });

    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;

    let usedExec: boolean = false;
    if ('execCommand' in document) usedExec = document.execCommand('insertText', false, insertText);
    if ('queryCommandSupported' in document) {
      usedExec = usedExec && document.queryCommandSupported('insertText');
    } else if ('getSupportedCommands' in document) {
      usedExec = usedExec && (document as any).getSupportedCommands().includes('insertText');
    } else usedExec = false;

    if (!usedExec) {
      ta.setRangeText(insertText, start, end, 'end');
      setCount(ta.value.length);
    }
  };

  React.useEffect(() => {
    if (!textAreaRef.current) return;
    if (!onChange) return;

    const onInputChange = (e: Event) => {
      if (!e.target) return;
      if ('value' in e.target && typeof e.target.value === 'string') {
        const v = e.target.value;
        onChange(v);
      }
    };
    const ta = textAreaRef.current;
    ta.addEventListener('input', onInputChange);
    return () => {
      ta.removeEventListener('input', onInputChange);
    };
  }, [onChange]);

  return (
    <div>
      <Label htmlFor='ai-text-input' className='mb-2'>
        Enter Text: <span className='text-xs text-muted-foreground'>({count}/5000 characters)</span>
      </Label>

      <Textarea
        ref={textAreaRef}
        defaultValue=''
        onInput={handleInput}
        placeholder='Enter your text here...'
        className='w-full max-h-32'
      />

      <div className='mt-1 text-sm text-muted-foreground'>
        <Badge
          variant='outline'
          className='mr-2 cursor-pointer'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertAtSelection(template.story)}
        >
          story
        </Badge>

        <Badge
          variant='outline'
          className='mr-2 cursor-pointer'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertAtSelection(template.scenario)}
        >
          scenario
        </Badge>
      </div>
    </div>
  );
};

export default AITextInput;
