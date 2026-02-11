import { CommandItem } from './command.types';

export const STATIC_COMMANDS: CommandItem[] = [
  {
    id: 'profile',
    title: 'Open Profile',
    actionKey: 'OPEN_PROFILE',
    keywords: ['me', 'account'],
  },
  {
    id: 'records',
    title: 'Open Records',
    actionKey: 'OPEN_RECORDS',
    keywords: ['files', 'reports'],
  },
  {
    id: 'calendar',
    title: 'Open Calendar',
    actionKey: 'OPEN_CALENDAR',
    keywords: ['appointments'],
  },
  {
    id: 'upload',
    title: 'Upload Prescription',
    actionKey: 'UPLOAD_RECORD',
    keywords: ['rx', 'scan'],
  },
];
