/* ==========================================================
   5 языков любви — общий скрипт для всех страниц
   1) появление блоков при прокрутке (все страницы)
   2) тест из 10 вопросов, режим «вдвоём» и сравнение (test.html)
   3) генератор идей (ideas.html)
   ========================================================== */
(function () {
  'use strict';

  /* ---------- Общие данные и помощники ---------- */

  const LANG_ORDER = ['words', 'gifts', 'time', 'help', 'touch'];

  const LANG_NAMES = {
    words: 'Слова поддержки',
    gifts: 'Подарки',
    time: 'Время вместе',
    help: 'Помощь',
    touch: 'Прикосновения'
  };

  const STORAGE_RESULTS = 'lovelang-results-v1';
  const STORAGE_SAVED = 'lovelang-saved-v1';

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, (ch) => map[ch]);
  }

  function readStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* хранилище недоступно — работаем без него */
    }
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function goTo(section, heading) {
    if (section && section.scrollIntoView) {
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }
    if (heading && heading.focus) {
      heading.focus({ preventScroll: true });
    }
  }

  function quoted(key) {
    return '«' + LANG_NAMES[key] + '»';
  }

  function joinList(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' и ' + items[items.length - 1];
  }

  /* ---------- Появление блоков при прокрутке ---------- */

  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

    document.documentElement.classList.add('js-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* ==========================================================
     Страница «Тест»
     ========================================================== */

  function initTest() {
    if (!$('start-btn')) return;

    /* 10 вопросов = все 10 пар из 5 языков. Каждый язык встречается ровно 4 раза,
       поэтому максимум по любому языку — 4 балла, а сумма всех баллов — 10. */
    const QUESTIONS = [
      {
        a: { lang: 'words', text: 'Мне приятно, когда партнёр говорит, как сильно меня ценит.' },
        b: { lang: 'gifts', text: 'Мне приятно получать неожиданные подарки без всякого повода.' }
      },
      {
        a: { lang: 'time', text: 'Я чувствую себя любимым, когда мы проводим вечер вместе без телефонов.' },
        b: { lang: 'help', text: 'Я чувствую себя любимым, когда партнёр берёт на себя часть моих дел.' }
      },
      {
        a: { lang: 'touch', text: 'Мне важно обнять партнёра при встрече и при расставании.' },
        b: { lang: 'words', text: 'Мне важно слышать «я тобой горжусь» и «у тебя всё получится».' }
      },
      {
        a: { lang: 'gifts', text: 'Я дорожу вещами, которые мне дарили: они напоминают о человеке.' },
        b: { lang: 'time', text: 'Я дорожу моментами, когда партнёр полностью занят только мной.' }
      },
      {
        a: { lang: 'help', text: 'Для меня забота — это дела, а не обещания: починили, приготовили, помогли.' },
        b: { lang: 'touch', text: 'Для меня забота — это объятия, прикосновение к руке и тепло рядом.' }
      },
      {
        a: { lang: 'words', text: 'Меня радует тёплое сообщение посреди рабочего дня.' },
        b: { lang: 'time', text: 'Меня радует, когда партнёр находит время на прогулку или разговор.' }
      },
      {
        a: { lang: 'gifts', text: 'Мне дорого, когда партнёр запоминает, что мне нравится, и дарит это.' },
        b: { lang: 'help', text: 'Мне дорого, когда партнёр замечает, что я устал, и сам помогает.' }
      },
      {
        a: { lang: 'time', text: 'Лучший вечер для меня — спокойный, вдвоём, с неспешным разговором.' },
        b: { lang: 'touch', text: 'Лучший вечер для меня — под одним пледом, рядом и в обнимку.' }
      },
      {
        a: { lang: 'words', text: 'После ссоры мне нужны добрые слова и признание, что я важен.' },
        b: { lang: 'help', text: 'После ссоры мне нужно, чтобы партнёр сделал шаг навстречу делом.' }
      },
      {
        a: { lang: 'gifts', text: 'Мне приятно получить маленький знак внимания: цветок, открытку, сладость.' },
        b: { lang: 'touch', text: 'Мне приятно, когда партнёр берёт меня за руку на ходу.' }
      }
    ];

    const TOTAL = QUESTIONS.length;
    const MAX_SCORE = 4;

    const els = {
      setup: $('setup'),
      names: $('names'),
      name1: $('name1'),
      name2: $('name2'),
      start: $('start-btn'),
      quiz: $('quiz'),
      count: $('quiz-count'),
      player: $('quiz-player'),
      progress: $('progress'),
      bar: $('progress-bar'),
      title: $('quiz-title'),
      optA: $('opt-a'),
      optB: $('opt-b'),
      textA: $('opt-a-text'),
      textB: $('opt-b-text'),
      back: $('btn-back'),
      next: $('btn-next'),
      nextLabel: $('btn-next-label'),
      handoff: $('handoff'),
      handoffTitle: $('handoff-title'),
      handoffText: $('handoff-text'),
      handoffBtn: $('handoff-btn'),
      results: $('results'),
      resultsTitle: $('results-title'),
      resultsLead: $('results-lead'),
      grid: $('results-grid'),
      compare: $('compare'),
      compareTitle: $('compare-title'),
      compareBody: $('compare-body'),
      compareActions: $('compare-actions'),
      ideasLink: $('results-ideas'),
      restart: $('restart-btn')
    };

    const modeInputs = document.querySelectorAll('input[name="mode"]');

    const state = {
      mode: 'pair',
      names: ['Партнёр 1', 'Партнёр 2'],
      player: 0,
      index: 0,
      answers: [[], []]
    };

    function currentMode() {
      const checked = document.querySelector('input[name="mode"]:checked');
      return checked ? checked.value : 'pair';
    }

    function syncMode() {
      els.names.hidden = currentMode() === 'solo';
    }

    function cleanName(value, fallback) {
      const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 30);
      return text || fallback;
    }

    function setPressed(button, on) {
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    /* ----- Прохождение теста ----- */

    function startTest() {
      state.mode = currentMode();
      state.names =
        state.mode === 'pair'
          ? [cleanName(els.name1.value, 'Партнёр 1'), cleanName(els.name2.value, 'Партнёр 2')]
          : ['Вы'];
      state.player = 0;
      state.index = 0;
      state.answers = [[], []];

      els.setup.hidden = true;
      els.handoff.hidden = true;
      els.results.hidden = true;
      els.quiz.hidden = false;

      renderQuestion();
      goTo(els.quiz, els.title);
    }

    function renderQuestion() {
      const q = QUESTIONS[state.index];
      const chosen = state.answers[state.player][state.index] || null;
      const last = state.index === TOTAL - 1;

      els.count.textContent = 'Вопрос ' + (state.index + 1) + ' из ' + TOTAL;
      els.progress.setAttribute('aria-valuenow', String(state.index + 1));
      els.bar.style.width = ((state.index + 1) / TOTAL) * 100 + '%';

      if (state.mode === 'pair') {
        els.player.hidden = false;
        els.player.textContent = 'Отвечает: ' + state.names[state.player];
      } else {
        els.player.hidden = true;
      }

      els.textA.textContent = q.a.text;
      els.textB.textContent = q.b.text;
      setPressed(els.optA, chosen === 'a');
      setPressed(els.optB, chosen === 'b');

      els.back.disabled = state.index === 0;
      els.next.disabled = !chosen;

      if (!last) {
        els.nextLabel.textContent = 'Далее';
      } else if (state.mode === 'pair' && state.player === 0) {
        els.nextLabel.textContent = 'Завершить';
      } else {
        els.nextLabel.textContent = 'Показать результат';
      }
    }

    function choose(letter) {
      state.answers[state.player][state.index] = letter;
      setPressed(els.optA, letter === 'a');
      setPressed(els.optB, letter === 'b');
      els.next.disabled = false;
    }

    function goNext() {
      if (!state.answers[state.player][state.index]) return;
      if (state.index < TOTAL - 1) {
        state.index += 1;
        renderQuestion();
        return;
      }
      if (state.mode === 'pair' && state.player === 0) {
        showHandoff();
      } else {
        showResults();
      }
    }

    function goBack() {
      if (state.index === 0) return;
      state.index -= 1;
      renderQuestion();
    }

    function showHandoff() {
      els.quiz.hidden = true;
      els.handoff.hidden = false;
      els.handoffTitle.textContent = 'Теперь отвечает: ' + state.names[1];
      els.handoffText.textContent =
        state.names[0] + ', ваши ответы записаны и спрятаны. Передайте устройство партнёру — теперь его очередь.';
      goTo(els.handoff, els.handoffTitle);
    }

    function startSecondPlayer() {
      state.player = 1;
      state.index = 0;
      els.handoff.hidden = true;
      els.quiz.hidden = false;
      renderQuestion();
      goTo(els.quiz, els.title);
    }

    /* ----- Подсчёт и вывод результатов ----- */

    function scoresFor(player) {
      const scores = {};
      LANG_ORDER.forEach((lang) => {
        scores[lang] = 0;
      });
      QUESTIONS.forEach((q, i) => {
        const answer = state.answers[player][i];
        if (answer === 'a') scores[q.a.lang] += 1;
        if (answer === 'b') scores[q.b.lang] += 1;
      });
      return scores;
    }

    function topLangs(scores) {
      const max = Math.max.apply(
        null,
        LANG_ORDER.map((lang) => scores[lang])
      );
      return LANG_ORDER.filter((lang) => scores[lang] === max);
    }

    function cardHtml(d, solo) {
      const sorted = LANG_ORDER.slice().sort(
        (x, y) => d.scores[y] - d.scores[x] || LANG_ORDER.indexOf(x) - LANG_ORDER.indexOf(y)
      );

      const bars = sorted
        .map((lang) => {
          const width = (d.scores[lang] / MAX_SCORE) * 100;
          return (
            '<li class="lang--' + lang + '">' +
            '<div class="bar__label"><span>' + LANG_NAMES[lang] + '</span>' +
            '<span>' + d.scores[lang] + '<span class="sr-only"> из ' + MAX_SCORE + '</span></span></div>' +
            '<div class="bar__track" aria-hidden="true"><div class="bar__fill" data-width="' + width + '"></div></div>' +
            '</li>'
          );
        })
        .join('');

      const chipLabel =
        (d.top.length > 1 ? 'Главные языки: ' : 'Главный язык: ') +
        joinList(d.top.map((lang) => LANG_NAMES[lang].toLowerCase()));

      const heading = solo ? 'Ваш результат' : esc(d.name);

      return (
        '<article class="result-card">' +
        '<div class="result-card__head">' +
        '<h3 class="result-card__name">' + heading + '</h3>' +
        '<span class="chip lang--' + d.top[0] + '">' + chipLabel + '</span>' +
        '</div>' +
        '<ul class="bars">' + bars + '</ul>' +
        '</article>'
      );
    }

    function buildCompare(a, b) {
      const common = a.top.filter((lang) => b.top.indexOf(lang) !== -1);
      const mains =
        'Главные языки: ' +
        a.name + ' — ' + joinList(a.top.map(quoted)) + '; ' +
        b.name + ' — ' + joinList(b.top.map(quoted)) + '.';

      if (common.length) {
        return {
          title: 'Общий главный язык: ' + joinList(common.map(quoted)),
          body:
            'Вы оба лучше всего чувствуете любовь именно так — вам проще понимать друг друга. ' +
            'Закрепляйте это в мелочах каждый день.'
        };
      }

      let best = LANG_ORDER[0];
      let bestMin = -1;
      let bestSum = -1;
      LANG_ORDER.forEach((lang) => {
        const min = Math.min(a.scores[lang], b.scores[lang]);
        const sum = a.scores[lang] + b.scores[lang];
        if (min > bestMin || (min === bestMin && sum > bestSum)) {
          best = lang;
          bestMin = min;
          bestSum = sum;
        }
      });

      if (bestMin >= 2) {
        return {
          title: 'Что вас объединяет: ' + quoted(best),
          body: mains + ' Но язык ' + quoted(best) + ' важен для вас обоих — начните с него.'
        };
      }

      return {
        title: 'Ваши языки различаются',
        body:
          mains +
          ' Это нормально: учитесь говорить на языке друг друга, а идеи на следующей странице подскажут, с чего начать.'
      };
    }

    function showResults() {
      const players = state.mode === 'pair' ? [0, 1] : [0];
      const data = players.map((p) => {
        const scores = scoresFor(p);
        return { name: state.names[p], scores: scores, top: topLangs(scores) };
      });
      const solo = data.length === 1;

      els.quiz.hidden = true;
      els.handoff.hidden = true;
      els.results.hidden = false;

      els.grid.className = solo ? 'results-grid results-grid--single' : 'results-grid';
      els.grid.innerHTML = data.map((d) => cardHtml(d, solo)).join('');

      if (solo) {
        els.resultsTitle.textContent = 'Ваш главный язык — ' + joinList(data[0].top.map(quoted));
        els.resultsLead.textContent =
          'Чем длиннее шкала, тем важнее для вас этот язык. Пусть партнёр тоже пройдёт тест — тогда можно сравнить результаты.';
        els.compare.hidden = true;
        els.ideasLink.hidden = false;
      } else {
        const cmp = buildCompare(data[0], data[1]);
        els.resultsTitle.textContent = 'Ваши результаты';
        els.resultsLead.textContent =
          'Чем длиннее шкала, тем важнее язык. Ниже — сравнение вашей пары.';
        els.compareTitle.textContent = cmp.title;
        els.compareBody.textContent = cmp.body;
        els.compareActions.innerHTML = data
          .map(
            (d, i) =>
              '<a class="btn ' + (i === 0 ? 'btn--light' : 'btn--outline-light') +
              '" href="ideas.html?lang=' + d.top[0] + '">Идеи для языка ' +
              esc(quoted(d.top[0])) + ' (' + esc(d.name) + ')</a>'
          )
          .join('');
        els.compare.hidden = false;
        els.ideasLink.hidden = true;
      }

      /* Анимация шкал: сначала нули, на следующем кадре — реальная ширина */
      const fills = els.grid.querySelectorAll('.bar__fill');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          fills.forEach((fill) => {
            fill.style.width = fill.getAttribute('data-width') + '%';
          });
        });
      });

      writeStore(STORAGE_RESULTS, {
        mode: state.mode,
        players: data.map((d) => ({ name: d.name, top: d.top, scores: d.scores }))
      });

      goTo(els.results, els.resultsTitle);
    }

    function restart() {
      els.results.hidden = true;
      els.quiz.hidden = true;
      els.handoff.hidden = true;
      els.setup.hidden = false;
      syncMode();
      goTo(els.setup, null);
      els.start.focus({ preventScroll: true });
    }

    /* ----- События ----- */

    modeInputs.forEach((input) => input.addEventListener('change', syncMode));
    els.start.addEventListener('click', startTest);
    [els.name1, els.name2].forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          startTest();
        }
      });
    });
    els.optA.addEventListener('click', () => choose('a'));
    els.optB.addEventListener('click', () => choose('b'));
    els.next.addEventListener('click', goNext);
    els.back.addEventListener('click', goBack);
    els.handoffBtn.addEventListener('click', startSecondPlayer);
    els.restart.addEventListener('click', restart);

    syncMode();
  }

  /* ==========================================================
     Страница «Генератор идей»
     ========================================================== */

  function initIdeas() {
    if (!$('gen-form')) return;

    const OCCASIONS = {
      everyday: 'Обычный день',
      weekend: 'Выходные',
      anniversary: 'Годовщина',
      argue: 'После ссоры'
    };

    const BUDGETS = {
      free: 'Бесплатно',
      cheap: 'Недорого',
      any: 'Без ограничений'
    };

    const COST_LABELS = {
      free: 'Бесплатно',
      cheap: 'Недорого',
      any: 'Дороже'
    };

    /* Формат строки: [название, описание, длительность, стоимость, повода через пробел] */
    const RAW = {
      words: [
        ['Сообщение посреди дня', 'Напишите короткое тёплое сообщение: за что вы сегодня благодарны партнёру. Без просьб и вопросов.', '5 минут', 'free', 'everyday argue'],
        ['Три вещи, которые я в тебе ценю', 'Назовите вслух три конкретные черты или поступка партнёра за последнюю неделю. Чем точнее, тем лучше.', '10 минут', 'free', 'everyday weekend anniversary'],
        ['Слова после ссоры', 'Начните разговор с «Мне важно, что мы вместе» и только потом обсуждайте разногласия. Говорите о своих чувствах, а не об ошибках партнёра.', '15 минут', 'free', 'argue'],
        ['Письмо-признание', 'Напишите от руки несколько абзацев: что вы почувствовали при первой встрече и чем дорожите сейчас. Прочитайте вслух или оставьте на видном месте.', '30 минут', 'free', 'anniversary weekend'],
        ['Вечер комплиментов', 'По очереди говорите друг другу по пять искренних комплиментов — не про внешность, а про характер и поступки.', '20 минут', 'free', 'weekend everyday'],
        ['Открытка без повода', 'Купите или нарисуйте открытку и напишите в ней, почему вы рады, что партнёр рядом.', '20 минут', 'cheap', 'everyday anniversary'],
        ['Альбом воспоминаний', 'Соберите небольшой альбом из совместных фото и подпишите каждое тёплой фразой.', '2 часа', 'cheap', 'anniversary weekend'],
        ['Цветок и пара честных строк', 'Небольшой цветок и искренняя записка помогут сделать первый шаг после ссоры.', '30 минут', 'cheap', 'argue'],
        ['Видеопоздравление от близких', 'Попросите друзей и родных записать для партнёра короткие тёплые слова и соберите их в одно видео.', '3 часа', 'any', 'anniversary'],
        ['Книга о вас двоих', 'Закажите небольшую фотокнигу с вашими историями и подписями — слова, которые можно перечитывать.', '1 неделя', 'any', 'anniversary']
      ],
      gifts: [
        ['Подарок своими руками', 'Сделайте что-то маленькое самостоятельно: рисунок, плейлист, закладку. Важно внимание, а не цена.', '30 минут', 'free', 'everyday weekend anniversary'],
        ['Находка по пути', 'Принесите домой то, что напомнило о партнёре: красивый камешек, листок, забавную мелочь.', '5 минут', 'free', 'everyday argue'],
        ['Купоны на желания', 'Нарисуйте набор купонов: «завтрак в постель», «вечер без дел», «массаж». Пусть партнёр обменивает их в любое время.', '30 минут', 'free', 'weekend anniversary'],
        ['Коробка воспоминаний', 'Соберите в коробку билеты, чеки и записки с вашими общими событиями и подарите на годовщину.', '1 час', 'free', 'anniversary'],
        ['Жест примирения', 'Приготовьте любимое лакомство партнёра или нарисуйте открытку — маленький знак, что вы готовы к миру.', '30 минут', 'free', 'argue everyday'],
        ['Любимая сладость', 'Купите то, что партнёр любит, и оставьте на видном месте без объяснений.', '15 минут', 'cheap', 'everyday argue weekend'],
        ['Цветок без повода', 'Один цветок или маленький букет по дороге домой. Без даты в календаре, просто потому, что вы подумали о партнёре.', '15 минут', 'cheap', 'everyday weekend'],
        ['Подарок на память', 'Выберите вещь, которая связана с вашей историей: место, шутка, общая поездка. Подпишите, почему вы её выбрали.', '1 час', 'cheap', 'anniversary weekend'],
        ['Большой сюрприз', 'Подарите то, о чём партнёр давно говорил, но не покупал себе. Вспомните прошлые разговоры.', '2 часа', 'any', 'anniversary'],
        ['Именная вещь', 'Закажите гравировку, украшение или вещь с датой и словами, важными для вас двоих.', '1 неделя', 'any', 'anniversary weekend']
      ],
      time: [
        ['Прогулка без маршрута', 'Выйдите из дома и сворачивайте там, где захочется. Цель одна — быть рядом и никуда не спешить.', '1–2 часа', 'free', 'everyday weekend argue'],
        ['Утренний кофе вдвоём', 'Встаньте на 20 минут раньше и выпейте кофе вместе — без новостей и телефонов.', '20 минут', 'free', 'everyday'],
        ['Вопросы для разговора', 'Задайте друг другу по три вопроса, которые давно хотели задать: о мечтах, детстве и планах.', '1 час', 'free', 'weekend anniversary everyday'],
        ['Закат вдвоём', 'Найдите место повыше, возьмите плед и просто посмотрите на закат вместе. Телефоны оставьте в кармане.', '1 час', 'free', 'weekend anniversary'],
        ['Разговор после ссоры', 'Сядьте рядом без телефонов и по очереди скажите, что вы чувствовали. Слушайте до конца, не перебивая.', '30 минут', 'free', 'argue'],
        ['Вечер без экранов', 'Выключите телефоны на два часа, приготовьте ужин вместе и поговорите о том, что радовало вас на этой неделе.', '2 часа', 'cheap', 'everyday weekend'],
        ['Домашний кинотеатр на двоих', 'Выбирайте фильм по очереди, устройтесь под одним пледом и обсудите увиденное после титров.', '3 часа', 'cheap', 'weekend everyday'],
        ['Пикник в парке', 'Возьмите простую еду и плед, найдите тихое место и проведите там пару часов без дел.', '3 часа', 'cheap', 'weekend anniversary'],
        ['Выходной в другом городе', 'Съездите вдвоём туда, где ещё не были: гуляйте, пробуйте местную еду, не составляя плотного плана.', '1 день', 'any', 'weekend anniversary'],
        ['Ужин в особенном месте', 'Выберите кафе или ресторан, связанный с вашей историей, и проведите вечер, никуда не торопясь.', '3 часа', 'any', 'anniversary']
      ],
      help: [
        ['Взять на себя домашнее дело', 'Узнайте, что сегодня больше всего тяготит партнёра, и сделайте это сами, не дожидаясь просьбы.', '30 минут', 'free', 'everyday argue'],
        ['Утро без забот', 'Встаньте раньше и подготовьте всё, что обычно делает партнёр: завтрак, вещи, сумку.', '30 минут', 'free', 'everyday weekend'],
        ['Уборка-сюрприз', 'Пока партнёр занят, наведите порядок там, где давно хотелось, но не доходили руки.', '1 час', 'free', 'weekend everyday argue'],
        ['День без списка дел', 'Возьмите на себя все бытовые заботы на один день, чтобы партнёр мог отдохнуть.', '1 день', 'free', 'weekend anniversary'],
        ['Решить давнюю задачу', 'Сделайте то, что партнёр откладывал: запишитесь к врачу, заполните бумаги, сделайте мелкое дело.', '1 час', 'free', 'weekend anniversary argue'],
        ['Ужин от вас', 'Приготовьте любимое блюдо партнёра в самый загруженный его день.', '1,5 часа', 'cheap', 'everyday weekend anniversary'],
        ['Продукты на неделю', 'Составьте список и закупите всё нужное на неделю, чтобы партнёру не пришлось об этом думать.', '1,5 часа', 'cheap', 'everyday weekend'],
        ['Починить что-то в доме', 'Заменить лампочку, подтянуть полку, смазать дверь: небольшой ремонт, о котором давно говорили.', '1 час', 'cheap', 'weekend argue'],
        ['Заказать уборку или химчистку', 'Возьмите на себя организацию и оплату того, что партнёр давно откладывал: уборки, ремонта вещей, химчистки.', '1 день', 'any', 'anniversary weekend'],
        ['Организовать поездку', 'Продумайте билеты, жильё и маршрут, чтобы партнёру осталось только собрать чемодан.', '1 неделя', 'any', 'anniversary weekend']
      ],
      touch: [
        ['Объятие на 20 секунд', 'Обнимайте партнёра при встрече чуть дольше обычного — до тех пор, пока оба не расслабитесь.', '1 минута', 'free', 'everyday argue'],
        ['Массаж плеч', 'Предложите вечером размять партнёру плечи и шею, пока он или она отдыхает.', '15 минут', 'free', 'everyday weekend argue'],
        ['Держаться за руки на прогулке', 'Идите рядом и держитесь за руки — для многих это самый простой способ сказать «я с тобой».', '30 минут', 'free', 'everyday weekend anniversary'],
        ['Вечер под одним пледом', 'Выберите фильм или просто поговорите, сидя рядом и обнявшись.', '2 часа', 'free', 'weekend everyday anniversary'],
        ['Танец на кухне', 'Включите любимую песню и потанцуйте дома — медленно, близко, без свидетелей.', '10 минут', 'free', 'everyday anniversary argue'],
        ['Домашний спа-вечер', 'Свечи, крем для рук, массаж ступней — проведите вечер в заботе друг о друге.', '1,5 часа', 'cheap', 'weekend anniversary'],
        ['Мастер-класс по парному танцу', 'Запишитесь на занятие по танцу для двоих: близость, ритм и много смеха.', '2 часа', 'cheap', 'weekend anniversary'],
        ['Прогулка с горячим чаем', 'Возьмите тёплый напиток, найдите скамейку и посидите вплотную, обнявшись.', '1 час', 'cheap', 'weekend everyday argue'],
        ['Парный массаж в спа', 'Запишитесь на расслабляющую процедуру для двоих и проведите время в тишине и тепле.', '3 часа', 'any', 'anniversary weekend'],
        ['День в бане или термах', 'Проведите день в тепле: прогулка, тёплая вода и много времени рядом.', '1 день', 'any', 'anniversary weekend']
      ]
    };

    const IDEAS = [];
    const IDEAS_BY_ID = {};
    LANG_ORDER.forEach((lang) => {
      RAW[lang].forEach((row, i) => {
        const idea = {
          id: lang + '-' + (i + 1),
          lang: lang,
          title: row[0],
          text: row[1],
          time: row[2],
          cost: row[3],
          when: row[4].split(' ')
        };
        IDEAS.push(idea);
        IDEAS_BY_ID[idea.id] = idea;
      });
    });

    const form = $('gen-form');
    const els = {
      scope: $('ideas-scope'),
      meta: $('ideas-meta'),
      title: $('ideas-title'),
      note: $('ideas-note'),
      grid: $('idea-grid'),
      refresh: $('refresh-btn'),
      result: $('ideas-result'),
      fromTest: $('from-test'),
      fromTestButtons: $('from-test-buttons'),
      savedSection: $('saved'),
      savedTitle: $('saved-title'),
      savedList: $('saved-list')
    };

    const state = {
      params: { lang: 'time', occasion: 'weekend', budget: 'cheap' },
      ideas: [],
      saved: readStore(STORAGE_SAVED, [])
    };

    if (!Array.isArray(state.saved)) state.saved = [];
    state.saved = state.saved.filter((id) => typeof id === 'string' && IDEAS_BY_ID[id]);

    /* ----- Подбор идей ----- */

    function readParams() {
      const get = (name, fallback) => {
        const checked = form.querySelector('input[name="' + name + '"]:checked');
        return checked ? checked.value : fallback;
      };
      return {
        lang: get('lang', 'time'),
        occasion: get('occasion', 'weekend'),
        budget: get('budget', 'cheap')
      };
    }

    function setParam(name, value) {
      const input = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (input) input.checked = true;
    }

    function poolFor(params) {
      return IDEAS.filter((idea) => {
        if (idea.lang !== params.lang) return false;
        if (params.budget === 'free') return idea.cost === 'free';
        if (params.budget === 'cheap') return idea.cost !== 'any';
        return true;
      });
    }

    /* Сначала идеи, подходящие по поводу (вперемешку), затем остальные */
    function rank(list, occasion) {
      const match = shuffle(list.filter((idea) => idea.when.indexOf(occasion) !== -1));
      const rest = shuffle(list.filter((idea) => idea.when.indexOf(occasion) === -1));
      return match.concat(rest);
    }

    function unusedIdeas() {
      const shown = state.ideas.map((idea) => idea.id);
      return rank(poolFor(state.params), state.params.occasion).filter(
        (idea) => shown.indexOf(idea.id) === -1
      );
    }

    /* ----- Вывод ----- */

    function heartIcon() {
      return (
        '<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
        '<path class="heart-use" d="M0 28C-60-18-34-62 0-30C34-62 60-18 0 28Z" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round"/>' +
        '</svg>'
      );
    }

    function cardHtml(idea, index) {
      const isSaved = state.saved.indexOf(idea.id) !== -1;
      const num = String(index + 1).padStart(2, '0');
      return (
        '<article class="idea-card" tabindex="-1" data-index="' + index + '" aria-labelledby="idea-title-' + index + '">' +
        '<p class="idea-card__num" aria-hidden="true">' + num + '</p>' +
        '<h3 class="idea-card__title" id="idea-title-' + index + '">' + idea.title + '</h3>' +
        '<p class="idea-card__text">' + idea.text + '</p>' +
        '<div class="tags"><span class="tag tag--accent">' + idea.time + '</span>' +
        '<span class="tag">' + COST_LABELS[idea.cost] + '</span></div>' +
        '<div class="idea-card__actions">' +
        '<button type="button" class="link-btn link-btn--accent" data-action="save" data-id="' + idea.id +
        '" aria-pressed="' + (isSaved ? 'true' : 'false') + '">' + heartIcon() + 'Сохранить</button>' +
        '<button type="button" class="link-btn" data-action="replace" data-index="' + index + '">Заменить идею</button>' +
        '</div>' +
        '</article>'
      );
    }

    function moreHtml() {
      if (unusedIdeas().length > 0) {
        return (
          '<div class="idea-more">' +
          '<h3 class="idea-more__title">Хотите ещё?</h3>' +
          '<p class="idea-more__text">Добавим ещё идеи для тех же настроек.</p>' +
          '<button type="button" class="btn btn--primary btn--sm" data-action="more">Показать ещё идеи</button>' +
          '</div>'
        );
      }
      return (
        '<div class="idea-more">' +
        '<h3 class="idea-more__title">Это все идеи</h3>' +
        '<p class="idea-more__text">Измените повод или бюджет, чтобы получить новые.</p>' +
        '</div>'
      );
    }

    function renderAll(message) {
      const p = state.params;
      els.scope.className = 'lang--' + p.lang;
      els.meta.textContent = 'Ваши идеи · ' + OCCASIONS[p.occasion] + ' · ' + BUDGETS[p.budget];
      els.title.textContent = 'Если партнёр говорит на языке «' + LANG_NAMES[p.lang] + '» — попробуйте это';
      els.grid.innerHTML = state.ideas.map(cardHtml).join('') + moreHtml();
      els.note.textContent = message || '';
    }

    function renderSaved() {
      const items = state.saved.map((id) => IDEAS_BY_ID[id]).filter(Boolean);
      els.savedSection.hidden = items.length === 0;
      els.savedList.innerHTML = items
        .map(
          (idea) =>
            '<li class="saved-item">' +
            '<span class="chip lang--' + idea.lang + '">' + LANG_NAMES[idea.lang] + '</span>' +
            '<p class="saved-item__title">' + idea.title + '</p>' +
            '<p class="saved-item__text">' + idea.text + '</p>' +
            '<button type="button" class="link-btn" data-action="unsave" data-id="' + idea.id + '">Убрать из сохранённых</button>' +
            '</li>'
        )
        .join('');
    }

    function focusCard(index) {
      const card = els.grid.querySelector('.idea-card[data-index="' + index + '"]');
      if (card) card.focus({ preventScroll: false });
    }

    /* ----- Действия ----- */

    function generate(kind) {
      state.params = readParams();
      state.ideas = rank(poolFor(state.params), state.params.occasion).slice(0, 5);
      renderAll(kind === 'refresh' ? 'Подборка обновлена.' : '');
      if (kind === 'submit') goTo(els.result, els.title);
    }

    function addMore() {
      const fresh = unusedIdeas().slice(0, 3);
      if (!fresh.length) {
        els.note.textContent = 'Свободных идей для этих настроек больше нет. Измените повод или бюджет.';
        return;
      }
      const firstNew = state.ideas.length;
      state.ideas = state.ideas.concat(fresh);
      renderAll('Добавлено идей: ' + fresh.length + '.');
      focusCard(firstNew);
    }

    function replaceIdea(index) {
      const candidates = unusedIdeas();
      if (!candidates.length) {
        els.note.textContent = 'Свободных идей для этих настроек больше нет. Измените повод или бюджет.';
        return;
      }
      state.ideas[index] = candidates[0];
      renderAll('Идея заменена.');
      focusCard(index);
    }

    function toggleSave(id, button) {
      const pos = state.saved.indexOf(id);
      if (pos === -1) {
        state.saved.push(id);
      } else {
        state.saved.splice(pos, 1);
      }
      writeStore(STORAGE_SAVED, state.saved);
      button.setAttribute('aria-pressed', pos === -1 ? 'true' : 'false');
      renderSaved();
    }

    function unsave(id) {
      const pos = state.saved.indexOf(id);
      if (pos === -1) return;
      state.saved.splice(pos, 1);
      writeStore(STORAGE_SAVED, state.saved);

      const heart = els.grid.querySelector('[data-action="save"][data-id="' + id + '"]');
      if (heart) heart.setAttribute('aria-pressed', 'false');

      renderSaved();
      if (state.saved.length) {
        els.savedTitle.focus({ preventScroll: true });
      } else {
        els.refresh.focus({ preventScroll: true });
      }
    }

    /* ----- Результаты теста (если тест уже проходили) ----- */

    function renderFromTest() {
      const stored = readStore(STORAGE_RESULTS, null);
      if (!stored || !Array.isArray(stored.players) || !stored.players.length) return;

      const buttons = stored.players
        .filter((p) => p && Array.isArray(p.top) && LANG_NAMES[p.top[0]])
        .map(
          (p) =>
            '<button type="button" class="btn btn--ghost btn--sm" data-lang="' + p.top[0] + '">' +
            esc(String(p.name || 'Вы').slice(0, 30)) + ': ' + esc(quoted(p.top[0])) + '</button>'
        );

      if (!buttons.length) return;
      els.fromTestButtons.innerHTML = buttons.join('');
      els.fromTest.hidden = false;
    }

    /* ----- События ----- */

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      generate('submit');
    });

    els.refresh.addEventListener('click', () => generate('refresh'));

    els.grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button || !els.grid.contains(button)) return;
      const action = button.getAttribute('data-action');
      if (action === 'save') toggleSave(button.getAttribute('data-id'), button);
      if (action === 'replace') replaceIdea(Number(button.getAttribute('data-index')));
      if (action === 'more') addMore();
    });

    els.savedList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="unsave"]');
      if (button) unsave(button.getAttribute('data-id'));
    });

    els.fromTestButtons.addEventListener('click', (event) => {
      const button = event.target.closest('[data-lang]');
      if (!button) return;
      setParam('lang', button.getAttribute('data-lang'));
      generate('submit');
    });

    /* ----- Старт ----- */

    renderFromTest();
    renderSaved();

    let startLang = null;
    try {
      startLang = new URLSearchParams(window.location.search).get('lang');
    } catch (e) {
      startLang = null;
    }

    if (startLang && LANG_NAMES[startLang]) {
      setParam('lang', startLang);
      generate('submit');
    } else {
      generate('initial');
    }
  }

  /* ---------- Запуск ---------- */

  function init() {
    initReveal();
    initTest();
    initIdeas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
