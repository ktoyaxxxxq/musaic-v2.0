// ============================================================================
// TRACK TITLE GENERATOR: EXTRA BANKS (v3)
// Adds new words/patterns on top of banksRu.ts / banksEn.ts (old ones stay).
// RU entries: pure Cyrillic only. EN entries: pure Latin only. Never mixed.
// ============================================================================
import type { LangBank, Pattern, ThemeId } from './types';

const L = (s: string): string[] => s.split('|').map(x => x.trim()).filter(Boolean);

export interface BankExtra {
  lists: Record<string, string[]>;
  themes: Partial<Record<ThemeId, Pattern[]>>;
  sprinkle?: string[];
  albumTags?: string[];
}

const uniq = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
};

/** Returns a new bank: base lists/themes + extra lists/themes (deduplicated). */
export function mergeBank(base: LangBank, extra: BankExtra): LangBank {
  const lists: Record<string, string[]> = { ...base.lists };
  for (const [k, v] of Object.entries(extra.lists)) lists[k] = uniq([...(lists[k] || []), ...v]);
  const themes = { ...base.themes } as LangBank['themes'];
  for (const [t, p] of Object.entries(extra.themes) as Array<[ThemeId, Pattern[]]>) {
    themes[t] = [...(themes[t] || []), ...p];
  }
  return {
    lists,
    themes,
    sprinkle: uniq([...base.sprinkle, ...(extra.sprinkle || [])]),
    albumTags: uniq([...base.albumTags, ...(extra.albumTags || [])])
  };
}

// ---------------------------------------------------------------------------
// RUSSIAN EXTRA
// ---------------------------------------------------------------------------
export const RU_EXTRA: BankExtra = {
  lists: {
    // ---------- МОДА ----------
    brand: L(`Ямамото|Найк|Адидас|Кархарт|Норт Фейс|Арктерикс|Конверс|Джорданы|Лакост|Стоник|Баленса|Луи|Кельвин|Бриони|Зилли|Сен Лоран`),
    item: L(`Ветровка|Олимпийка|Пуховик|Дублёнка|Шуба|Норка|Панама|Бандана|Перстень|Часы|Котлы|Серьга|Платье|Чулки|Каблуки|Шпильки|Помада|Тушь|Браслет|Кулон|Жемчужины|Шёлковый платок|Кашемировый свитер|Кожаные перчатки|Белая рубашка|Пиджак оверсайз`),
    fmisc: L(`Чёрный шмот|Весь в бренде|Одет с иголочки|Винтажка|Мода улиц|Оригинал|Без бирки|Свежий лук|Ночной лук|Красная помада|Чёрное платье|Шёлковое платье|Жемчуг на шее|Шлейф духов|Запах твоих духов|Маленькое чёрное платье|Стиль без правил|Тихая роскошь|Старые деньги|Бархат и шёлк|Кашемир и кожа`),

    // ---------- ДЕНЬГИ / СТАТУС ----------
    sword: L(`Лавэшка|Бабосы|Зелень|Валюта|Купюры|Лям|Ярд|Навар|Мажор|Мажорка|Барин|Олигарх|Фарт|Удача|Фортуна|Сливки|Чаевые|Наследство|Богатство|Достаток|Сокровища|Клад|Казна|Монеты|Слитки|Жемчуг|Изумруды|Сапфиры|Рубины|Бриллиант|Корона|Империя|Династия|Дорогие привычки|Высший класс|Первый класс`),
    snoun: L(`Лавэ|Купюры|Котлы|Тачка|Брюлики|Камушки|Фарт|Лям|Жемчуг|Слава|Корона`),
    sjm: L(`Богатый|Жирный|Чёрный|Золотой|Ледяной|Дорогой|Новый|Старый|Чистый|Тяжёлый|Лёгкий|Большой|Белый`),
    snm: L(`кэш|чек|босс|бизнес|прайс|лям|навар|фарт|кошелёк|сейф|банк|счёт|куш|статус|стиль|вкус|блеск`),
    fame: L(`Слава|Популярность|Известность|Сцена|Софиты|Аплодисменты|Автограф|Фанаты|Поклонники|Аншлаг|Сольник|Гастроли|Тур|Гримёрка|Звезда|Звёздная болезнь|Папарацци|Хейтеры|Подписчики|Миллион просмотров|Тренды|Обложка|Интервью|Премия|Номер один|Платина|Золотой диск|Первое место|На вершине|Вершина|Легенда|Икона|Кумир|Идол|Узнают на улице|Красная дорожка|Вспышки камер|Овации|На бис|Финальный поклон|Свет рампы|Хедлайнер|Стадион|Премьера|Прямой эфир|Рейтинг|Топ чарта|Хит|Хит сезона|Новая звезда|Восходящая звезда|Звёздный час|Минута славы|Пятнадцать минут славы|Имя на афише|Афиша|Билеты проданы|Последний концерт|Первый концерт|Полный зал|Слава не лечит|Мне не нужна слава|Слава и одиночество|Звезда без неба|Цена славы|Обратная сторона славы`),
    sphrase: L(`Поднял лям|Лям на кармане|Купюры веером|Деньги к деньгам|Жить красиво|Живу как хочу|Много денег, мало сна|С нуля до ляма|Купил маме дом|Мама, я богат|Мама, мы поднялись|Сдачи не будет|Всё оплачено|Счёт на мне|Плачу за всех|Дорого, но можно|Миллион причин|Деньги не пахнут|Жемчуг и бриллианты|Золото на коже|Корона не жмёт|Богатым быть не грех|Красиво жить не запретишь`),

    // ---------- ЛЮБОВЬ / ОТНОШЕНИЯ ----------
    rword: L(`Малая|Малыш|Зая|Киса|Детка|Любимая|Любимый|Родная|Родной|Сладкая|Ласковая|Дикая|Королева|Принцесса|Муза|Одержимость|Безответно|Взаимно|Френдзона|Игнор|Сторис|Голосовое|Абонент|Вне зоны|Отпусти|Вернись|Забери|Обними|Шторм|Пожар|Химия|Тянет|Чувства|Влюбись|Не влюбляйся|Нежно|Ласка|Шёпот|Взгляд|Ресницы|Губы|Половинка|Судьба|Кольцо|Свадьба|Первая любовь|Последняя любовь|Мой человек|Родная душа|Магнетизм|Искра|Притяжение|Медовый месяц|Страсть|Тайна|Верная|Навсегда твой`),
    radjf: L(`Сладкая|Нежная|Ласковая|Дикая|Чужая|Моя|Твоя|Последняя|Первая|Взаимная|Безответная|Тайная|Вечная|Красивая|Ревнивая|Летняя`),
    rnounf: L(`любовь|девочка|ночь|история|тайна|слабость|ревность|нежность|страсть|встреча|привычка|половинка|улыбка|весна|ложь|правда`),
    radjm: L(`Сладкий|Нежный|Последний|Первый|Тайный|Вечный|Красивый|Чужой|Мой|Твой|Долгий|Робкий|Летний|Случайный`),
    rnounm: L(`поцелуй|роман|взгляд|секрет|голос|звонок|мальчик|человек|шёпот|вечер|танец|сон|рассвет|май`),
    rphrase: L(`Я тебя не отпущу|Ты моя слабость|Мы как в кино|Целуй меня в такси|Танцуй со мной|Позвони мне ночью|Твоя тушь на моём худи|Удали мои сторис|Смотрю твои сторис|Абонент недоступен|Мы были лучше всех|Сердце не камень|Давай без драмы|Мне не нужна другая|Ты мой краш|Малая, не грусти|Детка, ты огонь|Зая, я приеду|Любовь на районе|Свидание на крыше|До утра с тобой|Нам не по пути|Меня от тебя кроет|Это была не любовь|Ты мой самый красивый сон|Я тону в твоих глазах|Ты пахнешь летом|Обними меня покрепче|Мы с тобой против всех|Твоя улыбка моя слабость|Я украду тебя этой ночью|Останься до рассвета|Сердце бьётся в такт|Я нашёл тебя в толпе|Мы снова на одной волне|Держи меня за руку|Прости, что поздно|Ты знала, что я вернусь|Люби меня громче|Мы не спим до утра`),

    // ---------- ВАЙБ / КРАСИВЫЕ СЛОВА ----------
    vword: L(`Небо|Ветер|Сирень|Шёпот|Сияние|Берег|Волны|Море|Иней|Янтарь|Шёлк|Мёд|Карамель|Вишня|Клубника|Мята|Ваниль|Акварель|Витрины|Огни|Огни города|Зеркала|Отражение|Серебро|Звёзды|Звездопад|Крылья|Полёт|Космос|Лунный свет|Солнечный зайчик|Радуга|Северное сияние|Белые ночи|Летний дождь|Тёплый ветер|Морской бриз|Розовое небо|Облака|Пёрышко|Лепестки|Ромашки|Тюльпаны|Пионы|Розы|Лаванда|Одуванчики|Подсолнухи|Земляника|Персик|Мандарины|Корица|Шоколад|Какао|Плед|Уют|Тепло|Улыбайся|Танцуй|Лови момент|Беззаботно|Мечтатель|Фантазия|Сказка|Чудо|Волшебство|Фейерверк|Салют|Праздник|Кайфово|Красота|Огонь|Улёт|Тусовка|Движ|Вписка|Танцпол|Июль|Июнь|Солнце|Дача|Велик|Мороженое|Арбуз|Лимонад|Лёгкость|Счастливый|Счастливая`),
    vadjf: L(`Летняя|Тёплая|Лёгкая|Сладкая|Звёздная|Солнечная|Яркая|Беззаботная|Весёлая|Ночная|Розовая|Неоновая|Бархатная|Золотая|Безумная|Хрустальная`),
    vnounf: L(`ночь|тусовка|дискотека|вписка|волна|весна|жизнь|сказка|мечта|радость|погода|прогулка|поездка|романтика|история|осень`),
    vadjm: L(`Летний|Тёплый|Лёгкий|Сладкий|Звёздный|Солнечный|Яркий|Розовый|Неоновый|Бархатный|Золотой|Морской|Безумный|Хрустальный`),
    vnounm: L(`вечер|ветер|закат|рассвет|дождь|бриз|сон|день|танец|поцелуй|мотив|кайф|полёт|роман|сезон|июль`),

    // ---------- ГРУСТЬ ----------
    sadword: L(`Сырость|Мгла|Туман|Хмарь|Слякоть|Морось|Осадок|Шрам|Пропасть|Обрыв|Пустошь|Мерзлота|Заморозки|Сугробы|Февраль|Октябрь|Электричка|Вокзал|Перрон|Окраина|Подъезд|Балкон|Кухня в 3 ночи|Сквозняк|Бессонница|Отпусти меня|Не спится|Мне холодно|Я устал|Не хочу домой|Никому не нужен|Без звонка|Без тебя никак|Пустые окна|Гаснет свет|Тающий снег|Лёд на окнах|Ночной перрон|Последняя сигарета|Плачет небо|Письма в никуда|Старые письма|Выцветшие фото|Остывший чай|Недопитый кофе|Тишина между нами|Мы чужие|Город без тебя|Сердце в осколках|Капли на стекле`),
    sadjm: L(`Холодный|Пустой|Последний|Мокрый|Серый|Чужой|Ночной|Тихий|Белый|Разбитый|Потерянный|Грустный|Ледяной|Поздний|Старый|Одинокий|Остывший`),
    sadnm: L(`город|дождь|вечер|двор|телефон|балкон|подъезд|трамвай|снег|свет|кофе|лифт|вокзал|перрон|ноябрь|февраль|автобус|дым|звонок|чай`),
    sadjf: L(`Холодная|Пустая|Последняя|Мокрая|Серая|Чужая|Ночная|Тихая|Белая|Разбитая|Потерянная|Синяя|Долгая|Одинокая|Грустная|Остывшая`),
    sadnf: L(`ночь|кухня|комната|зима|улица|трасса|подушка|весна|осень|лестница|сигарета|станция|электричка|тишина|остановка|постель|квартира`),

    // ---------- ЦИФРЫ ----------
    num: L(`Двадцать пять|Тридцать три|Семь восемь|Ноль один|Ноль два|Пятьсот|Девятьсот|Сто процентов|Два ноль|Восьмёрка|Семёрка|Шестёрка|Девятка|Тройка|Единица`),
    numpl: L(`вписок|пачек|кругов|недель|бокалов|кадров|городов|стаканов|поцелуев|писем`),

    // ---------- ТАЧКИ / ЛАЙФ (немного) ----------
    car: L(`Бумер|Жигули|Буханка|Ладушка|Лексус|Кабриолет|Лимузин|Байк`),
    life: L(`Ночной ларёк|Круглосуточный|Кальянная|Караоке|Сапсан|Шереметьево|Майские`),
    drink: L(`Вино|Красное вино|Глинтвейн|Мохито|Чай с мятой|Лимонад|Ром|Джин`),

    // ---------- ТЬМА / МИСТИКА ----------
    dword: L(`Мрак|Тьма|Агония|Жуть|Кошмар|Ужас|Озноб|Бред|Мигрень|Отходняк|Похмелье|Бессмертие|Смерть|Конец|Ожоги|Вены|Нервы|Нервный срыв|Седые волосы|Чёрная кровь|Сердце стучит|Холод под кожей|Таблетки и вино|Пустые глаза|Сам себе враг`),
    mword: L(`Морок|Кощей|Змей Горыныч|Жар-птица|Сирин|Алконост|Перун|Велес|Ярило|Мара|Морана|Ведьмак|Знахарь|Оберег|Руны|Заговор|Приворот|Гадалка|Полнолуние|Луна|Новолуние|Комета|Созвездие|Знаки|Ангел-хранитель|Бесы|Нечисть|Вороны|Чёрный кот`),
    mlong: L(`Мой ангел-хранитель взял выходной|Бесы шепчут мне на ухо|Луна сегодня на моей стороне|Ведьма из соседнего подъезда|Я продал душу за бит|Кощей тоже был влюблён|Звёзды падают на район|Чёрный кот перешёл мне дорогу|Ворон знает, где я живу|Полнолуние над панельками|Гадалка сказала, что ты вернёшься`),

    // ---------- ЭСТЕТИКА (города поменьше) ----------
    city: L(`Мск|Спб|Северная столица|Бутово|Купчино|Химки|Ростов|Самара|Невский|Тверская|Ялта|Минск|Алматы`),
    fw: L(`Глянец|Обложка журнала|Фотосет|Кастинг|Красная дорожка|Вспышки камер|Шик|Блёстки|Пайетки|Стразы|Бархатный сезон|Витрина|Манекен|Фарфор|Хрусталь|Позолота|Перламутр|Сатин|Органза|Вуаль|Пудровый|Карамельный|Мраморный`),
    time: L(`Утро|Вечер|Полдень|Три часа ночи|Пять утра|Новогодняя ночь|Майские|Белые ночи|Бабье лето|Начало лета|Конец августа|Первое сентября|Последний звонок|Выпускной|Суббота|Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Сентябрь|Октябрь|Ноябрь|Девяностые|Двухтысячные`),

    // ---------- АБСУРД / КОНЦЕПТ ----------
    aphrase: L(`Дед на самокате|Кефир на районе|Чебурек в Гуччи|Морж в ЦУМе|Бабушка в Баленсиаге|Кот в Ламборгини|Лось на Рублёвке|Ковёр на стене|Тараканы в голове|Валенки от Маржелы|Борщ с Хеннесси|Гусь на Гелике|Шкаф ушёл в рейв`),
    cword: L(`Смысл жизни|Точка невозврата|Ноль градусов|Белый шум|Квантовый скачок|Чёрная дыра|Горизонт событий|Синдром самозванца|День сурка|Дежавю|Эхо поколения|Метамодерн|Цифровая тень|Последний человек|Обратный отсчёт|Сон во сне`),

    // ---------- РЭП / ТРЭП (без кринжа) ----------
    rap: L(`Флоу|Бэнгер|Панч|Панчи|Бит|Минус|Сингл|Микстейп|Демка|Студия|Будка|Вокал|Голос улиц|Голос района|Хип-хоп|Русский рэп|Мой район|Мой двор|Мои пацаны|Без базара|Отвечаю|По фактам|По красоте|Чётко|Ровно|Дерзко|Братишка|Брат|Кореш|Хулиган|Понятия|Фарт|Фартовый|Масть|Козырь|Туз|Улицы помнят|Мы из девяностых|С района|Андеграунд|Подвал|Без лейбла|Независимый|Первый куплет|Последний куплет|Тетрадь с текстами|Микрофон`),
    trap: L(`Гэнг|Бэнг|Флип|Трэп хата|Плаг|Пакеты|Ночная смена|Красные глаза|Розовый лин|Ледяные зубы|Грилзы|Опасный|Бешеный|Дикий|Отбитый|Суета|Движение|Газ в пол|Полный газ|Свэг|Фитиль|Хаос`),
    stjm: L(`Уличный|Чёрный|Дерзкий|Голодный|Бешеный|Дикий|Ледяной|Золотой|Злой|Молодой|Вечный|Бетонный|Районный|Фартовый|Лютый|Опасный`),
    stnm: L(`волк|район|пёс|король|хищник|бит|флоу|сезон|движ|тип|город|квартал|пацан|рэп|базар|стиль|двор|подвал|кореш|фитиль`),

    // ---------- РАЗГОВОРНОЕ / ПРЕДЛОЖЕНИЯ ----------
    talk: L(`я перезвоню|не сегодня|ещё по одной|давай без меня|сам разберусь|на связи|мне некогда|я в пути|скоро буду|подожди минуту|я у подъезда|выходи|спускайся|открой дверь|без обид|не грузи|всё будет|прорвёмся|не парься|забей|проехали|ну и ладно|в другой раз|не обещаю|поживём увидим|время покажет|так получилось|ничего личного|просто бизнес|снова понедельник|до зарплаты три дня|мама звонила|папа был прав|дома ждут|ключи под ковриком`),
    rusent: L(`Мама, я снова не спал|Я просто хотел быть рядом|Ты знаешь, как меня найти|Я не вернусь домой до утра|Мы выросли в этих дворах|Никто не знал, кем я стану|Я помню, как всё начиналось|Город спит, а я нет|Сегодня всё будет иначе|Я слишком долго молчал|Не говори маме, где я|Они не верили в меня|Всё, что я хотел, это ты|Мы были молоды и глупы|Я снова в этом городе|Скажи мне, что всё хорошо|Я больше не боюсь высоты|Давай убежим отсюда|Я знаю, ты тоже не спишь|Нас не остановить|Я буду помнить это лето|Это последний куплет|Пока вы спали, я работал|Я хочу, чтобы ты осталась|Небо сегодня такое красивое|Мы смотрим на одни и те же звёзды`),

    // ---------- ЗНАМЕНИТОСТИ ----------
    celeb: L(`Пушкин|Есенин|Маяковский|Высоцкий|Бродский|Достоевский|Чехов|Гагарин|Тарковский|Балабанов|Сергей Бодров|Виктор Цой|Земфира|Децл|Пугачёва|Алла|Киркоров|Шуфутинский|Михаил Круг|Лепс|Овечкин|Аршавин|Хабиб|Штирлиц|Шерлок|Шурик|Чебурашка|Гена|Карлсон|Буратино|Терминатор|Рэмбо|Рокки|Брюс Ли|Джеки Чан|Майкл Джексон|Тупак|Бигги|Эминем|Канье|Дрейк|Майк Тайсон|Мохаммед Али|Пабло Эскобар|Аль Капоне|Ди Каприо|Джонни Депп|Леон|Матильда|Лара Крофт|Шрек|Бэтмен|Дарт Вейдер|Гэндальф|Мэрилин Монро|Одри Хепбёрн|Коко Шанель`),

    // ---------- СЛЕНГ (нормальный) ----------
    slang: L(`Мутки|По факту|По фактам|Без базара|Альтушка|Отвечаю|Палево|Шухер|Делюга|Темка|Тема|Решаем|Мутим|Фарт|Чётко|Ровно|Зашквар|Хайп|Тусим|Гоняем|Погнали|Залипаю|Залетел|Пофиг|Поровну|Шарю|Мажорчик|Жесть|Капец|Красава|Братва|Расклад|Разговор есть|На расслабоне|Без суеты|Всё ровно`),

    digital: L(`Голосовуха|Скрин|Сторис|Прямой эфир|Плейлист|На репите|Черновик|Без сведения|Новая папка|Финал точно финал|Ссылка в описании|Без интернета|Один процент|Нет сети|Режим полёта`),
    punch: L(`Бетон|Сталь|Ртуть|Порох|Шторм|Гроза|Молния|Гром|Метель|Вьюга|Мороз|Иней|Янтарь|Малахит|Изумруд|Рубин|Аметист|Жемчуг|Хрусталь|Стекло|Зеркало|Маска|Капюшон|Сирена|Пульс|Ритм|Эхо|Вспышка|Прыжок|Рывок|Взлёт|Полёт|Высота|Глубина|Горизонт|Вершина|Магнит|Ракета|Комета|Метеор|Космонавт|Спутник|Атом|Мотор|Бомба|Взрыв|Хаос|Свобода|Воля|Жара|Пламя|Искра|Уголь|Дым|Туман|Призма|Инстинкт|Охота|Хищник|Волк|Ворон|Кобра|Пантера|Тигр|Сокол|Кит|Акула|Ласточка|Лебедь|Соловей|Бабочка|Колибри|Аврора|Нирвана|Эдем|Оазис|Мираж`)
  },

  themes: {
    fashion: [['{item} от {brand}', 0.7], ['{brand} на районе', 0.4], ['Весь в {brand}', 0.4]],
    status: [['{sjm} {snm}', 2.2], ['{fame}', 3.2], ['{snoun}, {snoun}', 0.3]],
    relations: [['{rword}', 1.5], ['{radjf} {rnounf}', 1.6], ['{radjm} {rnounm}', 1.4]],
    vibe: [['{vadjf} {vnounf}', 2], ['{vadjm} {vnounm}', 2]],
    sad: [['{sadjm} {sadnm}', 2.4], ['{sadjf} {sadnf}', 2.4], ['{rusent}', 0.5]],
    aesthetics: [['{city} не спит', 0.5], ['{city} в огнях', 0.4]],
    rap: [['{stjm} {stnm}', 2.2], ['{rusent}', 0.6], ['{rap}', 1.5]],
    trap: [['{stjm} {stnm}', 1], ['{trap}', 1.5]],
    real_talk: [['{rusent}', 1.3], ['{talk}', 1.5]],
    celebs: [['{celeb}', 1.5], ['{celeb} на районе', 0.4], ['Как {celeb}', 0.4]],
    slang: [['{slang}', 2]],
    punch: [['{punch}', 2]]
  },

  sprinkle: L(`ч. 3|ремикс|фристайл|демо`),
  albumTags: L(`Том 3|Сторона Б|Начало|Финал|Без фитов|Лонгплей`)
};

// ---------------------------------------------------------------------------
// ENGLISH EXTRA
// ---------------------------------------------------------------------------
export const EN_EXTRA: BankExtra = {
  lists: {
    brand: L(`Nike|Jordan|Adidas|Carhartt|Arcteryx|North Face|Represent|Fear Of God|Essentials|Rhude|Casablanca|Jacquemus|Wales Bonner|Sp5der|Broken Planet|Miu Miu|Khaite|Toteme|Ganni|Skims|Aime Leon Dore|Kith`),
    item: L(`Puffer|Tracksuit|Balaclava|Bandana|Grillz|Earring|Watch|Jersey|Windbreaker|Fur Coat|Mink|Slip Dress|Heels|Stilettos|Lipstick|Mascara|Bracelet|Locket|Pearls|Silk Scarf|White Shirt|Ballet Flats|Corset|Mini Skirt`),
    fcolor: L(`Pearl|Champagne|Sage|Lilac|Blush|Ivory White|Jet Black|Chrome Silver|Cherry Red|Baby Blue|Mocha|Espresso|Olive|Sand|Crimson`),
    fmisc: L(`Quiet Luxury|Old Money Aesthetic|Clean Girl|Off Duty|Street Style|Tailored Fit|Cashmere Season|Silk Slip|Pearl Necklace|Red Lipstick|Little Black Dress|Runway Ready|Model Off Duty|Fresh Fit|Night Fit|Dressed Up Nowhere To Go|Mirror Selfie|Outfit Repeater|Thrift Haul|Vintage Find|Designer Dreams|Velvet And Silk`),

    sword: L(`Cheese|Blessed|Winning|Big Bank|Commas|Paid|Ballin|Bossin|Cake|Dough|Lettuce|Moolah|Dividends|Royalty|Upgrade|Treasure|Riches|Fortune Teller|Gold Rush|Diamond Life|Crown|Empire|Dynasty|First Class|High Life|Penthouse Life`),
    sphrase: L(`Mama We Made It|Bought Mom A House|From The Mud|Started From Zero|Money On The Floor|Cash Never Sleeps|Rich Before Thirty|All Paid Off|Gold On My Skin|Pearls And Diamonds|Living Lavish|Champagne Problems|Crown Dont Fit|Born To Shine|Expensive Habits`),
    fame: L(`Fame|Famous|Spotlight|Center Stage|Applause|Encore|Standing Ovation|Sold Out|Headliner|Superstar|Rockstar|Popstar|Icon|Legend|Idol|Main Stage|Red Carpet|Paparazzi|Flashing Lights|Autograph|Fan Mail|Billboard|Number One|Top Of The Charts|Platinum|Gold Record|Viral|Trending|Fifteen Minutes|Overnight Success|Hall Of Fame|Walk Of Fame|World Tour|Arena|Stadium|Backstage Pass|Green Room|Live On Air|Prime Time|Rising Star|Shooting Star|Fame Is A Lie|Lonely At The Top|Price Of Fame|Famous For Nothing|Everybody Knows My Name|Name In Lights`),

    rword: L(`Baby Girl|Shawty|Wifey|Muse|Obsession|Addicted|Heartbreaker|Lovesong|Afterglow|Daydreamer|Rebound|Slow Burn|Soulmate|Sweet Nothings|Butterfly Kisses|Honeymoon|First Love|Last Love|My Person|Twin Flame|Chemistry|Spark|Gravity|Magnet|Destiny|Fate|Forever Yours|Only You|Desire|Tender|Intimacy|Cherish|Adore|Smitten|Infatuation|Longing|Yearning|Crush On You`),
    radj: L(`Sweet|Tender|Gentle|Secret|Endless|Eternal|First|Last|Lovesick|Starry|Golden|Velvet|Reckless|Hopeless|Beautiful|Midnight|Summer|Slow|Soft|Wild`),
    rnoun: L(`Romance|Kisses|Hearts|Promises|Whispers|Love Letters|Daydreams|Feelings|Lips|Touch|Eyes|Hands|Smile|Heartbeat|Dance|Night|Summer|Crush`),
    rphrase: L(`Dance With Me|Kiss Me In The Uber|Your Mascara On My Hoodie|Watched Your Story|Voicemail At 3AM|We Were Better|Dont Make It Weird|Youre My Weakness|Rooftop Date|Stay The Night|Love On The Block|Never Felt This Way|You Taste Like Summer|Drowning In Your Eyes|Hold Me Closer|Us Against The World|Your Smile Is My Weakness|Ill Steal You Tonight|Stay Until Sunrise|Heart Beats In Time|Found You In The Crowd|Same Wavelength|Hold My Hand|Sorry Im Late|Knew Youd Come Back|Love Me Louder|Up All Night With You|Text Me When You Land|Fall For Me Slowly|Youre The Reason|Meet Me At Midnight|I Wrote This For You|Lets Get Lost|Kiss Me In The Rain|You Feel Like Home|Love You In Every Universe`),

    vword: L(`Summertime|Pool Party|Road Trip|Lemonade|Popsicle|Heatwave|Weekend Mode|Roller Coaster|Starlight|Firework|Sundown|Rooftop|Beach House|Cotton Candy|Aurora|Serenity|Ethereal|Euphoric|Halcyon|Solace|Reverie|Wanderlust|Petrichor|Lullaby|Daylight|Moonbeam|Sunkissed|Honey Glow|Peach Fuzz|Strawberry Skies|Cherry Blossom|Wildflower|Sunflower|Lavender Haze|Rose Garden|Fireflies|Paper Planes|Kites|Seashells|Ocean Breeze|Salt Water|Tan Lines|Sweet Escape|Good Energy|Happy Place|Little Things|Love Life|Fresh Start|New Beginnings|Slow Mornings|Lazy Sunday|Golden Days|Endless Summer|Dream Big|Wild Hearts|Young Forever|Feel Alive|Shine|Radiant|Bloom|Blossom|Glow`),
    vadj: L(`Golden|Endless|Sweet|Velvet|Electric|Neon|Lazy|Sunny|Wild|Pretty|Dreamy|Starry|Pink|Lavender|Summer|Midnight|Crystal|Sugar|Honey|Cosmic`),
    vnoun: L(`Days|Nights|Skies|Dreams|Waves|Rain|Lights|Feelings|Hours|Mornings|Weekend|Daze|Haze|Glow|Paradise|Vibes|Memories|Roads|Season|Love`),

    sadword: L(`Overthinking|Insomniac|Static Rain|Cold Coffee|Empty Streets|Last Train|Gloomy Sunday|Ghost Of You|Unsaid|Missing Pieces|Heavy Heart|Hollow Chest|Quiet Room|Paper Hearts|Broken Promises|Faded Letters|Shattered|Undone|Drifting|Lost At Sea|Losing Sleep|Rainy Window|Fog|Mist|Frost|Grey Matter|Blue Monday|Cold December|Late November|Bittersweet|Nostalgia|Used To Be|Should Have Known|Never Again|Letting Go|Moving On|Without You|Lonely Hearts Club|Tears In Champagne|Crying In The Shower|Sad Songs On Repeat|Its Not The Same|Nobody Calls Anymore|Goodbye For Now`),
    sadadj: L(`Cold|Empty|Quiet|Grey|Lonely|Faded|Broken|Hollow|Silent|Last|Rainy|Blue|Heavy|Distant|Fragile|Pale`),
    sadnoun: L(`Room|Streets|Hearts|Nights|Coffee|Sunday|Train|Windows|Letters|Photos|Calls|Goodbyes|Hallways|Winter|Echoes|Memories`),

    punch: L(`Aurora|Velvet Sky|Moonlight|Starlight|Horizon|Halo|Nectar|Honey|Ivory|Opal|Pearl|Silk|Satin|Sapphire Sky|Crystal|Amber|Coral|Indigo|Violet|Scarlet|Crimson|Gilded|Bloom|Blossom|Rosewater|Lilac|Peony|Orchid|Jasmine|Meadow|Ocean Eyes|Riptide|Tidal|Undertow|Driftwood|Constellations|Supernova|Nebula|Galaxy|Orbit|Gravity|Zero Gravity|Cosmos|Comet|Meteor|Thunder|Lightning|Blizzard|Concrete|Steel|Rocket|Astronaut|Wolf|Raven|Cobra|Panther|Tiger|Falcon|Shark|Butterfly|Hummingbird|Swan|Phoenix|Wildfire|Ember|Spark|Flame|Smoke|Fog|Prism|Kaleidoscope|Hologram|Neon Heart|Electric Blue|Chrome Heart|Diamond Dust|Glass House|Paper Crown|Silver Lining|Golden Hour|Daydream|Mirage|Oasis|Eden|Nirvana|Utopia|Euphoria|Elysium|Infinity|Echo|Pulse|Rhythm|Tempo|Wavelength|Frequency|Static|Signal|Satellite`),

    rap: L(`Bars On Bars|Real Ones|For The Gang|Day Ones|Hood Legend|Block Boy|Street Gospel|Mic Drop|Studio Nights|Booth Talk|Indie Forever|Basement Tapes|First Verse|Last Verse|Notebook Bars|Pen Game|Built Different|Self Made|No Days Off|Hustle Hard|Came Up|Underground King|Hometown Hero`),
    trap: L(`Pour Up|Run It Up|Big Steppin|Ice Cold|Pink Lean|Trap Star|Plug Walk|Gas Pedal|Full Throttle|Off The Rip|Too Turnt|Night Shift|Red Eyes|Wild Out|Chaos|Mayhem`),
    talk: L(`call me back|not tonight|one more round|outside your door|almost there|wait a minute|keys under the mat|mom called|payday friday|running late|we good|on my way|be right there|come outside|open the door|no hard feelings|its whatever|maybe next time|time will tell|nothing personal|just business|monday again`),
    enlong: L(`I just wanted to be close to you|Mama I didnt sleep again|You know where to find me|Im not coming home tonight|We grew up in these streets|Nobody knew who Id become|The city sleeps but I dont|I stayed quiet for too long|They never believed in me|We were young and stupid|Tell me everything is fine|Im not afraid of heights anymore|Lets run away from here|I know you cant sleep either|Ill remember this summer|While you were sleeping I was working|The sky looks so pretty tonight|We look at the same stars|Everything I wanted was you|Some nights I still call your name`),

    celeb: L(`Tupac|Biggie|Eminem|Kanye|Drake|Frank Ocean|Michael Jackson|Bruce Lee|Jackie Chan|Rambo|Rocky|Terminator|Muhammad Ali|Pablo Escobar|Al Capone|Johnny Depp|Leon|Shrek|Batman|Spiderman|Darth Vader|Gandalf|Audrey Hepburn|Coco Chanel|Princess Diana|Amy Winehouse|Lana|Britney|Madonna|Prince|Freddie Mercury|James Dean|Steve Jobs|Beyonce|Rihanna`),
    slang: L(`Bussin|Sheesh|Valid|Goated|Big W|Hits Different|Touch Grass|Were So Back|Aura Points|Main Character Energy|Soft Life|Unbothered|Living Rent Free|Say Less|Its Giving|No Notes|Understood The Assignment|Slay|Periodt|Vibes Only|Big Mood|Night Owl|Bad Habit|Real Talk|Straight Up|For Real|On God|Facts`)
  },
  themes: {
    status: [['{fame}', 3]],
    relations: [['{radj} {rnoun}', 1.2], ['{rword}', 1]],
    vibe: [['{vadj} {vnoun}', 2.2]],
    sad: [['{sadadj} {sadnoun}', 2.2], ['{enlong}', 0.4]],
    real_talk: [['{enlong}', 1.2]],
    rap: [['{enlong}', 0.5]],
    punch: [['{punch}', 1.5]]
  },
  sprinkle: L(`Remix|Freestyle|Demo|Pt 3`),
  albumTags: L(`Vol 3|Side B|The Beginning|The End|No Features|Long Play`)
};
