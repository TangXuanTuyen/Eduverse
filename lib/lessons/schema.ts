import { z } from 'zod';

const textBlock = z.object({
  type: z.literal('text'),
  content: z.string().min(1),
});

const imageBlock = z.object({
  type: z.literal('image'),
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

const model3dBlock = z.object({
  type: z.literal('model3d'),
  src: z.string().min(1),
  poster: z.string().optional(),
  alt: z.string().min(1),
  credit: z.string().min(1),
  license: z.string().optional(),
  hotspots: z.array(z.object({
    position: z.string(),
    normal: z.string().optional(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),
  fallbackImage: z.string().optional(),
  fallbackCaption: z.string().optional(),
});

const ALLOWED_PHET_SIMS = [
  'acid-base-solutions', 'balancing-act', 'balloons-and-static-electricity',
  'build-an-atom', 'circuit-construction-kit-dc', 'color-vision',
  'concentration', 'density', 'energy-forms-and-changes',
  'energy-skate-park-basics', 'forces-and-motion-basics',
  'friction', 'gas-properties', 'gene-expression-essentials',
  'geometric-optics', 'gravity-and-orbits', 'hookes-law',
  'isotopes-and-atomic-mass', 'john-travoltage', 'masses-and-springs',
  'molarity', 'molecules-and-light', 'my-solar-system',
  'natural-selection', 'neuron', 'ohms-law',
  'pendulum-lab', 'ph-scale', 'projectile-motion',
  'reactants-products-and-leftovers', 'resistance-in-a-wire',
  'states-of-matter', 'under-pressure', 'wave-on-a-string',
  'waves-intro',
] as const;

const phetSimBlock = z.object({
  type: z.literal('phet_sim'),
  simName: z.string().regex(/^[a-z0-9-]+$/, 'Tên mô phỏng không hợp lệ'),
  localPath: z.string().optional(),
  fallbackImage: z.string().optional(),
  fallbackGuide: z.string().optional(),
});

const virtualLabBlock = z.object({
  type: z.literal('virtual_lab'),
  labKey: z.string().min(1),
  title: z.string().min(1),
  safetyRules: z.array(z.string()).optional(),
  steps: z.array(z.object({
    instruction: z.string(),
    expectedAction: z.string().optional(),
    errorFeedback: z.string().optional(),
  })).optional(),
});

const questionBlock = z.object({
  type: z.literal('question'),
  questionType: z.enum(['single_choice', 'multiple_choice', 'short_answer', 'hotspot']),
  content: z.string().min(1),
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  correctAnswer: z.unknown(),
  explanation: z.string().optional(),
  points: z.number().int().min(1).max(100).default(10),
});

const observationBlock = z.object({
  type: z.literal('observation'),
  promptPrediction: z.string().min(1),
  promptObservation: z.string().min(1),
  promptExplanation: z.string().min(1),
});

const dragDropBlock = z.object({
  type: z.literal('drag_drop'),
  title: z.string().min(1),
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    image: z.string().optional(),
  })),
  targets: z.array(z.object({
    id: z.string(),
    label: z.string(),
    acceptsItemId: z.string(),
  })),
});

const contentBlock = z.discriminatedUnion('type', [
  textBlock, imageBlock, model3dBlock, phetSimBlock,
  virtualLabBlock, questionBlock, observationBlock, dragDropBlock,
]);

export const lessonStepSchema = z.object({
  title: z.string().min(1),
  phase: z.enum(['khoi_dong', 'kham_pha', 'giai_thich', 'kiem_tra', 'tom_tat']),
  blocks: z.array(contentBlock).min(1),
});

export const lessonContentSchema = z.array(lessonStepSchema).min(1).max(10);

export type LessonStep = z.infer<typeof lessonStepSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;
export type ContentBlock = z.infer<typeof contentBlock>;
export type Model3DBlock = z.infer<typeof model3dBlock>;
export type PhetSimBlock = z.infer<typeof phetSimBlock>;
export type QuestionBlock = z.infer<typeof questionBlock>;
export type ObservationBlock = z.infer<typeof observationBlock>;
export type VirtualLabBlock = z.infer<typeof virtualLabBlock>;
export type DragDropBlock = z.infer<typeof dragDropBlock>;

export { ALLOWED_PHET_SIMS };
