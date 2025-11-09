type TranslationDict = Record<string, string>

interface LocaleTable {
  code: string
  label: string
  translations: TranslationDict
}

export const locales: LocaleTable[] = [
  {
    code: 'ru',
    label: 'Русский',
    translations: {
      'menu.title': 'Шёпот за стеной',
      'menu.newGame': 'Новая партия',
      'menu.collections': 'Коллекции',
      'menu.settings': 'Настройки',
      'menu.version': 'Версия',
      'menu.install': 'Добавить на экран',
      'collections.title': 'Коллекции звуков',
      'collections.base': 'База',
      'collections.dlc': 'Дополнение',
      'collections.activate': 'Активировать',
      'setup.title': 'Выбор набора',
      'setup.killer': 'Убийца',
      'setup.killerTraits': 'Особенности',
      'setup.openVictims': 'Выбрать жертв',
      'setup.victims': 'Жертвы',
      'setup.openRoles': 'Распределить роли',
      'setup.roles': 'Назначение ролей',
      'setup.items': 'Предметы',
      'setup.start': 'Начать игру',
      'setup.victimsHint': 'Нет доступных жертв. Подключите дополнительные наборы.',
      'setup.rolesHint': 'Выберите убийцу и хотя бы одну жертву, чтобы назначить роли игрокам.',
      'console.title': 'Игровой пульт',
      'console.finish': 'Завершить',
      'console.muteAll': 'Глушить всё',
      'console.mix': 'Микшер',
      'console.queue': 'Очередь',
      'console.scenarios': 'Сценарии',
      'console.bookmarks': 'Закладки',
      'settings.title': 'Настройки',
      'settings.language': 'Язык',
      'settings.theme': 'Тема',
      'settings.audio': 'Громкость',
      'settings.cache': 'Оффлайн-кэш',
      'settings.install': 'Установить приложение',
      'settings.resetStats': 'Сбросить статистику',
      'settings.resetStatsDescription': 'Очистить историю партий и накопленные результаты.',
    },
  },
  {
    code: 'en',
    label: 'English',
    translations: {
      'menu.title': 'Whisper Behind the Wall',
      'menu.newGame': 'New Game',
      'menu.collections': 'Collections',
      'menu.settings': 'Settings',
      'menu.version': 'Version',
      'menu.install': 'Add to Home Screen',
      'collections.title': 'Sound Collections',
      'collections.base': 'Core',
      'collections.dlc': 'Expansion',
      'collections.activate': 'Activate',
      'setup.title': 'Select Loadout',
      'setup.killer': 'Killer',
      'setup.killerTraits': 'Traits',
      'setup.openVictims': 'Choose victims',
      'setup.victims': 'Victims',
      'setup.openRoles': 'Assign roles',
      'setup.roles': 'Role assignment',
      'setup.items': 'Items',
      'setup.start': 'Start game',
      'setup.victimsHint': 'No victims available. Enable additional packs.',
      'setup.rolesHint': 'Pick a killer and at least one victim before assigning players.',
      'console.title': 'Game Console',
      'console.finish': 'Finish',
      'console.muteAll': 'Mute all',
      'console.mix': 'Mixer',
      'console.queue': 'Queue',
      'console.scenarios': 'Scenarios',
      'console.bookmarks': 'Bookmarks',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.audio': 'Volume',
      'settings.cache': 'Offline cache',
      'settings.install': 'Install app',
      'settings.resetStats': 'Reset statistics',
      'settings.resetStatsDescription': 'Clear match history and accumulated results.',
    },
  },
]

const translationMap = locales.reduce<Record<string, TranslationDict>>((map, locale) => {
  map[locale.code] = locale.translations
  return map
}, {})

export type LocaleCode = (typeof locales)[number]['code']

export const defaultLocale: LocaleCode = 'ru'

export function translate(locale: LocaleCode, key: string, fallback?: string): string {
  const table = translationMap[locale]
  if (!table) {
    return fallback ?? key
  }
  return table[key] ?? fallback ?? key
}
