/**
 * CONSTANTES DE ESTADOS
 * Definiciones de colores, iconos y textos para cada estado
 */

import { ModuleState } from '@/types/module'

export const STATE_CONFIG = {
  [ModuleState.IDLE]: {
    color: '#6B7280',
    bgColor: '#374151',
    label: 'Inactivo',
    icon: '○'
  },
  [ModuleState.RUNNING]: {
    color: '#3B82F6',
    bgColor: '#1E3A8A',
    label: 'Ejecutando',
    icon: '⟳'
  },
  [ModuleState.WARNING]: {
    color: '#FFA500',
    bgColor: '#92400E',
    label: 'Advertencia',
    icon: '⚠'
  },
  [ModuleState.ERROR]: {
    color: '#FF4444',
    bgColor: '#7F1D1D',
    label: 'Error',
    icon: '✕'
  },
  [ModuleState.FATAL_ERROR]: {
    color: '#CC0000',
    bgColor: '#450A0A',
    label: 'Error Fatal',
    icon: '⊗'
  },
  [ModuleState.DONE]: {
    color: '#10B981',
    bgColor: '#065F46',
    label: 'Completado',
    icon: '✓'
  }
}

export const getStateConfig = (state: ModuleState) => {
  return STATE_CONFIG[state] || STATE_CONFIG[ModuleState.IDLE]
}
