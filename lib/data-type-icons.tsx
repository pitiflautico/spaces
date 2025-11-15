import { DataType } from '@/types';
import {
  PhotoIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  LinkIcon
} from '@heroicons/react/24/solid';

// Icon mapping for data types
export const DataTypeIcons: Record<DataType, React.ComponentType<{ className?: string }>> = {
  [DataType.IMAGE]: PhotoIcon,
  [DataType.TEXT]: DocumentTextIcon,
  [DataType.JSON]: CodeBracketIcon,
  [DataType.AUDIO]: SpeakerWaveIcon,
  [DataType.VIDEO]: VideoCameraIcon,
  [DataType.MIXED]: LinkIcon,
};

// Color mapping for data types
export const DataTypeColors: Record<DataType, string> = {
  [DataType.IMAGE]: 'bg-pink-500 border-pink-600',
  [DataType.TEXT]: 'bg-blue-500 border-blue-600',
  [DataType.JSON]: 'bg-purple-500 border-purple-600',
  [DataType.AUDIO]: 'bg-orange-500 border-orange-600',
  [DataType.VIDEO]: 'bg-red-500 border-red-600',
  [DataType.MIXED]: 'bg-gray-500 border-gray-600',
};

// Helper to get icon component
export function getDataTypeIcon(dataType: DataType | undefined) {
  if (!dataType) return LinkIcon;
  return DataTypeIcons[dataType] || LinkIcon;
}

// Helper to get color class
export function getDataTypeColor(dataType: DataType | undefined) {
  if (!dataType) return 'bg-gray-500 border-gray-600';
  return DataTypeColors[dataType] || 'bg-gray-500 border-gray-600';
}
