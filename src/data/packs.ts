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
      'Детство Мясника прошло на скотобойне, где жестокий отец с утра до ночи издевался над ребёнком. Когда скотобойня разорилась, семья оказалась за чертой бедности. В конце концов голод и безумие заставили Мясника съесть своего отца. Так Мясник начал путь серийного убийцы-каннибала. Его логово — особняк, где он терпеливо ждёт, когда кто-нибудь решит заглянуть внутрь. Любимое оружие Мясника — бензопила. Кроме того, он никогда не расстаётся с плюшевым мишкой — единственным напоминанием о его умершей матери.',
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
    description:
      'В викторианскую эпоху бедная женщина служила горничной в особняке. Остальные слуги завидовали ей и наложили на неё проклятие, превратившее женщину в Призрака. Мучаясь от боли, он метался по особняку. Только человеческий страх и жизненные силы могли облегчить его страдания. Призрак высосал души тех, кто сделал его таким, и пощадил лишь владельца особняка. Тот всегда был добр к горничной и потому не заслужил страшной участи, каких бы усилий ни стоило Призраку обуздать свою жажду.',
    signatureSounds: ['spectre_vanish', 'house_whispers'],
    image: getAssetPath('/art/killers/spectre.webp'),
    traits: ['Скрытность', 'Психологический прессинг', 'Контроль пространства'],
    packLabel: {
      ru: 'База',
      en: 'Base',
    },
  },
  {
    id: 'murderer',
    name: 'Маньяк',
    codename: 'Murderer',
    description:
      'Маньяк — опасный преступник, которого разыскивают по всему миру. Детские травмы пробудили в нём инстинкт убийцы. Несмотря на обилие жертв, полиции так и не удалось напасть на его след. Однажды жертва почти ускользнула от него. После нескольких часов погони Маньяку всё же удалось завершить начатое. После этой «охоты» убийца вошёл во вкус. Он стал планировать убийства, заранее готовя декорации, в которых пройдёт эта извращённая игра на выживание. И заброшенный особняк стал его любимым местом для осуществления своих планов.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/murderer.webp'),
    traits: ['Жестокость', 'Непредсказуемость', 'Психологическое давление'],
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
      'Рудольф жил со своей женой в глухой деревушке в одной из стран Восточной Европы. Каждое полнолуние он превращался в человекоподобного волка. Из-за этого односельчане боялись и избегали мужчину. В конце концов они разработали гнусный план — похитить жену Рудольфа и убить её. Когда мужчина увидел бездыханное тело любимой, ночную тишину прорезал дикий вой. Рудольф-человек умер — и в мире родился истинный монстр, Оборотень, сила которого больше не зависит от лунного цикла.',
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
      'С первого взгляда Охотницу можно принять за высокую и стройную молодую женщину, но на самом деле это таинственное существо, воспитанное волками. С самого детства она в совершенстве освоила навыки охоты. Наблюдая за людьми, приходящими в лес, Охотница быстро поняла предназначение капканов и стала выкрадывать их, чтобы использовать для собственной охоты. Чем больше волков её стаи погибало от рук браконьеров, тем сильнее было желание отомстить людям, которые встретятся ей в лесу. Их убийство не приносит никакой радости, но Охотница уверена, что только так она сможет защитить свою семью.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/huntress.webp'),
    traits: ['Призрачные капканы', 'Дальний бросок', 'Лесное чутьё'],
    packLabel: {
      ru: 'Животный инстинкт',
      en: 'Feral Instincts',
    },
  },
  {
    id: 'strangler',
    name: 'Пожиратель',
    codename: 'Strangler',
    description:
      'На протяжении тысячелетий Пожиратель был сокрыт под землёй и неизвестен науке, пока не оказался в руках беспринципных учёных. Он стал жертвой чудовищных и неэтичных экспериментов, что в конце концов пробудило в нём инстинкт выживания. Однажды Пожиратель остался в лаборатории без присмотра и решил действовать: его побеги проникали в каждую щель, опутывая все помещения, а соцветия, возникающие тут и там, помогали ему захватывать всё новые и новые территории. Безобидный росток за несколько часов превратился в гигантское растение. В нём проснулась жажда крови — и дежурный, который не успел предупредить своих коллег об этой чудовищной метаморфозе, стал первой жертвой убийцы.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/strangler.webp'),
    traits: ['Удушающие побеги', 'Контроль территории', 'Медленная смерть'],
    packLabel: {
      ru: 'Угроза извне',
      en: 'Amorphous Peril',
    },
  },
  {
    id: 'unknown',
    name: 'Неопознанное',
    codename: 'Unknown',
    description:
      'Неопознанное — существо из другого мира, которое попало на Землю вместе с метеоритом. Слабое и напуганное, оно нашло пристанище в городской системе канализационных тоннелей. Теплый и влажный климат канализации нравился пришельцу, а артефакты, попадающие в его логово из «верхнего» мира, помогали изучать новую реальность и добывать пропитание. Долгое время рацион Неопознанного состоял из грызунов (и — увы! — одного водопроводчика). Шло время, и под действием земной атмосферы Неопознанное мутировало в нечто гораздо более опасное, готовое выйти из тьмы канализации и начать охотиться на людей.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/unknown.webp'),
    traits: ['Непредсказуемость', 'Скрытая угроза', 'Таинственное присутствие'],
    packLabel: {
      ru: 'Угроза извне',
      en: 'Amorphous Peril',
    },
  },
  {
    id: 'statues',
    name: 'Каменные воины',
    codename: 'Statues',
    description:
      'Много лет назад жил один талантливый скульптор. Бушевавшая в стране война унесла жизни трёх его старших братьев, но сам мужчина не мог сражаться с врагами из-за слабого здоровья. Оставшись один, он вынужден был укрыться в последней неприступной крепости. Когда враги сломили сопротивление и проникли за каменные стены, они столкнулись с четырьмя загадочными фигурами, появившимися из тьмы и обрушившими весь свой гнев на захватчиков. А после этого кровопролитного сражения скульптор был найден мёртвым со счастливой улыбкой на губах и инструментами для работы по камню в руке. Война закончилась, но легенда о Каменных воинах, защищающих замок от посягательств всякого, кто осмелится переступить его порог, до сих пор передаётся из уст в уста среди местных жителей.',
    signatureSounds: [],
    image: getAssetPath('/art/killers/statues.webp'),
    traits: ['Каменная неподвижность', 'Защита территории', 'Внезапное пробуждение'],
    packLabel: {
      ru: 'Безжизненные бессмертные',
      en: 'Lethal Immortals',
    },
  },
  {
    id: 'queen',
    name: 'Королева',
    codename: 'Queen',
    description:
      'Древняя гробница с фресками о могущественном существе, заточенном под землёй много веков назад. В пылу исследований никто не заметил, как в недрах туннелей пробудилось что-то свирепое, жаждущее мести. Королева Мёртвых восстала из векового сна, чтобы отомстить всем, кто осмелился потревожить её покой.',
    signatureSounds: ['siren_blast'],
    image: getAssetPath('/art/killers/queen.webp'),
    traits: ['Древняя мощь', 'Власть над мёртвыми', 'Неумолимая месть'],
    packLabel: {
      ru: 'Королева Мёртвых',
      en: 'Putrefied Enmity',
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
      killers: ['butcher', 'spectre', 'murderer'],
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
      killers: ['strangler', 'unknown'],
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
      killers: ['statues'],
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
      killers: ['queen'],
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
