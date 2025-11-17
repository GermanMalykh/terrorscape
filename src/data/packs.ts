import type {
  KillerProfile,
  PackDefinition,
  ScenarioPreset,
  SoundAsset,
  SurvivorProfile,
} from '../types'
import { getAssetPath } from '../utils/paths'

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
    tags: ['survivors', 'base'],
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
    id: 'werewolf_howl',
    name: 'Вой оборотня',
    category: 'killer',
    description: 'Протяжный вой и рычание оборотня',
    tags: ['werewolf', 'feral-instincts'],
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
    name: 'Баррикада',
    category: 'common',
    description: 'Гулкий удар тяжёлой двери',
    tags: ['base'],
  },
  {
    id: 'hammering',
    name: 'Баррикада',
    category: 'killer',
    description: 'Звук забивания баррикады',
    tags: ['butcher', 'base'],
  },
]

export const killerProfiles: KillerProfile[] = [
  {
    id: 'butcher',
    name: 'Мясник',
    codename: 'Butcher',
    description:
      'Грудая гора мышц, вооружённая бензопилой. Всегда выбирает прямой путь и не отпускает добычу.',
    signatureSounds: ['chainsaw_roar', 'hammering'],
    image: getAssetPath('/art/killers/butcher.webp'),
    traits: ['Шквалящий урон', 'Прямолинейная охота', 'Шумовой прессинг'],
    packLabel: {
      ru: 'База',
      en: 'Base',
    },
  },
  {
    id: 'spectre',
    name: 'Призрак',
    codename: 'Spectre',
    description: 'Существо иной природы, исчезающее в тени и обрушивающееся неожиданно.',
    signatureSounds: ['spectre_vanish', 'house_whispers'],
    image: getAssetPath('/art/killers/spectre.webp'),
    traits: ['Скрытность', 'Психологический прессинг', 'Контроль пространства'],
    packLabel: {
      ru: 'База',
      en: 'Base',
    },
  },
  {
    id: 'werewolf',
    name: 'Оборотень',
    codename: 'Werewolf',
    description:
      'Жену Рудольфа убили соседи и после этого он превратился в истинного монстра, чья ярость больше не зависит от лунных циклов.',
    signatureSounds: ['werewolf_howl'],
    image: getAssetPath('/art/killers/werewolf.webp'),
    traits: ['Неумолимая ярость', 'Чуткий нюх', 'Прорыв обороны'],
    packLabel: {
      ru: 'Животный инстинкт',
      en: 'Feral Instincts',
    },
  },
  {
    id: 'huntress',
    name: 'Охотница',
    codename: 'Huntress',
    description:
      'Таинственное существо, воспитанное волками. Освоив охоту с детства, она ставит капканы и люто мстит людям, забредшим в её лес.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/huntress.webp'),
    traits: ['Призрачные капканы', 'Дальний бросок', 'Лесное чутьё'],
    packLabel: {
      ru: 'Животный инстинкт',
      en: 'Feral Instincts',
    },
  },
]

export const survivorProfiles: SurvivorProfile[] = [
  {
    id: 'sophia_scott',
    name: 'София Скотт',
    codename: 'Sophia Scott',
    description: 'Смелая, но осторожная, всегда ищет безопасный путь.',
    image: getAssetPath('/art/survivors/sophia.webp'),
  },
  {
    id: 'johnson_nispel',
    name: 'Джонсон Ниспел',
    codename: 'Johnson Nispel',
    description: 'Выживший-прагматик, умеющий оценить риск мгновенно.',
    image: getAssetPath('/art/survivors/johnson.webp'),
  },
  {
    id: 'marco_carven',
    name: 'Марко Карвен',
    codename: 'Marco Carven',
    description: 'Ветеран расследований сверхъестественного.',
    image: getAssetPath('/art/survivors/marco.webp'),
  },
  {
    id: 'anna_kubrick',
    name: 'Анна Кубрик',
    codename: 'Anna Kubrick',
    description: 'Хладнокровная стратег, не сдаётся без плана.',
    image: getAssetPath('/art/survivors/anna.webp'),
  },
  {
    id: 'william_hooper',
    name: 'Уильям Хупер',
    codename: 'William Hooper',
    description: 'Отважный механик, готовый закрыть любую пробоину.',
    image: getAssetPath('/art/survivors/william.webp'),
  },
  {
    id: 'george_carpenter',
    name: 'Джордж Карпентер',
    codename: 'George Carpenter',
    description: 'Опытный исследователь древних тайн, не боится столкнуться с неведомым.',
    image: getAssetPath('/art/survivors/george.webp'),
  },
]

export const packDefinitions: PackDefinition[] = [
  {
    id: 'base',
    name: 'База',
    description: 'Основные убийцы, жертвы и атмосфера особняка.',
    includes: {
      killers: ['butcher', 'spectre'],
      survivors: [
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
    description:
      'Домик у озера, где когда-то отдыхали туристы, теперь хранит следы ожесточённой борьбы. Местные говорят о человекоподобном волке, воющем по ночам, а внутри домика всё распорото звериными когтями.',
    includes: {
      killers: ['werewolf', 'huntress'],
      survivors: [],
      sounds: ['chainsaw_roar'],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'amorphous-peril',
    name: 'Угроза извне',
    description:
      'Заброшенная лаборатория, где таинственное растение превратилось в гигантского плотоядного монстра. Его побеги распространились по всем помещениям, превратив научный комплекс в смертельную ловушку.',
    includes: {
      killers: [],
      survivors: [],
      sounds: [],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'lethal-immortals',
    name: 'Безжизненные бессмертные',
    description:
      'Неприступный замок на скалистом холме, застывший во времени. Легенды гласят, что его защищают ожившие каменные воины, а хитроумные ловушки превращают замок в каменную тюрьму.',
    includes: {
      killers: [],
      survivors: ['george_carpenter'],
      sounds: [],
    },
    tags: ['dlc'],
    dlc: true,
  },
  {
    id: 'putrefied-enmity',
    name: 'Королева Мёртвых',
    description:
      'Древняя гробница с фресками о могущественном существе, заточенном под землёй много веков назад. В пылу исследований никто не заметил, как в недрах туннелей пробудилось что-то свирепое, жаждущее мести.',
    includes: {
      killers: [],
      survivors: [],
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
