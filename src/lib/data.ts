import { FileText, Image as ImageIcon, CheckCircle, CreditCard, Layout } from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'upload' | 'status' | 'comment' | 'design';
  files?: Array<{ name: string; size: string; type: 'xls' | 'pdf' }>;
  tags?: { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline' }[];
  images?: string[]; // CSS colors for placeholder
}

export interface Project {
  id: string;
  name: string;
  updated: string;
  progress: number;
  hours: string;
  initial: string;
  color: string;
}

export interface Connection {
  id: string;
  name: string;
  role: string; // or connection count
  connected: boolean;
  avatarColor: string;
  initials: string;
}

export interface Team {
  id: string;
  name: string;
  members: number;
  icon: string;
}

export const activities: Activity[] = [
  {
    id: '1',
    title: 'Task report - uploaded weekly reports',
    description: 'Added 3 files to task',
    time: 'NOW',
    type: 'upload',
    files: [
      { name: 'weekly-reports.xls', size: '12kb', type: 'xls' },
      { name: 'weekly-reports.xls', size: '4kb', type: 'xls' },
      { name: 'monthly-reports.xls', size: '8kb', type: 'xls' },
    ],
  },
  {
    id: '2',
    title: 'Project status updated',
    description: 'Marked # FR-6 as',
    time: 'TODAY',
    type: 'status',
    tags: [{ label: 'Completed', color: 'default' }],
  },
  {
    id: '3',
    title: 'New card styles added',
    description: 'Added 3 card to Payments',
    time: 'YESTERDAY',
    type: 'design',
    images: ['bg-blue-200', 'bg-green-200', 'bg-pink-200'],
  },
];

export const connections: Connection[] = [
  {
    id: '1',
    name: 'Rachel Doe',
    role: '25 connections',
    connected: true,
    avatarColor: 'bg-blue-100 text-blue-600',
    initials: 'R',
  },
  {
    id: '2',
    name: 'Isabella Finley',
    role: '79 connections',
    connected: false,
    avatarColor: 'bg-yellow-100 text-yellow-600',
    initials: 'IF',
  },
  {
    id: '3',
    name: 'David Harrison',
    role: '0 connections',
    connected: true,
    avatarColor: 'bg-gray-100 text-gray-600',
    initials: 'D',
  },
  {
    id: '4',
    name: 'Costa Quinn',
    role: '9 connections',
    connected: false,
    avatarColor: 'bg-green-100 text-green-600',
    initials: 'C',
  },
];

export const teams: Team[] = [
  { id: '1', name: '#digitalmarketing', members: 8, icon: 'text-gray-500' },
  { id: '2', name: '#ethereum', members: 14, icon: 'text-gray-500' },
  { id: '3', name: '#conference', members: 3, icon: 'text-gray-500' },
  { id: '4', name: '#supportteam', members: 3, icon: 'text-gray-500' },
  { id: '5', name: '#invoices', members: 3, icon: 'text-gray-500' },
];

export const projects: Project[] = [
  {
    id: '1',
    name: 'UI/UX',
    updated: 'Updated 2 hours ago',
    progress: 0,
    hours: '4:25',
    initial: 'U',
    color: 'bg-gray-100 text-gray-600',
  },
  {
    id: '2',
    name: 'Get a complete audit store',
    updated: 'Updated 1 day ago',
    progress: 45,
    hours: '18:42',
    initial: 'G',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: '3',
    name: 'Build stronger customer relationships',
    updated: 'Updated 2 days ago',
    progress: 59,
    hours: '9:01',
    initial: 'B',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: '4',
    name: 'Update subscription method',
    updated: 'Updated 2 days ago',
    progress: 57,
    hours: '0:37',
    initial: 'U',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: '5',
    name: 'Create a new theme',
    updated: 'Updated 1 week ago',
    progress: 100,
    hours: '24:12',
    initial: 'C',
    color: 'bg-red-100 text-red-600',
  },
  {
    id: '6',
    name: 'Improve social banners',
    updated: 'Updated 1 week ago',
    progress: 0,
    hours: '8:08',
    initial: 'I',
    color: 'bg-purple-100 text-purple-600',
  },
];
