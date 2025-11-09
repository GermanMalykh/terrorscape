import type {
  KillerProfile,
  PackDefinition,
  ScenarioPreset,
  SoundAsset,
  VictimProfile,
} from '../types'

export const soundLibrary: SoundAsset[] = [
  {
    id: 'house_whispers',
    name: 'Шёпот особняка',
    category: 'atmosphere',
    description: 'Фоновый шёпот и скрежет отдалённых стен',
    loop: true,
    lengthSeconds: 90,
    tags: ['base', 'ambient'],
  },
  {
    id: 'noise_token',
    name: 'Жетон шума',
    category: 'common',
    description: 'Бросок жетона шума на стол',
    tags: ['token', 'base'],
  },
  {
    id: 'panic_breath',
    name: 'Паническое дыхание',
    category: 'common',
    description: 'Тяжёлое дыхание и подавленный крик',
    tags: ['victims', 'base'],
  },
  {
    id: 'lantern_click',
    name: 'Фонарь',
    category: 'special',
    description: 'Включение старого фонаря и гул напряжения',
    tags: ['special', 'base'],
  },
  {
    id: 'chainsaw_roar',
    name: 'Рёв бензопилы',
    category: 'killer',
    description: 'Завод бензопилы и резкий набор оборотов',
    tags: ['butcher', 'base', 'feral-instincts'],
  },
  {
    id: 'spectre_vanish',
    name: 'Исчезновение',
    category: 'killer',
    description: 'Холодный порыв ветра и шёпот призрака',
    tags: ['spectre', 'base'],
  },
  {
    id: 'siren_blast',
    name: 'Сирена эвакуации',
    category: 'special',
    description: 'Старый громкоговоритель, усиливающий тревогу',
    tags: ['putrefied-enmity'],
  },
  {
    id: 'door_slam',
    name: 'Хлопок двери',
    category: 'common',
    description: 'Гулкий удар тяжёлой двери',
    tags: ['base'],
  },
]

export const killerProfiles: KillerProfile[] = [
  {
    id: 'butcher',
    name: 'Мясник',
    codename: 'Butcher',
    description:
      'Грудая гора мышц, вооружённая бензопилой. Всегда выбирает прямой путь и не отпускает добычу.',
    signatureSounds: ['chainsaw_roar', 'door_slam'],
    image: '/art/killers/butcher.webp',
    traits: ['Шквалящий урон', 'Прямолинейная охота', 'Шумовой прессинг'],
  },
  {
    id: 'spectre',
    name: 'Призрак',
    codename: 'Spectre',
    description: 'Существо иной природы, исчезающее в тени и обрушивающееся неожиданно.',
    signatureSounds: ['spectre_vanish', 'house_whispers'],
    image: '/art/killers/spectre.webp',
    traits: ['Скрытность', 'Психологический прессинг', 'Контроль пространства'],
  },
]

export const victimProfiles: VictimProfile[] = [
  {
    id: 'sophia_scott',
    name: 'София Скотт',
    codename: 'Sophia Scott',
    description: 'Смелая, но осторожная, всегда ищет безопасный путь.',
  },
  {
    id: 'johnson_nispel',
    name: 'Джонсон Ниспел',
    codename: 'Johnson Nispel',
    description: 'Выживший-прагматик, умеющий оценить риск мгновенно.',
  },
  {
    id: 'marco_carven',
    name: 'Марко Карвен',
    codename: 'Marco Carven',
    description: 'Ветеран расследований сверхъестественного.',
  },
  {
    id: 'anna_kubrick',
    name: 'Анна Кубрик',
    codename: 'Anna Kubrick',
    description: 'Хладнокровная стратег, не сдаётся без плана.',
  },
  {
    id: 'william_hooper',
    name: 'Уильям Хупер',
    codename: 'William Hooper',
    description: 'Отважный механик, готовый закрыть любую пробоину.',
  },
]

export const packDefinitions: PackDefinition[] = [
  {
    id: 'base',
    name: 'База',
    description: 'Основные убийцы, жертвы и атмосфера особняка.',
    includes: {
      killers: ['butcher', 'spectre'],
      victims: [
        'sophia_scott',
        'johnson_nispel',
        'marco_carven',
        'anna_kubrick',
        'william_hooper',
      ],
      sounds: ['house_whispers', 'noise_token', 'panic_breath', 'lantern_click', 'spectre_vanish', 'chainsaw_roar', 'door_slam'],
    },
    tags: ['core', 'recommended'],
  },
  {
    id: 'feral-instincts',
    name: 'Животный инстинкт',
    description: 'Набор «Feral Instincts». Описание будет добавлено позже.',
    includes: {
      killers: ['butcher'],
      victims: [],
      sounds: ['chainsaw_roar'],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'amorphous-peril',
    name: 'Угроза извне',
    description: 'Набор «Amorphous Peril». Описание будет добавлено позже.',
    includes: {
      killers: [],
      victims: [],
      sounds: [],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'lethal-immortals',
    name: 'Безжизненные бессмертные',
    description: 'Набор «Lethal Immortals». Описание будет добавлено позже.',
    includes: {
      killers: [],
      victims: [],
      sounds: [],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'putrefied-enmity',
    name: 'Королева Мёртвых',
    description: 'Набор «Putrefied Enmity». Описание будет добавлено позже.',
    includes: {
      killers: [],
      victims: [],
      sounds: ['siren_blast'],
    },
    tags: ['dlc'],
    dlc: true,
  },
]

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: 'quiet-hunt',
    name: 'Тихая охота',
    description: 'Медленный прессинг: шёпот, шаги и внезапное исчезновение убийцы.',
    steps: [
      { id: 'step-1', label: 'Старт шёпота', delaySeconds: 0, soundId: 'house_whispers', repeat: 1 },
      { id: 'step-2', label: 'Исчезновение', delaySeconds: 45, soundId: 'spectre_vanish' },
    ],
  },
  {
    id: 'barricade',
    name: 'Осада баррикады',
    description: 'Громкие удары и сирены — максимальное давление.',
    steps: [
      { id: 'step-1', label: 'Сирена', delaySeconds: 0, soundId: 'siren_blast' },
      { id: 'step-2', label: 'Хлопок двери', delaySeconds: 28, soundId: 'door_slam', repeat: 2 },
    ],
  },
]
