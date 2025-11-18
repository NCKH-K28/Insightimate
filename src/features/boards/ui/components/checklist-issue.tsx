'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: 1, text: 'aaa', completed: false },
    { id: 2, text: 'aa', completed: false },
    { id: 3, text: 'aaaa', completed: false },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleToggle = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem: ChecklistItem = {
      id: Date.now(),
      text: newItemText.trim(),
      completed: false,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: editingText } : item)),
    );
    setEditingItemId(null);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length ? (completedCount / items.length) * 100 : 0;
  const isDone = progress === 100;

  return (
    <div className='w-full p-4 space-y-3 border rounded-lg shadow-sm bg-white'>
      {/* Thanh tiến trình */}
      <div>
        <div className='flex items-center justify-between mb-1 '>
          <span className='text-sm font-medium'>{Math.round(progress)}%</span>
          {isDone && <span className='text-xs text-green-600 font-medium'>Done </span>}
        </div>

        <Progress
          value={progress}
          className={`h-2 transition-colors ${isDone ? 'bg-green-200' : 'bg-gray-200'}`}
          style={
            {
              // màu thanh tiến trình (foreground)
              '--progress-foreground': isDone ? '#22c55e' : '#3b82f6',
            } as React.CSSProperties
          }
        />
      </div>

      {/* Danh sách checklist */}
      <div className='space-y-2'>
        {items.map((item) => (
          <div key={item.id} className='flex items-center justify-between gap-2 group'>
            <div className='flex items-center gap-2 w-full'>
              <Checkbox checked={item.completed} onCheckedChange={() => handleToggle(item.id)} />

              {editingItemId === item.id ? (
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => handleSaveEdit(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(item.id);
                  }}
                  className='h-7 text-sm'
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {item.text}
                </span>
              )}
            </div>

            {/* Menu 3 chấm */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='opacity-0 group-hover:opacity-100 transition'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-28'>
                <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                <DropdownMenuItem className='text-red-600' onClick={() => handleDelete(item.id)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Thêm item mới */}
      {isAdding ? (
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Enter title...'
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            className='h-8 text-sm'
            autoFocus
          />
          <Button variant='outline' size='sm' onClick={handleAddItem} className='text-xs'>
            Add
          </Button>
        </div>
      ) : (
        <Button variant='outline' className='w-fit text-sm' onClick={() => setIsAdding(true)}>
          Add an item
        </Button>
      )}
    </div>
  );
}
