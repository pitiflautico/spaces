import type { ModuleInfo, ModuleType } from '@/types';

export const MODULE_INFO: Record<ModuleType, ModuleInfo> = {
  'local-project-analysis': {
    name: 'Local Project Analysis Agent',
    shortDescription: 'Analiza repositorios locales y extrae metadatos, estructura y contenido.',
    extendedDescription:
      'Este módulo escanea un proyecto local en tu sistema de archivos y extrae información detallada sobre su estructura, archivos, y metadatos. Es ideal como punto de partida para cualquier flujo de marketing basado en código fuente.',
    whenToUse:
      'Úsalo cuando necesites analizar un proyecto de código fuente local antes de generar contenido de marketing. Es el primer paso recomendado en la mayoría de flujos.',
    inputs: [
      {
        name: 'localProjectPath',
        type: 'text',
        description: 'Ruta absoluta al proyecto en tu sistema de archivos',
        required: true,
      },
      {
        name: 'includeHiddenFiles',
        type: 'json',
        description: 'Si se deben incluir archivos ocultos (.gitignore, etc.)',
        required: false,
      },
      {
        name: 'includeNodeModules',
        type: 'json',
        description: 'Si se debe incluir la carpeta node_modules',
        required: false,
      },
    ],
    outputs: [
      {
        name: 'repositoryMetadata',
        type: 'json',
        description: 'Metadatos del repositorio (nombre, descripción, tecnologías)',
      },
      {
        name: 'fileContents',
        type: 'json',
        description: 'Contenido de los archivos principales del proyecto',
      },
      {
        name: 'repoStructure',
        type: 'json',
        description: 'Estructura de carpetas y archivos del proyecto',
      },
    ],
    compatibleModules: ['reader-engine', 'naming-engine', 'marketing-pack'],
    dependencies: [],
    commonErrors: [
      {
        code: 'PATH_NOT_FOUND',
        description: 'La ruta especificada no existe',
        solution: 'Verifica que la ruta sea correcta y absoluta',
      },
      {
        code: 'PERMISSION_DENIED',
        description: 'No se tienen permisos para leer el directorio',
        solution: 'Verifica los permisos del directorio',
      },
      {
        code: 'EMPTY_PROJECT',
        description: 'El proyecto no contiene archivos',
        solution: 'Verifica que la ruta apunte a un proyecto válido',
      },
    ],
    usageTips: [
      'Usa rutas absolutas para evitar problemas de resolución',
      'Excluye node_modules para proyectos grandes para acelerar el análisis',
      'Los archivos ocultos suelen contener configuración importante',
    ],
    exampleFlow:
      'Local Project Analysis → Reader Engine → Naming Engine → Marketing Pack',
  },

  'reader-engine': {
    name: 'Reader Engine',
    shortDescription: 'Procesa y estructura datos de entrada para análisis posterior.',
    extendedDescription:
      'El Reader Engine toma datos crudos de proyectos o archivos y los procesa en un formato estructurado que puede ser utilizado por otros módulos downstream.',
    whenToUse:
      'Úsalo después del Local Project Analysis Agent para procesar y estructurar los datos del proyecto.',
    inputs: [
      {
        name: 'projectData',
        type: 'json',
        description: 'Datos del proyecto a procesar',
        required: true,
      },
    ],
    outputs: [
      {
        name: 'processedData',
        type: 'json',
        description: 'Datos procesados y estructurados',
      },
    ],
    compatibleModules: ['naming-engine', 'icon-generator', 'marketing-pack'],
    dependencies: ['local-project-analysis'],
    commonErrors: [
      {
        code: 'INVALID_DATA_FORMAT',
        description: 'El formato de los datos de entrada no es válido',
        solution: 'Verifica que el módulo anterior haya completado correctamente',
      },
    ],
    usageTips: [
      'Conecta siempre después de un módulo de análisis',
      'Los datos procesados son más fáciles de usar en módulos posteriores',
    ],
    exampleFlow: 'Local Project Analysis → Reader Engine → Naming Engine',
  },

  'naming-engine': {
    name: 'Naming Engine',
    shortDescription: 'Genera nombres creativos para proyectos basándose en análisis.',
    extendedDescription:
      'El Naming Engine utiliza IA para generar nombres creativos, atractivos y relevantes para tu proyecto basándose en su análisis y contexto.',
    whenToUse:
      'Úsalo cuando necesites generar nombres de marca o títulos para tu proyecto.',
    inputs: [
      {
        name: 'projectData',
        type: 'json',
        description: 'Datos del proyecto para generar nombres',
        required: true,
      },
    ],
    outputs: [
      {
        name: 'names',
        type: 'text',
        description: 'Lista de nombres generados',
      },
    ],
    compatibleModules: ['icon-generator', 'marketing-pack'],
    dependencies: ['local-project-analysis', 'reader-engine'],
    commonErrors: [
      {
        code: 'INSUFFICIENT_DATA',
        description: 'No hay suficientes datos para generar nombres',
        solution: 'Asegúrate de que el proyecto tenga suficiente contenido',
      },
    ],
    usageTips: [
      'Combina con Icon Generator para crear una identidad visual completa',
      'Los mejores resultados vienen de proyectos bien documentados',
    ],
    exampleFlow: 'Reader Engine → Naming Engine → Icon Generator',
  },

  'icon-generator': {
    name: 'Icon Generator',
    shortDescription: 'Genera iconos y elementos visuales para tu proyecto.',
    extendedDescription:
      'Crea iconos, logos y elementos visuales personalizados basados en el análisis del proyecto y los nombres generados.',
    whenToUse: 'Úsalo cuando necesites crear identidad visual para tu proyecto.',
    inputs: [
      {
        name: 'projectData',
        type: 'json',
        description: 'Datos del proyecto',
        required: true,
      },
      {
        name: 'names',
        type: 'text',
        description: 'Nombres para inspirar el diseño',
        required: false,
      },
    ],
    outputs: [
      {
        name: 'icons',
        type: 'image',
        description: 'Iconos generados en varios formatos',
      },
    ],
    compatibleModules: ['marketing-pack'],
    dependencies: ['naming-engine'],
    commonErrors: [
      {
        code: 'GENERATION_FAILED',
        description: 'No se pudieron generar los iconos',
        solution: 'Intenta con diferentes parámetros o datos de entrada',
      },
    ],
    usageTips: [
      'Funciona mejor cuando se proporciona un nombre claro',
      'Los iconos generados se pueden personalizar después',
    ],
    exampleFlow: 'Naming Engine → Icon Generator → Marketing Pack',
  },

  'marketing-pack': {
    name: 'Marketing Pack',
    shortDescription: 'Genera un paquete completo de materiales de marketing.',
    extendedDescription:
      'Combina todos los datos, nombres e iconos para crear un paquete completo de marketing incluyendo descripción, landing page, social media assets y más.',
    whenToUse:
      'Úsalo como paso final para generar todos los materiales de marketing.',
    inputs: [
      {
        name: 'projectData',
        type: 'json',
        description: 'Datos del proyecto',
        required: true,
      },
      {
        name: 'names',
        type: 'text',
        description: 'Nombres generados',
        required: false,
      },
      {
        name: 'icons',
        type: 'image',
        description: 'Iconos generados',
        required: false,
      },
    ],
    outputs: [
      {
        name: 'marketingMaterials',
        type: 'mixed',
        description: 'Paquete completo de materiales de marketing',
      },
    ],
    compatibleModules: [],
    dependencies: [
      'local-project-analysis',
      'reader-engine',
      'naming-engine',
      'icon-generator',
    ],
    commonErrors: [
      {
        code: 'INCOMPLETE_DATA',
        description: 'Faltan datos necesarios para generar el paquete',
        solution: 'Asegúrate de conectar todos los módulos necesarios',
      },
    ],
    usageTips: [
      'Funciona mejor cuando todos los módulos anteriores están conectados',
      'Puedes ejecutar sin algunos inputs opcionales',
    ],
    exampleFlow: 'Todo el flujo termina aquí con el paquete completo',
  },
};
