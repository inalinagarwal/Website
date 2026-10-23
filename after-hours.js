(() => {
  'use strict';
  const story = window.AFTER_HOURS_STORY;
  if (!story?.nodes) return;
  const $ = id => document.getElementById(id);
  const storageKey = 'nalin-after-hours-v1';
  const audio = window.AFTER_HOURS_AUDIO;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const nodeIds = new Set(Object.keys(story.nodes));
  const areaIds = new Set(Object.keys(story.areas));
  const itemIds = new Set(Object.keys(story.items));
  const itemInspect = { games: 'sharpie', book: 'book', design: 'design' };
  const voiceNodes = { maker: 'maker-voice', writer: 'writer-voice', critic: 'critic-voice' };
  const areaNotes = { desk: 'Three games. An aggressively non-empty to-do list.', manuscript: 'Original fiction. The atmosphere has already moved in.', wall: 'Every brief leaves evidence. Some of it is very colourful.', mirror: 'Your inner committee is now in session.', door: 'An exit. Even this portfolio believes in boundaries.', intro: 'Click an object. Your curiosity has the keys.' };
  let state = loadState();
  let activeTyping = null;
  let typingVersion = 0;
  let currentChoices = [];
  let rolling = false;
  let rollVersion = 0;
  let toastTimer;
  const dialogReturnFocus = new WeakMap();
  let galleryCategory = 'posters';
  let galleryReturn = false;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function freshState() { return { started: false, node: story.start, visited: [], items: [], history: [] }; }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !nodeIds.has(saved.node)) return freshState();
      return {
        started: !!saved.started, node: saved.node,
        visited: [...new Set((saved.visited || []).filter(id => areaIds.has(id)))],
        items: [...new Set((saved.items || []).filter(id => itemIds.has(id)))],
        history: Array.isArray(saved.history) ? saved.history.filter(record => record && (
          (record.kind === 'node' && nodeIds.has(record.id)) ||
          (record.kind === 'you' && typeof record.text === 'string') ||
          (record.kind === 'system' && typeof record.text === 'string')
        )).slice(-100) : []
      };
    } catch { return freshState(); }
  }
  function save() {
    state.history = state.history.slice(-100);
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Play remains available without storage. */ }
  }
  function record(entry) { state.history.push(entry); save(); }
  function notify(text) {
    clearTimeout(toastTimer);
    $('toast').textContent = text;
    $('toast').classList.add('show');
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3300);
  }
  function scrollLog() { $('dialogueScroll').scrollTop = $('dialogueScroll').scrollHeight; }
  function toneFor(speaker) {
    if (/BUILDER/.test(speaker)) return 'maker';
    if (/NARRATOR/.test(speaker)) return 'writer';
    if (/OBSERVER|CRITIC/.test(speaker)) return 'critic';
    return '';
  }
  function addLine(speaker, text, tone = '', animate = false) {
    const row = make('div', `dialogue-line ${tone}`);
    row.append(make('span', 'speaker', speaker));
    const paragraph = make('p');
    const visual = make('span', animate ? 'typing-caret' : '', animate ? '' : text);
    if (animate) {
      visual.setAttribute('aria-hidden', 'true');
      paragraph.append(make('span', 'sr-only', text));
    }
    paragraph.append(visual);
    row.append(paragraph);
    $('dialogueLog').append(row);
    return { row, visual, text };
  }
  function systemLine(text, persist = true) {
    addLine('CASE NOTES', text, 'system');
    if (persist) record({ kind: 'system', text });
    scrollLog();
  }
  function divider(node) {
    $('dialogueLog').append(make('div', 'dialogue-divider', story.areas[node.area]?.title || 'The room'));
  }
  function completeTyping() {
    if (!activeTyping) return;
    typingVersion++;
    activeTyping.rows.forEach(({ row, visual, text }) => {
      row.hidden = false;
      visual.textContent = text;
      visual.classList.remove('typing-caret');
    });
    const node = activeTyping.node;
    activeTyping = null;
    $('skipText').hidden = true;
    renderChoices(node);
    scrollLog();
  }
  async function speakNode(node, animate) {
    divider(node);
    if (!animate || reducedMotion.matches) {
      node.lines.forEach(line => addLine(line.speaker, line.text, toneFor(line.speaker)));
      renderChoices(node); scrollLog(); return;
    }
    const token = ++typingVersion;
    const rows = node.lines.map(line => {
      const row = addLine(line.speaker, line.text, toneFor(line.speaker), true);
      row.row.hidden = true;
      return row;
    });
    activeTyping = { rows, node };
    currentChoices = [];
    $('dialogueChoices').replaceChildren(make('p', 'empty-choices', 'Your inner committee has the floor...'));
    $('skipText').hidden = false;
    for (const { row, visual, text } of rows) {
      if (token !== typingVersion) return;
      row.hidden = false;
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        if (token !== typingVersion) return;
        visual.textContent = words.slice(0, i + 3).join(' ');
        if (i % 9 === 0) audio?.play('type');
        scrollLog();
        await new Promise(resolve => setTimeout(resolve, 32));
      }
      visual.textContent = text;
      visual.classList.remove('typing-caret');
      await new Promise(resolve => setTimeout(resolve, 140));
    }
    if (token !== typingVersion) return;
    activeTyping = null;
    $('skipText').hidden = true;
    renderChoices(node); scrollLog();
  }
  function renderChoices(node) {
    currentChoices = node.choices;
    const fragment = document.createDocumentFragment();
    node.choices.forEach((choice, index) => {
      const button = make('button', 'dialogue-choice');
      button.type = 'button'; button.dataset.choice = choice.id;
      button.append(make('span', 'choice-num', `${index + 1}.`));
      const copy = make('span', 'choice-copy', choice.label);
      if (choice.check) {
        const c = choice.check;
        copy.append(make('small', '', `${c.skill.toUpperCase()} · 2d6 + ${c.modifier} · target ${c.dc} · no content locked`));
      } else if (choice.effect?.collect && state.items.includes(choice.effect.collect)) {
        copy.append(make('small', '', 'Already in your case notes. Excessive filing is optional.'));
      }
      button.append(copy);
      button.addEventListener('click', () => choose(choice));
      fragment.append(button);
    });
    $('dialogueChoices').replaceChildren(fragment);
  }
  function updateWorld(node) {
    const area = node.area;
    $('conversationTitle').textContent = node.title;
    $('sceneNote').replaceChildren(make('span', '', '◇'), document.createTextNode(` ${areaNotes[area] || areaNotes.intro}`));
    document.querySelectorAll('[data-area]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.area === area);
      button.classList.toggle('is-visited', state.visited.includes(button.dataset.area));
    });
    document.querySelectorAll('.voice-card').forEach(button => button.classList.toggle('active-voice', button.dataset.voice === node.portrait));
    const hotspot = document.querySelector(`.hotspot[data-area="${area}"]`);
    if (hotspot) {
      const styles = getComputedStyle(hotspot);
      $('investigatorMarker').style.setProperty('--x', styles.getPropertyValue('--x'));
      const top = parseFloat(styles.getPropertyValue('--y'));
      $('investigatorMarker').style.setProperty('--y', `${Math.min(88, top + 12)}%`);
    } else {
      $('investigatorMarker').style.setProperty('--x', '49%');
      $('investigatorMarker').style.setProperty('--y', '83%');
    }
    $('dossierCount').textContent = `${state.items.length} / 3`;
    $('caseState').textContent = node === story.nodes.closing ? 'INVESTIGATION PAUSED' : state.items.length === 3 ? 'CASE NOTES COMPLETE' : 'INVESTIGATION OPEN';
    $('footerFlavour').textContent = state.items.length === 3 ? 'THREE DOSSIERS. SEVERAL HOBBIES. NO ACTUAL CRIME.' : 'OBJECTIVE: FIND OUT WHAT THIS MAN DOES AFTER WORK.';
  }
  function goTo(id, { animate = true, persist = true } = {}) {
    if (!nodeIds.has(id)) return;
    completeTyping();
    rollVersion++; rolling = false;
    const node = story.nodes[id]; state.node = id;
    if (node.area !== 'intro' && !state.visited.includes(node.area)) state.visited.push(node.area);
    if (persist) record({ kind: 'node', id });
    updateWorld(node); speakNode(node, animate);
  }
  function collect(id) {
    if (!itemIds.has(id) || state.items.includes(id)) return;
    state.items.push(id); save(); audio?.play('collect');
    notify(`DOSSIER FILED: ${story.items[id].title}`);
    systemLine(`${story.items[id].title} added to your case notes. ${state.items.length} of 3 found.`);
  }
  function d6() {
    if (window.crypto?.getRandomValues) {
      const number = new Uint32Array(1); crypto.getRandomValues(number); return number[0] % 6 + 1;
    }
    return Math.floor(Math.random() * 6) + 1;
  }
  async function choose(choice) {
    if (rolling) return;
    completeTyping(); audio?.play('choose');
    addLine('YOU', choice.label, 'you'); record({ kind: 'you', text: choice.label });
    if (choice.effect?.collect) collect(choice.effect.collect);
    if (choice.check) {
      rolling = true;
      const token = ++rollVersion;
      const check = choice.check; const dice = [d6(), d6()];
      const total = dice[0] + dice[1] + check.modifier;
      const passed = total >= check.dc;
      currentChoices = [];
      $('dialogueChoices').replaceChildren(make('p', 'empty-choices', 'The dice are consulting their legal department...'));
      audio?.play('roll'); scrollLog();
      await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 850));
      if (token !== rollVersion) return;
      const text = `${check.skill.toUpperCase()}: ${dice[0]} + ${dice[1]} + ${check.modifier} = ${total}. Target ${check.dc}. ${passed ? 'SUCCESS. Act natural.' : 'FAILURE. The story continues anyway.'}`;
      systemLine(text); audio?.play(passed ? 'success' : 'failure');
      rolling = false; goTo(passed ? check.success : check.failure); return;
    }
    if (choice.inspect) openEvidence(choice.inspect);
    if (choice.to) goTo(choice.to);
    else updateWorld(story.nodes[state.node]);
  }
  function visitArea(area) {
    if (!areaIds.has(area) || !state.started) return;
    audio?.play('step'); goTo(story.areas[area].entry);
    if (matchMedia('(max-width: 950px)').matches) $('conversation').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
  function restoreLog() {
    $('dialogueLog').replaceChildren();
    state.history.forEach(entry => {
      if (entry.kind === 'node') {
        const node = story.nodes[entry.id]; divider(node);
        node.lines.forEach(line => addLine(line.speaker, line.text, toneFor(line.speaker)));
      } else addLine(entry.kind === 'you' ? 'YOU' : 'CASE NOTES', entry.text, entry.kind);
    });
    updateWorld(story.nodes[state.node]); renderChoices(story.nodes[state.node]); scrollLog();
  }
  function showDialog(dialog) {
    if (dialog.open) return;
    dialogReturnFocus.set(dialog, document.activeElement);
    dialog.showModal(); audio?.play('page');
  }
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  document.querySelectorAll('dialog:not(#entryDialog)').forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => {
      dialog.querySelectorAll('video').forEach(video => video.pause());
      const returnFocus = dialogReturnFocus.get(dialog);
      if (!document.querySelector('dialog[open]') && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  });

  // Actual project information remains separate from the fictional dialogue.
  const evidence = {
    sharpie: { title: "Sharpie's Dungeon Adventure", meta: 'RELEASED · 2023 · SOLO PROJECT', body: ['A complete 2D platformer built in Godot Engine. Navigate dungeons, collect coins and dodge enemies.', 'The clip below shows the actual game.'], tags: ['Godot Engine', 'GDScript', '2D platformer', 'Pixel art'], video: 'media/mariox-2-2.mov', section: 'games' },
    overtime: { title: 'oVerTime', meta: 'IN DEVELOPMENT · ORIGINAL ACTION COMEDY 2D RPG', body: ['An original action comedy 2D RPG with a handcrafted story, deep skill trees, a diverse enemy roster and an enthusiastic supply of weapons.', 'Still in development. The project combines Metroidvania, permadeath and RPG ideas.'], tags: ['Metroidvania', 'Permadeath', 'RPG', 'Original story'], section: 'games' },
    horror: { title: '3D Survival Horror Action', meta: 'PLANNED · AFTER THE RPG', body: ['An atmospheric, tense 3D survival horror action project planned after oVerTime.', 'This corridor is an existing portfolio preview of the intended mood, not a finished game.'], image: 'media/horror_corridor.png', imageAlt: 'Corridor preview for the planned 3D survival horror project', tags: ['3D', 'Survival horror', 'Action'], section: 'games' },
    book: { title: 'Broke-Stalker', meta: 'ORIGINAL FICTION · IN PROGRESS', body: ['A psychological neo-noir thriller at the intersection of obsession, desperation and moral collapse. Unreliable, tense and relentlessly stylish.', '“The kind of story I wanted to read and couldn’t find, so I decided to write it myself.”', 'In active development alongside the game projects. There is no published book or playable extract hidden behind a successful dice roll.'], tags: ['Neo-noir', 'Psychological thriller', 'Original fiction', 'In progress'], section: 'book' },
    design: { title: 'The Design Archive', meta: '3 YEARS · 100+ PIECES · DTU', body: ['Posters, logos and social graphics created for clubs, societies and startups. The full 23-piece selection from the regular portfolio is here.'], section: 'design' },
    leadership: { title: 'The people behind the posters', meta: 'DESIGN LEADERSHIP & COMMUNICATION', body: ['Leading design teams and taking work from brief to delivery: brochures, advertisements, websites and social graphics.', 'Content Researcher at Edumonics, June to October 2021. Research, corrections, blogposts, landing pages, digital marketing and SEO.'], section: 'design' },
    contact: { title: 'Start a less imaginary conversation.', meta: 'COLLABORATIONS / GAMES / WRITING / DESIGN', body: ['Game collaborations, beta reading Broke-Stalker, design commissions, or just talking games and stories.', 'You have survived the committee. Nalin is considerably easier to talk to.'], section: 'creative-contact' }
  };
  const galleries = {
    posters: [['robo_soccer.png','Robo Soccer · 2023'],['quidditch.png','Quidditch · 2023'],['independence_day.png','Independence Day · 2021'],['stratazenith.png','Stratazenith · 2022'],['quidditch2.png','Quidditch Drone Race'],['republic_day.png','Republic Day · 2022'],['codelocks.png','Code Locks 2.0'],['stratocalypse.png','Stratocalypse'],['igts_orientation.png','IGTS Orientation 2022']],
    logos: [['celestial_flare.png','Celestial Flare'],['cosmos_logo.png','Cosmos · TMC'],['tgh_logo.png','The Growth Hackers'],['heiv_logo.jpg','HEIV'],['skillearn.png','SkilLearn'],['igts_design_head.png','IGTS · Design Head']],
    social: [['diwali.png','Happy Diwali · SR-DTU'],['janmashtami.png','Janmashtami · SR-DTU'],['muharram.png','Muharram · SR-DTU'],['eid_milad.png','Eid Milad-un-Nabi · IGTS'],['igts_congrats.png','IGTS Congratulations'],['au_revoir.png','Au Revoir · IGTS'],['igts_recruiting.png','IGTS Recruiting 2022'],['heiv_orientation.png','HEIV Orientation']]
  };
  function link(label, href, external = false) {
    const a = make('a', '', label); a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function galleryView(container) {
    const filters = make('div', 'gallery-filter'); filters.setAttribute('aria-label', 'Design categories');
    const grid = make('div', 'evidence-gallery');
    const names = { posters: 'Posters & events', logos: 'Logos', social: 'Social media' };
    function render(category) {
      galleryCategory = category; grid.replaceChildren();
      filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
      galleries[category].forEach(([src, caption]) => {
        const button = make('button'); button.type = 'button'; button.setAttribute('aria-label', `View ${caption}`);
        const img = make('img'); img.src = `media/${src}`; img.alt = caption; img.loading = 'lazy';
        button.append(img, make('span', '', caption));
        button.addEventListener('click', () => openArtwork(src, caption)); grid.append(button);
      });
    }
    Object.entries(names).forEach(([id, name]) => {
      const button = make('button', '', name); button.type = 'button'; button.dataset.category = id;
      button.addEventListener('click', () => { audio?.play('page'); render(id); }); filters.append(button);
    });
    container.append(filters, grid); render(galleryCategory);
  }
  function openArtwork(src, caption) {
    galleryReturn = true;
    const content = $('evidenceContent'); content.replaceChildren();
    const back = make('button', 'text-button', '← Back to the design archive'); back.type = 'button';
    back.addEventListener('click', () => { openEvidence('design'); $('evidenceDialog').scrollTop = 0; });
    const title = make('h2', '', caption); title.id = 'evidenceTitle';
    const img = make('img', 'gallery-large'); img.src = `media/${src}`; img.alt = caption;
    content.append(back, title, img, make('p', 'gallery-caption', 'Original design work by Nalin Agarwal.'));
    audio?.play('page'); $('evidenceDialog').scrollTop = 0;
  }
  function openEvidence(id) {
    const data = evidence[id]; if (!data) return;
    const content = $('evidenceContent'); content.replaceChildren();
    const title = make('h2', '', data.title); title.id = 'evidenceTitle';
    content.append(make('p', 'evidence-meta', data.meta), title);
    if (id === 'book') {
      const book = make('div', 'evidence-book', 'BROKE'); book.setAttribute('aria-hidden', 'true');
      book.append(make('span', '', 'STALKER'), make('small', '', 'NALIN AGARWAL')); content.append(book);
    }
    data.body.forEach(text => content.append(make('p', '', text)));
    if (data.tags) { const tags = make('div', 'evidence-tags'); data.tags.forEach(tag => tags.append(make('span', '', tag))); content.append(tags); }
    if (data.video) {
      const video = make('video'); video.src = data.video; video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('aria-label', "Sharpie's Dungeon Adventure gameplay"); content.append(video);
    }
    if (data.image) { const img = make('img', 'evidence-image'); img.src = data.image; img.alt = data.imageAlt; content.append(img); }
    if (id === 'design') galleryView(content);
    if (id === 'leadership') {
      const list = make('div', 'leadership-list');
      [['Ambassador of Design','HEIV','The scientific community'],['Design Head','The Indian Game Theory Society',''],['Design Head','Society of Robotics','Delhi Technological University'],['Design Head','DEPTH','Engineering Physics Society']].forEach(([role,name,desc]) => {
        const card = make('article'); card.append(make('small', '', role), make('h3', '', name)); if (desc) card.append(make('p', '', desc)); list.append(card);
      }); content.append(list);
    }
    const links = make('div', 'evidence-links');
    links.append(link('View in the regular portfolio ↗', `creative.html#${data.section}`, true));
    if (id === 'leadership') links.append(link('Edumonics certificate ↗','https://drive.google.com/file/d/1Ap6JsYpfPpeuRlRDh8S_PMpIgSBMCOGf/view?usp=sharing',true));
    if (id === 'contact') {
      links.append(link('Email Nalin ↗', 'mailto:nalinagarwal2002@gmail.com'), link('LinkedIn ↗','https://www.linkedin.com/in/nalin-agarwal-b20495203/',true), link('GitHub ↗','https://github.com/inalinagarwal',true), link('Resume ↗','resume.pdf',true));
    }
    content.append(links);
    showDialog($('evidenceDialog'));
    if (galleryReturn) { $('evidenceDialog').scrollTop = 0; galleryReturn = false; }
  }
  function openNotes() {
    completeTyping(); const list = $('notesList'); list.replaceChildren();
    Object.entries(story.items).forEach(([id, item]) => {
      const found = state.items.includes(id); const card = make('article', `note-item${found ? '' : ' missing'}`);
      card.append(make('h3', '', found ? `✓ ${item.title}` : `? ${item.title}`));
      card.append(make('p', '', found ? item.description : ({ games:'Look for the games desk. A finished project is remarkably good evidence.', book:'The manuscript would like a reader. A reliable narrator has not been promised.', design:'The wall has more than enough exhibits for a case.' })[id]));
      const button = make('button', '', found ? 'Open dossier ↗' : 'Investigate this lead →'); button.type = 'button';
      button.addEventListener('click', () => {
        $('notesDialog').close();
        if (found) openEvidence(itemInspect[id]); else visitArea(({ games:'desk', book:'manuscript', design:'wall' })[id]);
      }); card.append(button); list.append(card);
    });
    $('visitedCount').textContent = `${state.visited.length} / 5 places investigated`;
    showDialog($('notesDialog'));
  }

  async function start(withSound) {
    $('entryDialog').close();
    if (withSound) await audio?.enable(); else audio?.disable();
    updateSound();
    if (!state.started || !state.history.length) {
      state.started = true; goTo(story.start);
    } else { restoreLog(); notify('Investigation resumed. Your committee has kept its opinions.'); }
    save();
  }
  function updateSound() {
    const enabled = !!audio?.enabled;
    $('soundToggle').setAttribute('aria-pressed', String(enabled));
    $('soundLabel').textContent = enabled ? 'Sound on' : 'Sound off';
    $('soundToggle').title = enabled ? 'Mute sound effects and ambience' : 'Enable sound effects and ambience';
  }
  window.addEventListener('pageshow', updateSound);
  $('startButton').addEventListener('click', () => start(true));
  $('quietStartButton').addEventListener('click', () => start(false));
  $('entryDialog').addEventListener('cancel', event => event.preventDefault());
  $('soundToggle').addEventListener('click', async () => {
    if (audio?.enabled) audio.disable(); else { const enabled = await audio?.enable(); if (!enabled) notify('Sound is unavailable in this browser. The committee will use its indoor voice.'); }
    updateSound();
  });
  $('skipText').addEventListener('click', completeTyping);
  $('journalButton').addEventListener('click', openNotes);
  $('dossierButton').addEventListener('click', openNotes);
  $('creditsButton').addEventListener('click', () => showDialog($('creditsDialog')));
  $('restartButton').addEventListener('click', () => showDialog($('resetDialog')));
  $('confirmRestart').addEventListener('click', () => {
    completeTyping(); rollVersion++; rolling = false; state = freshState(); state.started = true;
    $('resetDialog').close(); $('dialogueLog').replaceChildren(); save(); goTo(story.start);
    notify('Fresh investigation. Same deeply unnecessary committee.');
  });
  document.querySelectorAll('[data-area]').forEach(button => button.addEventListener('click', () => visitArea(button.dataset.area)));
  document.querySelectorAll('[data-voice]').forEach(button => button.addEventListener('click', () => {
    audio?.play('choose'); goTo(voiceNodes[button.dataset.voice]);
    if (matchMedia('(max-width: 950px)').matches) $('conversation').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }));
  $('showHotspots').addEventListener('click', () => {
    const hidden = $('sceneViewport').classList.toggle('labels-hidden');
    $('showHotspots').setAttribute('aria-pressed', String(!hidden)); audio?.play('choose');
  });
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'mouse' && event.target.closest('button, a') && !event.target.closest('button, a')?.contains(event.relatedTarget)) audio?.play('hover');
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (event.code === 'Space' && activeTyping) { event.preventDefault(); completeTyping(); return; }
    const number = Number(event.key);
    if (!activeTyping && !rolling && number >= 1 && number <= currentChoices.length) { event.preventDefault(); choose(currentChoices[number - 1]); }
  });
  function fitScene() {
    const view = $('sceneViewport'); const image = $('roomArt'); const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1800 / 1405;
    const width = Math.min(view.clientWidth, view.clientHeight * ratio);
    $('sceneArt').style.width = `${Math.max(1, width)}px`;
    $('sceneArt').style.aspectRatio = String(ratio);
  }
  new ResizeObserver(fitScene).observe($('sceneViewport'));
  $('roomArt').addEventListener('load', fitScene); fitScene();
  $('roomArt').addEventListener('error', () => notify('The room painting is missing. All dialogue and location buttons still work.'));
  if (state.started) {
    $('startButton').firstChild.textContent = 'Continue the investigation ';
    $('quietStartButton').textContent = 'Continue quietly';
  }
  updateWorld(story.nodes[state.node]);
  $('entryDialog').showModal();

  // Museum attribution entries are filled with the verified local asset metadata.
  function renderCredits(entries) {
    const container = $('artCredits'); container.replaceChildren();
    entries.forEach(entry => {
      const card = make('article'); card.append(make('h3', '', entry.title));
      card.append(make('p', '', `${entry.artist}${entry.date ? `, ${entry.date}` : ''}. ${entry.collection}.`));
      if (entry.creditLine) card.append(make('p', '', entry.creditLine));
      card.append(make('p', '', `${entry.usage}. ${entry.rights}.`));
      const p = make('p'); p.append(link('Artwork source ↗', entry.source, true));
      if (entry.museumSource) p.append(document.createTextNode(' · '), link('Museum record ↗', entry.museumSource, true));
      if (entry.license) p.append(document.createTextNode(' · '), link('Rights & license ↗', entry.license, true));
      card.append(p); container.append(card);
    });
  }
  renderCredits(window.AFTER_HOURS_ART_CREDITS || []);
})();
