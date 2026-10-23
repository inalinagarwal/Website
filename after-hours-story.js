window.AFTER_HOURS_STORY = {
  version: 1,
  start: 'arrival',
  areas: {
    intro: {
      title: 'The threshold',
      subtitle: 'An unreasonable hour. A reasonable amount of curiosity.',
      entry: 'arrival',
      portrait: 'critic'
    },
    desk: {
      title: 'The games desk',
      subtitle: 'One finished world. Several further complications.',
      entry: 'desk',
      portrait: 'maker'
    },
    manuscript: {
      title: 'The manuscript',
      subtitle: 'Please leave your reliable narrator at the door.',
      entry: 'manuscript',
      portrait: 'writer'
    },
    wall: {
      title: 'The design wall',
      subtitle: 'A substantial body of work held up by very small pins.',
      entry: 'wall',
      portrait: 'critic'
    },
    mirror: {
      title: 'The wall mirror',
      subtitle: 'Three inner voices. No appointed chair.',
      entry: 'mirror',
      portrait: 'critic'
    },
    door: {
      title: 'The open door',
      subtitle: 'Leaving is a perfectly respectable creative decision.',
      entry: 'door',
      portrait: 'writer'
    }
  },
  items: {
    games: {
      title: 'The games dossier',
      description: "A completed Godot platformer, oVerTime in development, and a planned 3D horror project. Evidence of a lifelong gamer building worlds of his own."
    },
    book: {
      title: 'The manuscript note',
      description: "Broke-Stalker: Nalin's psychological neo-noir thriller in progress. Obsession, desperation and moral collapse have all been pencilled in."
    },
    design: {
      title: 'The design dossier',
      description: 'Three years, more than 100 pieces, and work for clubs, societies and startups at DTU. Posters, logos and social graphics with people and teams behind them.'
    }
  },
  nodes: {
    arrival: {
      area: 'intro',
      title: 'The office is still awake.',
      subtitle: 'A visitor arrives. The hobbies convene.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'The studio is open at an hour usually reserved for software updates and questionable decisions.' },
        { speaker: 'THE OBSERVER', text: "You have entered Nalin's creative side. The robots are off duty. The hobbies have formed a small government." },
        { speaker: 'THE BUILDER', text: 'No appointment needed. Pick an object. Try to leave the scope where you found it.' }
      ],
      choices: [
        { id: 'arrival-desk', label: 'Examine the games desk.', to: 'desk' },
        { id: 'arrival-manuscript', label: 'Approach the manuscript.', to: 'manuscript' },
        { id: 'arrival-wall', label: 'Study the design wall.', to: 'wall' },
        { id: 'arrival-orientation', label: 'Ask how this place works.', to: 'orientation' }
      ]
    },
    orientation: {
      area: 'intro',
      title: 'A brief and optional orientation.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE ROOM', text: 'A games desk. A manuscript. A crowded design wall. A mirror that has developed opinions. A door with no opinion.' },
        { speaker: 'THE NARRATOR', text: 'Inspect what interests you. You can keep three small dossiers as souvenirs. No particular order is expected.' },
        { speaker: 'THE OBSERVER', text: 'Even a failed skill check leaves the next door open. An unusually humane filing system.' }
      ],
      choices: [
        { id: 'orientation-desk', label: 'Go to the games desk.', to: 'desk' },
        { id: 'orientation-manuscript', label: 'Read about the manuscript.', to: 'manuscript' },
        { id: 'orientation-wall', label: 'Browse the design wall.', to: 'wall' },
        { id: 'orientation-mirror', label: 'Find out who is doing the talking.', to: 'mirror' },
        { id: 'orientation-door', label: 'Check that the door works.', to: 'door' }
      ]
    },
    desk: {
      area: 'desk',
      title: 'Three worlds share a keyboard.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE ROOM', text: 'The desk holds a completed dungeon, an RPG in progress, and a horror corridor with very good intentions.' },
        { speaker: 'THE BUILDER', text: 'Three ways to make a world. One way to accumulate folders.' },
        { speaker: 'THE ROOM', text: 'Someone has sketched two platforms in the margin of a notebook. Your inner motor cortex would like to attempt the jump.' }
      ],
      choices: [
        { id: 'desk-sharpie', label: "Examine Sharpie's Dungeon Adventure.", to: 'sharpie' },
        { id: 'desk-overtime', label: 'Open the oVerTime notes.', to: 'overtime' },
        { id: 'desk-horror', label: 'Peer into the horror corridor.', to: 'horror' },
        { id: 'desk-jump', label: 'Attempt the tiny paper-platform jump.', check: { skill: 'Hand-eye coordination', dc: 8, modifier: 1, success: 'jump-success', failure: 'jump-fail' } },
        { id: 'desk-room', label: 'Look around the room again.', to: 'orientation' }
      ]
    },
    sharpie: {
      area: 'desk',
      title: "Sharpie's Dungeon Adventure",
      subtitle: 'Released in 2023. A complete solo project.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE ROOM', text: 'A complete 2D platformer built in Godot: dungeons to navigate, coins to collect and enemies to dodge.' },
        { speaker: 'THE BUILDER', text: 'Godot Engine, GDScript and pixel art. The project is fully playable, and the portfolio has a gameplay clip.' },
        { speaker: 'THE OBSERVER', text: 'A complete game. A rare and beautiful phrase. Say it quietly before another feature hears.' }
      ],
      choices: [
        { id: 'sharpie-inspect', label: 'Watch the actual gameplay.', inspect: 'sharpie' },
        { id: 'sharpie-collect', label: 'Keep the games dossier.', effect: { collect: 'games' }, to: 'desk' },
        { id: 'sharpie-overtime', label: 'See what came next: oVerTime.', to: 'overtime' },
        { id: 'sharpie-back', label: 'Return to the desk.', to: 'desk' }
      ]
    },
    'jump-success': {
      area: 'desk',
      title: 'The pencil figure lands.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE ROOM', text: 'You trace a neat arc between the doodled platforms. The little figure clears the gap.' },
        { speaker: 'THE BUILDER', text: 'Timing, trajectory, landing. Very satisfying. We should make a game about this.' },
        { speaker: 'THE OBSERVER', text: 'We did. It is directly beside your hand.' }
      ],
      choices: [
        { id: 'jump-success-sharpie', label: 'Examine the actual platformer.', to: 'sharpie' },
        { id: 'jump-success-inspect', label: 'Watch the gameplay clip.', inspect: 'sharpie' },
        { id: 'jump-success-back', label: 'Retire from paper athletics.', to: 'desk' }
      ]
    },
    'jump-fail': {
      area: 'desk',
      title: 'The margin proves unexpectedly deep.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'Your pencil figure misses the ledge and lands in a shopping list.' },
        { speaker: 'THE BUILDER', text: 'A useful test. We have established that the grocery section needs collision.' },
        { speaker: 'THE OBSERVER', text: 'Your dignity has respawned. The real game is still available.' }
      ],
      choices: [
        { id: 'jump-fail-retry', label: 'Try the paper jump again.', check: { skill: 'Hand-eye coordination', dc: 8, modifier: 1, success: 'jump-success', failure: 'jump-fail' } },
        { id: 'jump-fail-sharpie', label: 'Examine the actual platformer.', to: 'sharpie' },
        { id: 'jump-fail-back', label: 'Blame the pencil and return to the desk.', to: 'desk' }
      ]
    },
    overtime: {
      area: 'desk',
      title: 'oVerTime has plans.',
      subtitle: 'An action comedy 2D RPG in development.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE ROOM', text: 'An original story, deep skill trees, a varied enemy roster and an enthusiastic supply of weapons. oVerTime is still in development.' },
        { speaker: 'THE BUILDER', text: 'The project carries Metroidvania, permadeath and RPG tags. There is quite a lot of possibility in this notebook.' },
        { speaker: 'THE OBSERVER', text: 'Restraint has been invited to the planning meeting. Its attendance remains unconfirmed.' }
      ],
      choices: [
        { id: 'overtime-inspect', label: 'Read the project notes.', inspect: 'overtime' },
        { id: 'overtime-collect', label: 'Keep the games dossier.', effect: { collect: 'games' }, to: 'desk' },
        { id: 'overtime-horror', label: 'Investigate the project planned after this one.', to: 'horror' },
        { id: 'overtime-back', label: 'Return to the desk.', to: 'desk' }
      ]
    },
    horror: {
      area: 'desk',
      title: 'The corridor is doing its best.',
      subtitle: 'A 3D survival horror action project. Planned.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'A preview of a 3D survival horror action game, planned after the RPG. The direction is atmospheric, tense and deliberately designed.' },
        { speaker: 'THE BUILDER', text: 'For now, the corridor offers a look at the intended mood.' },
        { speaker: 'THE OBSERVER', text: 'It is doing the emotional work of an entire threatening building. Respect the initiative.' }
      ],
      choices: [
        { id: 'horror-inspect', label: 'Look at the corridor preview.', inspect: 'horror' },
        { id: 'horror-collect', label: 'Keep the games dossier.', effect: { collect: 'games' }, to: 'desk' },
        { id: 'horror-overtime', label: 'Return to the RPG notes.', to: 'overtime' },
        { id: 'horror-back', label: 'Leave the corridor to its brooding.', to: 'desk' }
      ]
    },
    manuscript: {
      area: 'manuscript',
      title: 'A draft under a lamp.',
      subtitle: 'Broke-Stalker. In progress.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE ROOM', text: 'The title is Broke-Stalker. It does not appear to be promising a relaxing weekend.' },
        { speaker: 'THE NARRATOR', text: "Nalin's psychological neo-noir thriller is in progress. Obsession, desperation and moral collapse have all made themselves comfortable." },
        { speaker: 'THE OBSERVER', text: 'The manuscript is unfinished. The atmosphere arrived early.' }
      ],
      choices: [
        { id: 'manuscript-premise', label: 'Read the premise and the reason for writing it.', to: 'premise' },
        { id: 'manuscript-read', label: 'Try reading between the lines.', check: { skill: 'Reading between lines', dc: 8, modifier: 1, success: 'read-success', failure: 'read-fail' } },
        { id: 'manuscript-inspect', label: 'Open the book dossier.', inspect: 'book' },
        { id: 'manuscript-collect', label: 'Keep the manuscript note.', effect: { collect: 'book' }, to: 'manuscript' },
        { id: 'manuscript-room', label: 'Look around the room again.', to: 'orientation' }
      ]
    },
    premise: {
      area: 'manuscript',
      title: 'The story he wanted to read.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE NARRATOR', text: 'The motivation was simple: wanting a particular kind of story, failing to find it, and deciding to write it.' },
        { speaker: 'THE ROOM', text: 'The brief is a psychological neo-noir thriller: obsession, desperation and moral collapse, with an unreliable, tense atmosphere.' },
        { speaker: 'THE OBSERVER', text: 'An excellent set of ingredients for fiction. A difficult set of references for a letting agent.' },
        { speaker: 'THE NARRATOR', text: 'It is original fiction, being developed alongside the game projects. The draft has company.' }
      ],
      choices: [
        { id: 'premise-inspect', label: 'View the book dossier.', inspect: 'book' },
        { id: 'premise-collect', label: 'Keep the manuscript note.', effect: { collect: 'book' }, to: 'manuscript' },
        { id: 'premise-read', label: 'Try reading between the lines.', check: { skill: 'Reading between lines', dc: 8, modifier: 1, success: 'read-success', failure: 'read-fail' } },
        { id: 'premise-back', label: 'Return to the lamp.', to: 'manuscript' }
      ]
    },
    'read-success': {
      area: 'manuscript',
      title: 'A useful question takes shape.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE ROOM', text: 'You resist the urge to solve a novel from its cover.' },
        { speaker: 'THE NARRATOR', text: 'Who is telling the story? What might they leave out? You have arrived at good questions for an unreliable tale.' },
        { speaker: 'THE OBSERVER', text: 'A reading strategy instead of a spoiler. We appear to be experiencing personal growth.' }
      ],
      choices: [
        { id: 'read-success-inspect', label: 'Read what is available about the book.', inspect: 'book' },
        { id: 'read-success-collect', label: 'Keep the manuscript note.', effect: { collect: 'book' }, to: 'manuscript' },
        { id: 'read-success-back', label: 'Let the draft keep its secrets.', to: 'manuscript' }
      ]
    },
    'read-fail': {
      area: 'manuscript',
      title: 'The hyphen looks suspicious.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'After careful consideration, you identify the hyphen as the prime suspect.' },
        { speaker: 'THE NARRATOR', text: 'The title declines to comment. You have learned little about the plot, but your confidence has remained beautifully intact.' },
        { speaker: 'THE OBSERVER', text: 'The book is still in progress. There is plenty of time for the punctuation to obtain legal advice.' }
      ],
      choices: [
        { id: 'read-fail-retry', label: 'Reconsider the case against punctuation.', check: { skill: 'Reading between lines', dc: 8, modifier: 1, success: 'read-success', failure: 'read-fail' } },
        { id: 'read-fail-inspect', label: 'Read the actual book dossier.', inspect: 'book' },
        { id: 'read-fail-collect', label: 'Keep the manuscript note anyway.', effect: { collect: 'book' }, to: 'manuscript' },
        { id: 'read-fail-back', label: 'Return to the lamp.', to: 'manuscript' }
      ]
    },
    wall: {
      area: 'wall',
      title: 'The wall has receipts.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'Posters, logos and social graphics crowd the wall, as though several committees discovered colour on the same afternoon.' },
        { speaker: 'THE OBSERVER', text: 'Three years of design work. More than 100 pieces for clubs, societies and startups at DTU.' },
        { speaker: 'THE BUILDER', text: 'The archive has event posters, logos and social media work. Pick a category. The wall enjoys being looked at.' }
      ],
      choices: [
        { id: 'wall-posters', label: 'Study the posters and event work.', to: 'posters' },
        { id: 'wall-logos', label: 'Look closely at the logos.', to: 'logos' },
        { id: 'wall-leadership', label: 'Ask who worked behind the scenes.', to: 'leadership' },
        { id: 'wall-collect', label: 'Keep the design dossier.', effect: { collect: 'design' }, to: 'wall' },
        { id: 'wall-room', label: 'Look around the room again.', to: 'orientation' }
      ]
    },
    posters: {
      area: 'wall',
      title: 'An event needs an audience.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'Robo Soccer, Quidditch and Stratazenith sit among the event designs. The wider archive also includes festival greetings and society announcements.' },
        { speaker: 'THE OBSERVER', text: 'Different events, different audiences. The task is to make someone stop scrolling long enough to understand what is happening.' },
        { speaker: 'THE NARRATOR', text: 'Somewhere, a committee is asking whether the date could be larger. For once, it has a point.' }
      ],
      choices: [
        { id: 'posters-inspect', label: 'Open the design archive.', inspect: 'design' },
        { id: 'posters-collect', label: 'Keep the design dossier.', effect: { collect: 'design' }, to: 'wall' },
        { id: 'posters-logos', label: 'Move along to the logos.', to: 'logos' },
        { id: 'posters-back', label: 'Step back from the wall.', to: 'wall' }
      ]
    },
    logos: {
      area: 'wall',
      title: 'A small mark with a large job.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'Celestial Flare, Cosmos, The Growth Hackers, HEIV and SkilLearn. The names change. The logo still has to survive being made very small.' },
        { speaker: 'THE OBSERVER', text: 'A little composition, a little recognition, and the quiet hope that the final file is actually final.' },
        { speaker: 'THE BUILDER', text: 'The Observer appreciates restraint. It would like that appreciation set in a slightly smaller typeface.' }
      ],
      choices: [
        { id: 'logos-inspect', label: 'Browse the design archive.', inspect: 'design' },
        { id: 'logos-collect', label: 'Keep the design dossier.', effect: { collect: 'design' }, to: 'wall' },
        { id: 'logos-leadership', label: 'Ask about the design teams.', to: 'leadership' },
        { id: 'logos-back', label: 'Step back from the wall.', to: 'wall' }
      ]
    },
    leadership: {
      area: 'wall',
      title: 'The work came with people.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE ROOM', text: 'Ambassador of Design at HEIV. Design Head at the Indian Game Theory Society, Society of Robotics at DTU, and DEPTH, the Engineering Physics Society.' },
        { speaker: 'THE BUILDER', text: 'Those roles involved leading designers and producing print and digital work: brochures, advertisements, websites and social graphics.' },
        { speaker: 'THE ROOM', text: 'Edumonics appears in the notebook too: content research, blogposts, landing pages and SEO, June to October 2021.' },
        { speaker: 'THE OBSERVER', text: 'Coordination. The mysterious art of getting several perfectly sensible people to agree on a shade of orange.' }
      ],
      choices: [
        { id: 'leadership-inspect', label: 'Read about the roles and communication work.', inspect: 'leadership' },
        { id: 'leadership-mirror', label: 'Consult the voices in the mirror.', to: 'mirror' },
        { id: 'leadership-back', label: 'Return to the design wall.', to: 'wall' }
      ]
    },
    mirror: {
      area: 'mirror',
      title: 'An unscheduled internal meeting.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE ROOM', text: 'The mirror at the upper left offers a reflection. Three inner voices hold a meeting without booking a room.' },
        { speaker: 'THE OBSERVER', text: 'You have heard us already. We would now like individual credit for the interruptions.' }
      ],
      choices: [
        { id: 'mirror-maker', label: 'Hear out the Builder.', to: 'maker-voice' },
        { id: 'mirror-writer', label: 'Give the Narrator a moment.', to: 'writer-voice' },
        { id: 'mirror-critic', label: 'Ask the Observer for an opinion.', to: 'critic-voice' },
        { id: 'mirror-room', label: 'Leave the meeting before it acquires minutes.', to: 'orientation' }
      ]
    },
    'maker-voice': {
      area: 'mirror',
      title: 'The Builder has an idea.',
      portrait: 'maker',
      lines: [
        { speaker: 'THE BUILDER', text: 'Give me a rule, a tool and something that needs to move. I will eventually turn it into a project.' },
        { speaker: 'THE OBSERVER', text: 'Eventually is carrying a substantial amount of furniture in that sentence.' }
      ],
      choices: [
        { id: 'maker-voice-back', label: 'Return to the voices.', to: 'mirror' },
        { id: 'maker-voice-desk', label: 'Visit the games desk.', to: 'desk' }
      ]
    },
    'writer-voice': {
      area: 'mirror',
      title: 'The Narrator chooses a sentence.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE NARRATOR', text: 'A story is a machine for making someone care about a problem you invented.' },
        { speaker: 'THE OBSERVER', text: 'And staring at that sentence for twenty minutes is apparently maintenance.' }
      ],
      choices: [
        { id: 'writer-voice-back', label: 'Return to the voices.', to: 'mirror' },
        { id: 'writer-voice-manuscript', label: 'Visit the manuscript.', to: 'manuscript' }
      ]
    },
    'critic-voice': {
      area: 'mirror',
      title: 'The Observer notices something.',
      portrait: 'critic',
      lines: [
        { speaker: 'THE OBSERVER', text: 'I notice composition, colour and the small misalignment everyone was hoping would go away.' },
        { speaker: 'THE BUILDER', text: 'Will pointing at it help?' },
        { speaker: 'THE OBSERVER', text: 'It will help me.' }
      ],
      choices: [
        { id: 'critic-voice-back', label: 'Return to the voices.', to: 'mirror' },
        { id: 'critic-voice-wall', label: 'Visit the design wall.', to: 'wall' }
      ]
    },
    door: {
      area: 'door',
      title: 'The exit remains an option.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE ROOM', text: 'The door has remained available throughout. A refreshingly modest approach to engagement.' },
        { speaker: 'THE NARRATOR', text: 'You can leave, keep exploring, or contact Nalin about games, writing and design.' },
        { speaker: 'THE OBSERVER', text: 'There is no final boss. Nobody scheduled one.' }
      ],
      choices: [
        { id: 'door-contact', label: 'Find the contact details.', inspect: 'contact' },
        { id: 'door-closing', label: 'Close the notebook for now.', to: 'closing' },
        { id: 'door-room', label: 'Actually, have another look around.', to: 'orientation' }
      ]
    },
    closing: {
      area: 'door',
      title: 'A sensible place to pause.',
      subtitle: 'The office will survive your departure.',
      portrait: 'writer',
      lines: [
        { speaker: 'THE ROOM', text: 'You close the notebook. The studio remains full of work in different stages: a finished game, projects underway, another planned, and a wall that remembers the rest.' },
        { speaker: 'THE NARRATOR', text: 'A portfolio is a collection of decisions. This one also has a corridor.' },
        { speaker: 'THE OBSERVER', text: 'Thank you for looking. We will now return to discussing whether the lamp needs a skill tree.' }
      ],
      choices: [
        { id: 'closing-return', label: 'Reopen the notebook and keep exploring.', to: 'orientation' },
        { id: 'closing-contact', label: 'Find Nalin for a new conversation.', inspect: 'contact' },
        { id: 'closing-arrival', label: 'Visit the threshold again.', to: 'arrival' }
      ]
    }
  }
};
