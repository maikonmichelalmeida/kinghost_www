const EXERCISES = [
  {
    "id": 1,
    "name": "Sustained Hiss",
    "short": "Sustained Hiss",
    "type": "Respiração",
    "objective": "Desenvolver suporte respiratório e pressão de ar consistentes.",
    "notes": "qualquer",
    "variation": "—",
    "image": null,
    "audio": "sample_vocal/Sustained Hiss.mp3",
    "lesson": "htm/Sustained Hiss.htm"
  },
  {
    "id": 2,
    "name": "Staccato Puffs",
    "short": "Staccato Puffs",
    "type": "Respiração",
    "objective": "Desenvolver suporte respiratório em rajadas curtas e controladas.",
    "notes": "qualquer",
    "variation": "—",
    "image": null,
    "audio": "sample_vocal/Staccato Puffs.mp3",
    "lesson": "htm/Staccato Puffs.htm"
  },
  {
    "id": 3,
    "name": "Deep Hoo",
    "short": "Deep Hoo",
    "type": "Respiração",
    "objective": "Internalizar uma vocalização confortável com garganta livre.",
    "notes": "qualquer",
    "variation": "—",
    "image": null,
    "audio": "sample_vocal/Deep Hoo.mp3",
    "lesson": "htm/Deep Hoo.htm"
  },
  {
    "id": 4,
    "name": "Descending Nya",
    "short": "Descending Nya",
    "type": "Tom",
    "objective": "Manter emissão livre em padrão descendente.",
    "notes": "E3 D3 C#3 B2 A2",
    "variation": "E3 -1 -0.5 -1 -1",
    "image": "tablaturas/Descending Nya.png",
    "audio": "sample_vocal/Descending Nya.mp3",
    "lesson": "htm/Descending Nya.htm"
  },
  {
    "id": 5,
    "name": "Mum Motif",
    "short": "Mum Motif",
    "type": "Tom",
    "objective": "Coordenar ressonância, mandíbula e mudança de alturas.",
    "notes": "A2 B2 C#3 B2 A2 E3 C#3 B2 A2",
    "variation": "A2 +1 +1 -1 -1 +3.5 -1.5 -1 -1",
    "image": "tablaturas/Mum Motif.png",
    "audio": "sample_vocal/Mum Motif.mp3",
    "lesson": "htm/Mum Motif.htm"
  },
  {
    "id": 6,
    "name": "Nyum Scale",
    "short": "Nyum Scale",
    "type": "Tom",
    "objective": "Relaxar mandíbula e estabilizar a emissão na escala.",
    "notes": "A2 B2 C#3 D3 E3 D3 C#3 B2 A2",
    "variation": "A2 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Nyum Scale.png",
    "audio": "sample_vocal/Nyum Scale.mp3",
    "lesson": "htm/Nyum Scale.htm"
  },
  {
    "id": 7,
    "name": "Hmm Mah Arpeggio",
    "short": "Hmm Mah Arpeggio",
    "type": "Tom",
    "objective": "Transferir a sensação de ressonância do “Hmm” para o “Mah”.",
    "notes": "A2 C#3 E3 A3 E3 C#3 A2 E3 C#3 A3 E3 C#3 A2",
    "variation": "A2 +2 +1.5 +2.5 -2.5 -1.5 -2 +3.5 -1.5 +4 -2.5 -1.5 -2",
    "image": "tablaturas/Hmm Mah Arpeggio.png",
    "audio": "sample_vocal/Hmm Mah Arpeggio.mp3",
    "lesson": "htm/Hmm Mah Arpeggio.htm"
  },
  {
    "id": 8,
    "name": "Doo Hoo Motif",
    "short": "Doo Hoo Motif",
    "type": "Tom",
    "objective": "Coordenar ataque, fluxo de ar e vogais arredondadas.",
    "notes": "A2 A2 B2 C#3 C#3 D3 E3 E3 D3 C#3 C#3 B2 A2",
    "variation": "A2 0 +1 +1 0 +0.5 +1 0 -1 -0.5 0 -1 -1",
    "image": "tablaturas/Doo Hoo Motif.png",
    "audio": "sample_vocal/Doo Hoo Motif.mp3",
    "lesson": "htm/Doo Hoo Motif.htm"
  },
  {
    "id": 9,
    "name": "Me He Maa Staccato & Legato",
    "short": "Me He Maa Staccato & Legato",
    "type": "Tom",
    "objective": "Alternar ataques curtos e linha ligada sem perder afinação.",
    "notes": "A2 B2 A2 B2 A2 B2 C#3 B2 A2",
    "variation": "A2 +1 -1 +1 -1 +1 +1 -1 -1",
    "image": "tablaturas/Me He Maa Staccato & Legato.png",
    "audio": "sample_vocal/Me He Maa Staccato & Legato.mp3",
    "lesson": "htm/Me He Maa Staccato & Legato.htm"
  },
  {
    "id": 10,
    "name": "Yum Ya",
    "short": "Yum Ya",
    "type": "Tom",
    "objective": "Manter mandíbula livre e emissão consistente.",
    "notes": "A2 B2 C#3 B2 A2 C#3 E3 C#3 A2",
    "variation": "A2 +1 +1 -1 -1 +2 +1.5 -1.5 -2",
    "image": "tablaturas/Yum Ya.png",
    "audio": "sample_vocal/Yum Ya.mp3",
    "lesson": "htm/Yum Ya.htm"
  },
  {
    "id": 11,
    "name": "Mom Moh",
    "short": "Mom Moh",
    "type": "Tom",
    "objective": "Trabalhar projeção e estabilidade de timbre sem empurrar.",
    "notes": "A2 B2 C#3 B2 A2 B2 C#3 B2 A2",
    "variation": "A2 +1 +1 -1 -1 +1 +1 -1 -1",
    "image": "tablaturas/Mom Moh.png",
    "audio": "sample_vocal/Mom Moh.mp3",
    "lesson": "htm/Mom Moh.htm"
  },
  {
    "id": 12,
    "name": "Glee Scale",
    "short": "Glee Scale",
    "type": "Tom",
    "objective": "Buscar emissão brilhante e precisa sem nasalizar à força.",
    "notes": "B2 C#3 D#3 E3 F#3 E3 D#3 C#3 B2",
    "variation": "B2 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Glee Scale.png",
    "audio": "sample_vocal/Glee Scale.mp3",
    "lesson": "htm/Glee Scale.htm"
  },
  {
    "id": 13,
    "name": "Puffy Cheek",
    "short": "Puffy Cheek",
    "type": "Tom",
    "objective": "Treinar coordenação eficiente, transição de registros e fluxo estável.",
    "notes": "D3 E3 F#3 G3 A3 G3 F#3 E3 D3",
    "variation": "D3 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Puffy Cheek.png",
    "audio": "sample_vocal/Puffy Cheek.mp3",
    "lesson": "htm/Puffy Cheek.htm"
  },
  {
    "id": 14,
    "name": "Mah Meh Mee Moh Moo",
    "short": "Mah Meh Mee Moh Moo",
    "type": "Articulação",
    "objective": "Uniformizar vogais sem mudar a afinação.",
    "notes": "A2 A2 A2 A2 A2",
    "variation": "A2 0 0 0 0",
    "image": "tablaturas/Mah Meh Mee Moh Moo.png",
    "audio": "sample_vocal/Mah Meh Mee Moh Moo.mp3",
    "lesson": "htm/Mah Meh Mee Moh Moo.htm"
  },
  {
    "id": 15,
    "name": "Mommy Made Me Mash",
    "short": "Mommy Made Me Mash",
    "type": "Articulação",
    "objective": "Articular claramente mantendo uma linha vocal contínua.",
    "notes": "A2 B2 C#3 D3 E3 D3 C#3 B2 A2",
    "variation": "A2 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Mommy Made Me Mash.png",
    "audio": "sample_vocal/Mommy Made Me Mash.mp3",
    "lesson": "htm/Mommy Made Me Mash.htm"
  },
  {
    "id": 16,
    "name": "Chewy Chrrey",
    "short": "Chewy Chrrey",
    "type": "Articulação",
    "objective": "Treinar articulação rápida sem endurecer mandíbula e língua.",
    "notes": "A2 B2 C#3 D3 E3 D3 C#3 B2 A2",
    "variation": "A2 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Chewy Chrrey.png",
    "audio": "sample_vocal/Chewy Cherry.mp3",
    "lesson": "htm/Chewy Chrrey.htm"
  },
  {
    "id": 17,
    "name": "Poppy Puppy",
    "short": "Poppy Puppy",
    "type": "Articulação",
    "objective": "Coordenar consoantes explosivas sem excesso de pressão.",
    "notes": "A2 B2 C#3 D3 E3 D3 C#3 B2 A2",
    "variation": "A2 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Poppy Puppy.png",
    "audio": "sample_vocal/Poppy Puppy.mp3",
    "lesson": "htm/Poppy Puppy.htm"
  },
  {
    "id": 18,
    "name": "Blueberry",
    "short": "Blueberry",
    "type": "Articulação",
    "objective": "Combinar clareza da palavra com saltos de arpejo.",
    "notes": "A2 C#3 E3 A3 E3 C#3 A2",
    "variation": "A2 +2 +1.5 +2.5 -2.5 -1.5 -2",
    "image": "tablaturas/Blueberry.png",
    "audio": "sample_vocal/Blueberry.mp3",
    "lesson": "htm/Blueberry.htm"
  },
  {
    "id": 19,
    "name": "Bumblebee",
    "short": "Bumblebee",
    "type": "Articulação",
    "objective": "Desenvolver agilidade articulatória em uma sequência longa.",
    "notes": "A2 C#3 B2 D3 C#3 E3 D3 F#3 E3 G#3 F#3 A3 G#3 B3 A3 C#4 A3 B3 G#3 A3 F#3 G#3 E3 F#3 D3 E3 C#3 D3 B2 A2",
    "variation": "A2 +2 -1 +1.5 -0.5 +1.5 -1 +2 -1 +2 -1 +1.5 -0.5 +1.5 -1 +2 -2 +1 -1.5 +0.5 -1.5 +1 -2 +1 -2 +1 -1.5 +0.5 -1.5 -1",
    "image": "tablaturas/Bumblebee.png",
    "audio": "sample_vocal/Bumblebee.mp3",
    "lesson": "htm/Bumblebee.htm"
  },
  {
    "id": 20,
    "name": "Neh Noy Scale",
    "short": "Neh Noy Scale",
    "type": "Articulação",
    "objective": "Manter clareza de vogais e flexibilidade da boca em toda a escala.",
    "notes": "A2 B2 C#3 D3 E3 F#3 G#3 A3 G#3 F#3 E3 D3 C#3 B2 A2",
    "variation": "A2 +1 +1 +0.5 +1 +1 +1 +0.5 -0.5 -1 -1 -1 -0.5 -1 -1",
    "image": "tablaturas/Neh Noy Scale.png",
    "audio": "sample_vocal/Neh Noy Scale.mp3",
    "lesson": "htm/Neh Noy Scale.htm"
  },
  {
    "id": 21,
    "name": "Octave Repeat Nay",
    "short": "Octave Repeat Nay",
    "type": "Alcance",
    "objective": "Treinar salto de oitava e coordenação de voz mista.",
    "notes": "A2 C#3 E3 A3 A3 A3 A3 E3 C#3 A2",
    "variation": "A2 +2 +1.5 +2.5 0 0 0 -2.5 -1.5 -2",
    "image": "tablaturas/Octave repeat Nay.png",
    "audio": "sample_vocal/Octave Repeat Nay.mp3",
    "lesson": "htm/Octave Repeat Nay.htm"
  },
  {
    "id": 22,
    "name": "Octave Alternate Ee",
    "short": "Octave Alternate Ee",
    "type": "Alcance",
    "objective": "Alternar região média e aguda mantendo precisão e leveza.",
    "notes": "C3 E3 G3 C4 G3 C4 G3 C4 G3 C4 G3",
    "variation": "C3 +2 +1.5 +2.5 -2.5 +2.5 -2.5 +2.5 -2.5 +2.5 -2.5",
    "image": "tablaturas/Octave Alternate Ee.png",
    "audio": "sample_vocal/Octave Alternate Ee.mp3",
    "lesson": "htm/Octave Alternate Ee.htm"
  },
  {
    "id": 23,
    "name": "Bouncing Eh",
    "short": "Bouncing Eh",
    "type": "Alcance",
    "objective": "Conservar a vogal estável durante saltos repetidos.",
    "notes": "G#2 C3 D#3 G#3 A#3 G#3 A#3 G#3 A#3 G#3",
    "variation": "G#2 +2 +1.5 +2.5 +1 -1 +1 -1 +1 -1",
    "image": "tablaturas/Bouncing Eh.png",
    "audio": "sample_vocal/bouncing Eh.mp3",
    "lesson": "htm/Bouncing Eh.htm"
  },
  {
    "id": 24,
    "name": "Leaping Ga",
    "short": "Leaping Ga",
    "type": "Alcance",
    "objective": "Treinar saltos ascendentes sem carregar peso excessivo.",
    "notes": "A#2 D3 F3 A#3 C4 A#3 C4 D4 C4 A#3 C4 A#3",
    "variation": "A#2 +2 +1.5 +2.5 +1 -1 +1 +1 -1 -1 +1 -1",
    "image": "tablaturas/Leaping Ga.png",
    "audio": "sample_vocal/Leaping Ga.mp3",
    "lesson": "htm/Leaping Ga.htm"
  },
  {
    "id": 25,
    "name": "1.5 Octave Go",
    "short": "1.5 Octave Go",
    "type": "Alcance",
    "objective": "Expandir alcance em um desenho amplo mantendo coordenação.",
    "notes": "A2 E3 A3 C#4 E4 D4 B3 G#3 E3 D3 B2 A2",
    "variation": "A2 +3.5 +2.5 +2 +1.5 -1 -1.5 -1.5 -2 -1 -1.5 -1",
    "image": "tablaturas/1.5 Octave Go.png",
    "audio": "sample_vocal/1.5 Octave Go.mp3",
    "lesson": "htm/1.5 Octave Go.htm"
  },
  {
    "id": 26,
    "name": "Ascending Yaw",
    "short": "Ascending Yaw",
    "type": "Alcance",
    "objective": "Subir uma oitava mantendo liberdade na garganta.",
    "notes": "C3 D3 E3 F3 G3 A3 B3 C4",
    "variation": "C3 +1 +1 +0.5 +1 +1 +1 +0.5",
    "image": "tablaturas/Ascending Yaw.png",
    "audio": "sample_vocal/Ascending Yaw.mp3",
    "lesson": "htm/Ascending Yaw.htm"
  },
  {
    "id": 27,
    "name": "Three-Note Run",
    "short": "Three-Note Run",
    "type": "Agilidade",
    "objective": "Precisão em pequenas descidas rápidas.",
    "notes": "D#3 C#3 B2",
    "variation": "D#3 -1 -1",
    "image": "tablaturas/Three-Note run.png",
    "audio": "sample_vocal/Thee-Note Run.mp3",
    "lesson": "htm/Three-Note Run.htm"
  },
  {
    "id": 28,
    "name": "Swift Build-Up",
    "short": "Swift Build-Up",
    "type": "Agilidade",
    "objective": "Aumentar velocidade mantendo notas individualizadas.",
    "notes": "E3 F#3 E3 F#3 G#3 F#3 E3 F#3 G#3 A3 G#3 F#3 E3 F#3 G#3 A3 B3 A3 G#3 F#3 E3",
    "variation": "E3 +1 -1 +1 +1 -1 -1 +1 +1 +0.5 -0.5 -1 -1 +1 +1 +0.5 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Swift Bullid-Up.png",
    "audio": "sample_vocal/Swift Build-Up.mp3",
    "lesson": "htm/Swift Build-Up.htm"
  },
  {
    "id": 29,
    "name": "Major 7 Arpeggio",
    "short": "Major 7 Arpeggio",
    "type": "Agilidade",
    "objective": "Treinar saltos rápidos e retorno preciso ao centro tonal.",
    "notes": "A#2 D3 F3 A3 A#3 A3 F3 D3 A#2 D3 F3 A3 A#3 A3 F3 D3 A#2 D3 F3 A3 A#3 A3 F3 D3 A#2 D3 F3 A3 A#3 A3 F3 D3 A#2 D3 F3 A3 A#3 A3 F3 D3 A#2",
    "variation": "A#2 +2 +1.5 +2 +0.5 -0.5 -2 -1.5 -2 +2 +1.5 +2 +0.5 -0.5 -2 -1.5 -2 +2 +1.5 +2 +0.5 -0.5 -2 -1.5 -2 +2 +1.5 +2 +0.5 -0.5 -2 -1.5 -2 +2 +1.5 +2 +0.5 -0.5 -2 -1.5 -2",
    "image": "tablaturas/Major 7 Arpeggio.png",
    "audio": "sample_vocal/Major 7 Arpeggio.mp3",
    "lesson": "htm/Major 7 Arpeggio.htm"
  },
  {
    "id": 30,
    "name": "Ascending Run",
    "short": "Ascending Run",
    "type": "Agilidade",
    "objective": "Precisão em sequências ascendentes rápidas.",
    "notes": "G#2 A#2 C3 A#2 C3 C#3 C3 C#3 D#3 C#3 D#3 F3 D#3 F3 G3 F3 G3 G#3 G3 A#3 G#3",
    "variation": "G#2 +1 +1 -1 +1 +0.5 -0.5 +0.5 +1 -1 +1 +1 -1 +1 +1 -1 +1 +0.5 -0.5 +1.5 -1",
    "image": "tablaturas/Ascending Run.png",
    "audio": "sample_vocal/Ascending Run.mp3",
    "lesson": "htm/Ascending Run.htm"
  },
  {
    "id": 31,
    "name": "Descending Run",
    "short": "Descending Run",
    "type": "Agilidade",
    "objective": "Precisão e estabilidade em passagens rápidas descendentes.",
    "notes": "C4 A#3 G#3 A#3 G#3 G3 G#3 G3 F3 G3 F3 D#3 F3 D#3 C#3 D#3 C#3 C3 A#2 G#2",
    "variation": "C4 -1 -1 +1 -1 -0.5 +0.5 -0.5 -1 +1 -1 -1 +1 -1 -1 +1 -1 -0.5 -1 -1",
    "image": "tablaturas/Descending Run.png",
    "audio": "sample_vocal/Descending Run.mp3",
    "lesson": "htm/Descending Run.htm"
  },
  {
    "id": 32,
    "name": "Major Scale Ascending",
    "short": "Major Scale Ascending",
    "type": "Escalas",
    "objective": "Usar a escala maior como base de afinação, coordenação e internalização de intervalos.",
    "notes": "A2 B2 C#3 D3 E3 F#3 G#3 A3",
    "variation": "A2 +1 +1 +0.5 +1 +1 +1 +0.5",
    "image": "tablaturas/Major Scale Ascending.png",
    "audio": "sample_vocal/Major Scale Ascending.mp3",
    "lesson": "htm/Major Scale Ascending.htm"
  },
  {
    "id": 33,
    "name": "Minor Scale Ascending",
    "short": "Minor Scale Ascending",
    "type": "Escalas",
    "objective": "Internalizar o desenho da escala menor natural.",
    "notes": "A2 B2 C3 D3 E3 F3 G3 A3",
    "variation": "A2 +1 +0.5 +1 +1 +0.5 +1 +1",
    "image": "tablaturas/Minor Sacale Ascending.png",
    "audio": "sample_vocal/Minor Scale Ascending.mp3",
    "lesson": "htm/Minor Scale Ascending.htm"
  },
  {
    "id": 34,
    "name": "Major Scale Descending",
    "short": "Major Scale Descending",
    "type": "Escalas",
    "objective": "Estabilizar afinação na descida da escala maior.",
    "notes": "A3 G#3 F#3 E3 D3 C#3 B2 A2",
    "variation": "A3 -0.5 -1 -1 -1 -0.5 -1 -1",
    "image": "tablaturas/Major Scale Descending.png",
    "audio": "sample_vocal/Major Scale Descending.mp3",
    "lesson": "htm/Major Scale Descending.htm"
  },
  {
    "id": 35,
    "name": "Minor Scale Descending",
    "short": "Minor Scale Descending",
    "type": "Escalas",
    "objective": "Estabilizar afinação na descida da escala menor natural.",
    "notes": "A3 G3 F3 E3 D3 C3 B2 A2",
    "variation": "A3 -1 -1 -0.5 -1 -1 -0.5 -1",
    "image": "tablaturas/Minor Scale Descending.png",
    "audio": "sample_vocal/Minor Scale Descending.mp3",
    "lesson": "htm/Minor Scale Descending.htm"
  },
  {
    "id": 36,
    "name": "Major Scale Asc. Intervals",
    "short": "Major Scale Asc. Intervals",
    "type": "Escalas",
    "objective": "Treinar cada grau maior como distância relativa à tônica.",
    "notes": "A2 B2 A2 C#3 A2 D3 A2 E3 A2 F#3 A2 G#3 A2 A3",
    "variation": "A2 +1 -1 +2 -2 +2.5 -2.5 +3.5 -3.5 +4.5 -4.5 +5.5 -5.5 +6",
    "image": "tablaturas/Major Scale Asc. Intervals.png",
    "audio": "sample_vocal/Major Scale Asc. Intervals.mp3",
    "lesson": "htm/Major Scale Asc. Intervals.htm"
  },
  {
    "id": 37,
    "name": "Minor Scale Asc. Intervals",
    "short": "Minor Scale Asc. Intervals",
    "type": "Escalas",
    "objective": "Treinar cada grau menor como distância relativa à tônica.",
    "notes": "A2 B2 A2 C3 A2 D3 A2 E3 A2 F3 A2 G3 A2 A3",
    "variation": "A2 +1 -1 +1.5 -1.5 +2.5 -2.5 +3.5 -3.5 +4 -4 +5 -5 +6",
    "image": "tablaturas/Minor Scale Asc. Intervals.png",
    "audio": "sample_vocal/Minor Scale Asc. Intervals.mp3",
    "lesson": "htm/Minor Scale As. Intervals.htm"
  },
  {
    "id": 38,
    "name": "Major Scale Desc. Intervals",
    "short": "Major Scale Desc. Intervals",
    "type": "Escalas",
    "objective": "Reconhecer e executar intervalos descendentes da escala maior.",
    "notes": "A3 G#3 A3 F#3 A3 E3 A3 D3 A3 C#3 A3 B2 A3 A2",
    "variation": "A3 -0.5 +0.5 -1.5 +1.5 -2.5 +2.5 -3.5 +3.5 -4 +4 -5 +5 -6",
    "image": "tablaturas/Major Scale Desc. Intervals.png",
    "audio": "sample_vocal/Major Scale Desc. Intervals.mp3",
    "lesson": "htm/Major Scale Desc. Intervals.htm"
  },
  {
    "id": 39,
    "name": "Minor Scale Desc. Intervals",
    "short": "Minor Scale Desc. Intervals",
    "type": "Escalas",
    "objective": "Reconhecer e executar intervalos descendentes da escala menor.",
    "notes": "A3 G3 A3 F3 A3 E3 A3 D3 A3 C3 A3 B2 A3 A2",
    "variation": "A3 -1 +1 -2 +2 -2.5 +2.5 -3.5 +3.5 -4.5 +4.5 -5 +5 -6",
    "image": "tablaturas/Minor Sale Desc. Intervals.png",
    "audio": "sample_vocal/Minor Scale Desc. Intervals.mp3",
    "lesson": "htm/Minor Scale Desc. Intervals.htm"
  }
];
const SESSIONS = {"A": [1, 2, 13, 32, 34, 36, 38], "B": [1, 3, 13, 33, 35, 37, 39], "C": [1, 2, 5, 6, 7, 8, 10], "D": [1, 13, 4, 9, 11, 12, 14], "E": [1, 2, 13, 14, 15, 16, 17, 18, 19, 20], "F": [1, 3, 13, 21, 22, 23], "G": [1, 13, 24, 25, 26, 21, 22], "H": [1, 2, 13, 27, 28, 29, 30, 31]};
const SESSION_FOCUS = {"A": "Escalas maiores e intervalos maiores", "B": "Escalas menores e intervalos menores", "C": "Coordenação, timbre e ressonância I", "D": "Timbre, ressonância e articulação leve", "E": "Articulação completa", "F": "Alcance e voz mista I", "G": "Alcance e voz mista II", "H": "Agilidade e precisão"};

const byId = Object.fromEntries(EXERCISES.map(x => [x.id, x]));
const daySelect = document.getElementById('daySelect');
const exerciseSelect = document.getElementById('exerciseSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const tabStage = document.getElementById('tabStage');
const tabImage = document.getElementById('tabImage');
const audio = document.getElementById('exerciseAudio');
const frame = document.getElementById('lessonFrame');
const baseStartBtn = document.getElementById('baseStartBtn');
const baseListenBtn = document.getElementById('baseListenBtn');
const baseTranspose = document.getElementById('baseTranspose');
const baseDirection = document.getElementById('baseDirection');
const baseGuided = document.getElementById('baseGuided');
const baseBpm = document.getElementById('baseBpm');
const baseTempoDown = document.getElementById('baseTempoDown');
const baseTempoUp = document.getElementById('baseTempoUp');
const baseSubdivision = document.getElementById('baseSubdivision');
const guideInstrumentSelect = document.getElementById('guideInstrumentSelect');
const trainerOverlay = document.getElementById('trainerOverlay');
const trainerFrame = document.getElementById('trainerFrame');
const trainerCloseBtn = document.getElementById('trainerCloseBtn');

const STORAGE_KEY = 'vocal-friendly-environment-v2';
const TRANSPOSE_MIN = -8;
const TRANSPOSE_MAX = 8;
const BPM_MIN = 40;
const BPM_MAX = 180;

function readEnvironment() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch (_) {
    return {};
  }
}

const environment = readEnvironment();
environment.training = environment.training && typeof environment.training === 'object'
  ? environment.training
  : {};
environment.instrument = environment.instrument || 'acoustic_guitar_nylon';

let currentDay = SESSIONS[environment.day] ? environment.day : 'A';
let sessionIndex = Number.isInteger(environment.sessionIndex) ? environment.sessionIndex : 0;
let currentExerciseId = byId[environment.exerciseId]
  ? environment.exerciseId
  : SESSIONS[currentDay][Math.min(sessionIndex, SESSIONS[currentDay].length - 1)];
let activeTrainingKey = null;
let pendingTrainerConfig = null;
let trainerReady = false;
let previewAudioContext = null;
let previewInstrument = null;
let previewInstrumentName = null;
let previewRunId = 0;
let previewTimers = [];
let trainerPopup = null;
const lessonSections = new Map();

function saveEnvironment() {
  environment.day = currentDay;
  environment.sessionIndex = sessionIndex;
  environment.exerciseId = currentExerciseId;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(environment)); } catch (_) {}
}

function clampTranspose(value) {
  const parsed = Number.parseInt(value, 10);
  return Math.min(TRANSPOSE_MAX, Math.max(TRANSPOSE_MIN, Number.isFinite(parsed) ? parsed : 0));
}

function clampBpm(value, fallback = 80) {
  const parsed = Number.parseInt(value, 10);
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Number.isFinite(parsed) ? parsed : fallback));
}

function clampSubdivision(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Math.min(4, Math.max(1, Number.isFinite(parsed) ? parsed : fallback));
}

function getTrainingState(key, defaults = {}) {
  const raw = environment.training[key] || {};
  return {
    shift: clampTranspose(raw.shift),
    up: raw.up !== false,
    guided: raw.guided !== false,
    bpm: clampBpm(raw.bpm, defaults.bpm || 80),
    subdivision: clampSubdivision(raw.subdivision, defaults.subdivision || 1),
  };
}

function setTrainingState(key, next) {
  const current = getTrainingState(key, next);
  environment.training[key] = {
    shift: clampTranspose(next.shift ?? current.shift),
    up: next.up == null ? current.up : next.up !== false,
    guided: next.guided == null ? current.guided : next.guided !== false,
    bpm: clampBpm(next.bpm, current.bpm),
    subdivision: clampSubdivision(next.subdivision, current.subdivision),
  };
  saveEnvironment();
  return environment.training[key];
}

function pathFor(p) { return p ? encodeURI(p) : ''; }

const NOTE_TO_MIDI_CLASS = { C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11 };
const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function noteToMidi(note) {
  const match = String(note).trim().replaceAll('♯','#').replaceAll('♭','b').match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return null;
  const name = match[1].toUpperCase() + match[2];
  const pitchClass = NOTE_TO_MIDI_CLASS[name];
  if (!Number.isInteger(pitchClass)) return null;
  return 12 * (Number(match[3]) + 1) + pitchClass;
}

function midiToNote(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  return `${SHARP_NAMES[pitchClass]}${Math.floor(midi / 12) - 1}`;
}

function transposeNotes(notes, shift) {
  return notes.map(note => {
    const midi = noteToMidi(note);
    return midi == null ? note : midiToNote(midi + shift);
  });
}

function noteTokens(text) {
  return [...String(text || '').matchAll(/\b([A-Ga-g](?:[#♯b♭])?-?\d+)\b/g)]
    .map(match => match[1][0].toUpperCase() + match[1].slice(1).replaceAll('♯','#').replaceAll('♭','b'));
}

function bestExplicitSequence(title, text) {
  const titleNotes = noteTokens(title);
  if (titleNotes.length) return titleNotes;

  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const candidates = lines
    .map((line, index) => ({ notes: noteTokens(line), index, line }))
    .filter(candidate => candidate.notes.length >= 2 && candidate.notes.length <= 64)
    .sort((a, b) => b.notes.length - a.notes.length || a.index - b.index);

  return candidates[0]?.notes || [];
}

function bpmFromText(text, fallback) {
  const range = String(text || '').match(/(\d{2,3})\s*[–—-]\s*(\d{2,3})\s*bpm/i);
  if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2);
  const single = String(text || '').match(/(\d{2,3})\s*bpm/i);
  if (single) return Number(single[1]);
  return fallback;
}

// Ritmos-base revistos por finalidade: lentos para sustentação/alcance,
// moderados para escalas e articulação, e mais rápidos para agilidade.
const EXERCISE_TEMPO_DEFAULTS = {
  1:[60,1], 2:[88,1], 3:[60,1], 4:[80,1], 5:[76,1], 6:[84,1], 7:[72,1], 8:[80,1],
  9:[84,1], 10:[84,1], 11:[80,1], 12:[88,1], 13:[76,1], 14:[72,1], 15:[88,1], 16:[92,1],
  17:[92,1], 18:[80,1], 19:[104,2], 20:[88,1], 21:[72,1], 22:[72,1], 23:[80,1], 24:[72,1],
  25:[66,1], 26:[76,1], 27:[96,2], 28:[104,2], 29:[96,2], 30:[96,3], 31:[96,3], 32:[80,1],
  33:[76,1], 34:[80,1], 35:[76,1], 36:[72,1], 37:[72,1], 38:[72,1], 39:[72,1],
};

function defaultTempo(exercise) {
  const [bpm, subdivision] = EXERCISE_TEMPO_DEFAULTS[exercise.id] || [80, 1];
  return { bpm, subdivision };
}

function subdivisionFromText(exercise, title, text) {
  const sample = `${title}\n${text}`;
  if (/tercina|triplet/i.test(sample)) return 3;
  if (/semicolcheia|quatro notas por pulso/i.test(sample)) return 4;
  if (/colcheia|duas notas por pulso/i.test(sample)) return 2;
  return defaultTempo(exercise).subdivision;
}

function breathingDurationFromText(title, text, bpm) {
  const sample = `${title}\n${text}`;
  const pulses = sample.match(/(\d{1,3})\s*pulsos?/i);
  if (pulses) return Math.min(180, Math.max(8, Math.round(Number(pulses[1]) * 60 / bpm)));
  const seconds = sample.match(/(?:por|durante|até)?\s*(\d{1,3})\s*(?:s|segundos?)(?:\b|\s)/i);
  if (seconds) return Math.min(180, Math.max(8, Number(seconds[1])));
  const minutes = sample.match(/(?:por|durante|~)?\s*(\d{1,2})\s*(?:min|minutos?)(?:\b|\s)/i);
  if (minutes) return Math.min(180, Math.max(15, Number(minutes[1]) * 60));
  return 30;
}

function isUnpitchedSection(exercise, title, text) {
  if (exercise.type === 'Respiração') return true;
  const sample = `${title} ${text}`.toLowerCase();
  return /sem pitch|sem voz|articula[cç][aã]o sem pitch|fala ritmada|fale |diga |somente consoante|consoantes esqueleto|hiss|sopro|respira|staccato puffs/.test(sample);
}

function guideForSection(vocalNotes, title, text) {
  const sample = `${title}\n${text}`;
  let guide = [...vocalNotes];
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  if (/fantasm/i.test(sample)) {
    const targets = noteTokens(title);
    const targetSet = new Set(targets);
    if (targetSet.size) guide = vocalNotes.map(note => targetSet.has(note) ? null : note);
  }

  // Quando o texto escreve uma pausa na linha do violão, preservamos a mesma
  // posição na sequência vocal. Funciona tanto com A2/B2 quanto com A/B.
  const silentLine = lines.find(line => /sil[eê]ncio/i.test(line) && /viol[aã]o|\b[A-G](?:[#♯b♭])?\b/i.test(line));
  if (silentLine) {
    const beforeSilence = silentLine.split(/\[?\s*sil[eê]ncio/i)[0];
    let notesBefore = noteTokens(beforeSilence).length;
    if (!notesBefore) {
      const musicalPart = beforeSilence.includes(':') ? beforeSilence.split(':').slice(1).join(':') : beforeSilence;
      notesBefore = (musicalPart.match(/\b[A-G](?:[#♯b♭])?\b/g) || []).length;
    }
    if (notesBefore > 0 && notesBefore < guide.length) guide[notesBefore] = null;
  }

  const guitarSentence = lines.find(line => /viol[aã]o\s+(?:toca|marca)|toque\s+(?:apenas|somente)|toque.+cante/i.test(line));
  if (guitarSentence && /apenas|somente|marca|[aâ]ncora/i.test(guitarSentence)) {
    const anchors = new Set(noteTokens(guitarSentence));
    if (anchors.size) guide = vocalNotes.map(note => anchors.has(note) ? note : null);
  }

  if (/primeira e (?:a )?[uú]ltima nota de cada (?:triplet|tercina)/i.test(sample)) {
    guide = vocalNotes.map((note, index) => index % 3 === 0 || index % 3 === 2 ? note : null);
  } else if (/pontos? (?:de partida|de in[ií]cio) (?:dos|das) (?:sete )?(?:triplets?|tercinas?|c[eé]lulas?)/i.test(sample)) {
    const groupSize = /triplet|tercina/i.test(sample) ? 3 : 3;
    guide = vocalNotes.map((note, index) => index % groupSize === 0 ? note : null);
  } else if (/notas? superiores? de cada zigue-zague/i.test(sample)) {
    guide = vocalNotes.map((note, index) => {
      const midi = noteToMidi(note);
      const previous = noteToMidi(vocalNotes[index - 1]);
      const next = noteToMidi(vocalNotes[index + 1]);
      return midi != null && (previous == null || midi >= previous) && (next == null || midi >= next) ? note : null;
    });
  }

  const removedTargets = lines
    .filter(line => /retire.+viol[aã]o|retire do viol[aã]o/i.test(line))
    .flatMap(noteTokens);
  if (removedTargets.length) {
    const removed = new Set(removedTargets);
    guide = guide.map(note => removed.has(note) ? null : note);
  } else if (/retire do viol[aã]o a nota superior/i.test(sample)) {
    const midis = vocalNotes.map(noteToMidi).filter(Number.isFinite);
    const highest = midis.length ? Math.max(...midis) : null;
    if (highest != null) guide = guide.map(note => noteToMidi(note) === highest ? null : note);
  }

  if (/sem viol[aã]o|retire (?:completamente )?o viol[aã]o|voz sozinha|fa[cç]a.+sozinh[oa]|cante.+sozinh[oa]/i.test(sample)) {
    guide = vocalNotes.map(() => null);
  }

  if (/apenas a t[oô]nica|somente a t[oô]nica|confirma[cç][aã]o tardia/i.test(sample)) {
    guide = vocalNotes.map((note, index) => index === 0 ? note : null);
  }

  return guide;
}

function buildTrainingConfig(exercise, section = {}) {
  const key = section.trainingKey || `${exercise.id}:base`;
  const title = section.title || 'Exercício principal';
  const text = section.text || '';
  const tempoDefault = defaultTempo(exercise);
  const suggestedBpm = bpmFromText(`${title}\n${text}`, tempoDefault.bpm);
  const suggestedSubdivision = subdivisionFromText(exercise, title, text);
  const state = getTrainingState(key, { bpm: suggestedBpm, subdivision: suggestedSubdivision });
  setTrainingState(key, state);
  const baseNotes = exercise.notes === 'qualquer' ? [] : exercise.notes.split(/\s+/).filter(Boolean);
  const explicit = bestExplicitSequence(title, text);
  const guideVariation = /fantasm|notas?-[aâ]ncora|notas? [aâ]ncora|viol[aã]o (?:toca|marca) apenas|toque (?:apenas|somente)|retire.+viol[aã]o|sem viol[aã]o|cante toda|cante tudo|escala sozinh|apenas a t[oô]nica|confirma[cç][aã]o tardia|\[?\s*sil[eê]ncio/i.test(`${title}\n${text}`);
  const sourceNotes = guideVariation && baseNotes.length ? baseNotes : (explicit.length ? explicit : baseNotes);
  const mode = isUnpitchedSection(exercise, title, text) || !sourceNotes.length ? 'breathing' : 'pitch';
  const bpm = state.bpm;
  const subdivision = state.subdivision;
  const shiftedNotes = transposeNotes(sourceNotes, state.shift);
  const baseGuide = guideForSection(sourceNotes, title, text);
  const shiftedGuide = baseGuide.map(note => note == null ? null : transposeNotes([note], state.shift)[0]);

  return {
    version: 2,
    trainingKey: key,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    trainingTitle: title,
    objective: exercise.objective,
    mode,
    transpose: state.shift,
    directionUp: state.up,
    guided: state.guided,
    instrument: environment.instrument,
    vocalNotes: shiftedNotes,
    guideNotes: shiftedGuide,
    bpm,
    subdivision,
    noteDurationMs: Math.round(60000 / (bpm * subdivision)),
    breathingDurationSec: breathingDurationFromText(title, text, bpm),
    sourceText: text.slice(0, 1800),
  };
}

function postLessonContext() {
  const exercise = byId[currentExerciseId];
  if (!exercise || !frame.contentWindow) return;
  frame.contentWindow.postMessage({
    type: 'vocal-lesson-context',
    exercise: { id: exercise.id, name: exercise.name, type: exercise.type, notes: exercise.notes },
    states: environment.training,
    limits: { min: TRANSPOSE_MIN, max: TRANSPOSE_MAX },
    tempoDefaults: defaultTempo(exercise),
  }, '*');
}

function postLessonSectionConfig(section) {
  const exercise = byId[currentExerciseId];
  if (!exercise || !section?.trainingKey || !frame.contentWindow) return;
  const config = buildTrainingConfig(exercise, section);
  frame.contentWindow.postMessage({ type: 'vocal-section-config', key: section.trainingKey, config }, '*');
}

function syncBaseControls() {
  const exercise = byId[currentExerciseId];
  const state = getTrainingState(`${currentExerciseId}:base`, defaultTempo(exercise));
  baseTranspose.value = state.shift;
  baseDirection.checked = state.up;
  baseDirection.nextElementSibling.textContent = state.up ? '↑' : '↓';
  baseGuided.checked = state.guided;
  baseBpm.value = state.bpm;
  baseSubdivision.value = String(state.subdivision);
  guideInstrumentSelect.value = environment.instrument;
}

function clearPreview() {
  previewRunId += 1;
  previewTimers.forEach(clearTimeout);
  previewTimers = [];
  try { previewInstrument?.stop(); } catch (_) {}
  document.querySelectorAll('.training-listen[data-playing="true"]').forEach(button => {
    button.dataset.playing = 'false';
    button.textContent = 'Ouvir';
  });
}

async function ensurePreviewAudioContext() {
  if (!previewAudioContext || previewAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio não está disponível neste navegador.');
    previewAudioContext = new AudioContextClass({ latencyHint: 'interactive' });
  }
  await Promise.race([
    previewAudioContext.resume(),
    new Promise(resolve => setTimeout(resolve, 900)),
  ]);
  if (previewAudioContext.state !== 'running') throw new Error('O navegador bloqueou a ativação do áudio. Clique novamente em Ouvir.');
  return previewAudioContext;
}

async function ensurePreviewInstrument() {
  await ensurePreviewAudioContext();
  const name = environment.instrument;
  if (previewInstrument && previewInstrumentName === name) return previewInstrument;
  try { previewInstrument?.dispose(); } catch (_) {}
  const { Soundfont } = await import('https://unpkg.com/smplr/dist/index.mjs');
  previewInstrumentName = name;
  previewInstrument = Soundfont(previewAudioContext, {
    instrument: name,
    kit: 'MusyngKite',
    volume: 105,
  });
  await previewInstrument.ready;
  return previewInstrument;
}

function playPreviewClick(accent = false) {
  if (!previewAudioContext || previewAudioContext.state === 'closed') return;
  const now = previewAudioContext.currentTime;
  const oscillator = previewAudioContext.createOscillator();
  const gain = previewAudioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(accent ? 1320 : 880, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.12 : 0.07, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain).connect(previewAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.065);
}

async function previewTraining(config, button) {
  clearPreview();
  const runId = previewRunId;
  button.dataset.playing = 'true';
  button.textContent = 'Parar';

  try {
    if (config.mode === 'breathing') {
      await ensurePreviewAudioContext();
      [0, 1, 2, 3].forEach(index => previewTimers.push(setTimeout(() => playPreviewClick(index === 0), index * 300)));
      previewTimers.push(setTimeout(clearPreview, 1350));
      return;
    }

    const guide = Array.isArray(config.guideNotes) ? config.guideNotes : [];
    if (!guide.some(Boolean)) {
      await ensurePreviewAudioContext();
      const beatMs = Math.round(60000 / config.bpm);
      [0, 1, 2, 3].forEach(index => previewTimers.push(setTimeout(() => playPreviewClick(index === 0), index * beatMs)));
      previewTimers.push(setTimeout(clearPreview, 4 * beatMs + 80));
      return;
    }

    const instrument = await ensurePreviewInstrument();
    if (runId !== previewRunId) return;
    const noteMs = Math.round(60000 / (config.bpm * config.subdivision));
    const noteSec = noteMs / 1000;
    guide.forEach((note, index) => {
      previewTimers.push(setTimeout(() => {
        if (runId !== previewRunId || !note) return;
        const midi = noteToMidi(note);
        if (midi == null) return;
        instrument.start({ note: midi, duration: Math.max(.12, noteSec * .82), velocity: 84 });
      }, index * noteMs));
    });
    previewTimers.push(setTimeout(clearPreview, Math.max(600, guide.length * noteMs + 100)));
  } catch (error) {
    clearPreview();
    button.textContent = 'Falhou';
    button.title = `Não foi possível ouvir o guia: ${error.message}`;
    previewTimers.push(setTimeout(() => { button.textContent = 'Ouvir'; }, 1500));
  }
}

function postTrainerConfig() {
  if (!trainerReady || !pendingTrainerConfig || !trainerFrame.contentWindow) return;
  trainerFrame.contentWindow.postMessage({ type: 'vocal-trainer-config', config: pendingTrainerConfig }, '*');
}

function popupTrainerUrl(config) {
  const url = new URL(pathFor('trainer/index.html'), window.location.href);
  url.hash = `config=${encodeURIComponent(JSON.stringify(config))}`;
  return url.href;
}

function openTrainerPopup(config) {
  trainerPopup = window.open(
    popupTrainerUrl(config),
    'vocalTrainerWindow',
    'popup=yes,width=1180,height=820,resizable=yes,scrollbars=yes'
  );
  if (!trainerPopup) return false;
  trainerPopup.focus?.();
  return true;
}

function openTrainer(config) {
  clearPreview();
  activeTrainingKey = config.trainingKey;
  pendingTrainerConfig = config;
  if (window.location.protocol === 'file:' && openTrainerPopup(config)) return;
  trainerOverlay.hidden = false;
  document.body.classList.add('trainer-open');
  if (!trainerFrame.getAttribute('src')) {
    trainerReady = false;
    trainerFrame.src = pathFor('trainer/index.html');
  } else {
    postTrainerConfig();
  }
}

function closeTrainer() {
  if (trainerPopup && !trainerPopup.closed) trainerPopup.close();
  trainerPopup = null;
  trainerFrame.contentWindow?.postMessage({ type: 'vocal-trainer-stop' }, '*');
  trainerOverlay.hidden = true;
  document.body.classList.remove('trainer-open');
  activeTrainingKey = null;
  pendingTrainerConfig = null;
}

function advanceTrainingState(key) {
  const current = getTrainingState(key);
  const next = setTrainingState(key, {
    shift: current.shift + (current.up ? 1 : -1),
    up: current.up,
  });

  if (key === `${currentExerciseId}:base`) syncBaseControls();
  frame.contentWindow?.postMessage({ type: 'vocal-training-state', key, state: next }, '*');
  const section = lessonSections.get(key);
  if (section) postLessonSectionConfig(section);
}

function populate() {
  Object.keys(SESSIONS).forEach(day => {
    const opt = document.createElement('option');
    opt.value = day;
    opt.textContent = `${day} — ${SESSION_FOCUS[day]}`;
    daySelect.appendChild(opt);
  });
  EXERCISES.forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = `${ex.id} — ${ex.name}`;
    exerciseSelect.appendChild(opt);
  });
}

function render(id, source='session') {
  const ex = byId[id];
  if (!ex) return;
  lessonSections.clear();
  currentExerciseId = ex.id;
  exerciseSelect.value = String(ex.id);
  document.getElementById('notesText').textContent = ex.notes;
  document.getElementById('variationText').textContent = ex.variation;

  audio.pause();
  audio.src = pathFor(ex.audio);
  audio.load();

  if (ex.image) {
    tabStage.hidden = false;
    tabImage.hidden = false;
    tabImage.src = pathFor(ex.image);
    tabImage.alt = `Tablatura — ${ex.name}`;
    tabImage.onerror = () => {
      tabImage.hidden = true;
      tabStage.hidden = true;
    };
  } else {
    tabImage.removeAttribute('src');
    tabImage.hidden = true;
    tabStage.hidden = true;
  }
  frame.src = pathFor(ex.lesson);

  const pos = SESSIONS[currentDay].indexOf(ex.id);
  if (source === 'session' && pos >= 0) sessionIndex = pos;
  syncBaseControls();
  saveEnvironment();
}

function chooseDay(day) {
  currentDay = day;
  sessionIndex = 0;
  render(SESSIONS[currentDay][sessionIndex], 'session');
  saveEnvironment();
}
function move(delta) {
  const list = SESSIONS[currentDay];
  sessionIndex = (sessionIndex + delta + list.length) % list.length;
  render(list[sessionIndex], 'session');
}

daySelect.addEventListener('change', e => chooseDay(e.target.value));
exerciseSelect.addEventListener('change', e => render(Number(e.target.value), 'free'));
prevBtn.addEventListener('click', () => move(-1));
nextBtn.addEventListener('click', () => move(1));
fullscreenBtn.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await tabStage.requestFullscreen();
    else await document.exitFullscreen();
  } catch (_) {}
});
document.addEventListener('fullscreenchange', () => {
  fullscreenBtn.textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
});
document.addEventListener('keydown', e => {
  if (['SELECT','INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (!trainerOverlay.hidden && e.key === 'Escape') {
    e.preventDefault();
    closeTrainer();
    return;
  }
  if (!trainerOverlay.hidden) return;
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
});

frame.addEventListener('load', postLessonContext);

function saveBaseTranspose(event) {
  if (event?.type === 'input' && (baseTranspose.value === '' || baseTranspose.value === '-')) return;
  const key = `${currentExerciseId}:base`;
  const current = getTrainingState(key);
  const next = setTrainingState(key, { ...current, shift: baseTranspose.value });
  baseTranspose.value = next.shift;
}
baseTranspose.addEventListener('input', saveBaseTranspose);
baseTranspose.addEventListener('change', saveBaseTranspose);

baseDirection.addEventListener('change', () => {
  const key = `${currentExerciseId}:base`;
  const current = getTrainingState(key);
  setTrainingState(key, { ...current, up: baseDirection.checked });
  baseDirection.nextElementSibling.textContent = baseDirection.checked ? '↑' : '↓';
});

baseGuided.addEventListener('change', () => {
  const key = `${currentExerciseId}:base`;
  setTrainingState(key, { ...getTrainingState(key), guided: baseGuided.checked });
});

function saveBaseTempo() {
  const key = `${currentExerciseId}:base`;
  const current = getTrainingState(key, defaultTempo(byId[currentExerciseId]));
  const next = setTrainingState(key, {
    ...current,
    bpm: baseBpm.value,
    subdivision: baseSubdivision.value,
  });
  baseBpm.value = next.bpm;
  baseSubdivision.value = String(next.subdivision);
}
baseBpm.addEventListener('change', saveBaseTempo);
baseSubdivision.addEventListener('change', saveBaseTempo);
baseTempoDown.addEventListener('click', () => {
  baseBpm.value = clampBpm(Number(baseBpm.value) - 4, 80);
  saveBaseTempo();
});
baseTempoUp.addEventListener('click', () => {
  baseBpm.value = clampBpm(Number(baseBpm.value) + 4, 80);
  saveBaseTempo();
});

guideInstrumentSelect.addEventListener('change', () => {
  clearPreview();
  environment.instrument = guideInstrumentSelect.value;
  saveEnvironment();
});

baseStartBtn.addEventListener('click', () => {
  const exercise = byId[currentExerciseId];
  openTrainer(buildTrainingConfig(exercise, { trainingKey: `${exercise.id}:base`, title: 'Exercício principal' }));
});

baseListenBtn.addEventListener('click', () => {
  if (baseListenBtn.dataset.playing === 'true') {
    clearPreview();
    return;
  }
  const exercise = byId[currentExerciseId];
  previewTraining(buildTrainingConfig(exercise, { trainingKey: `${exercise.id}:base`, title: 'Exercício principal' }), baseListenBtn);
});

trainerCloseBtn.addEventListener('click', closeTrainer);
trainerOverlay.addEventListener('click', event => {
  if (event.target === trainerOverlay) closeTrainer();
});

window.addEventListener('message', event => {
  const message = event.data || {};

  if (trainerPopup && event.source === trainerPopup) {
    if (message.type === 'vocal-trainer-complete') {
      const key = message.trainingKey || activeTrainingKey;
      if (key) advanceTrainingState(key);
      closeTrainer();
    } else if (message.type === 'vocal-trainer-close') {
      closeTrainer();
    }
    return;
  }

  if (event.source === trainerFrame.contentWindow) {
    if (message.type === 'vocal-trainer-ready') {
      trainerReady = true;
      postTrainerConfig();
    } else if (message.type === 'vocal-trainer-close') {
      closeTrainer();
    } else if (message.type === 'vocal-trainer-complete') {
      const key = message.trainingKey || activeTrainingKey;
      if (key) advanceTrainingState(key);
      closeTrainer();
    }
    return;
  }

  if (event.source === frame.contentWindow) {
    if (message.type === 'vocal-lesson-ready') {
      postLessonContext();
    } else if (message.type === 'vocal-register-training') {
      if (message.section?.trainingKey) {
        lessonSections.set(message.section.trainingKey, message.section);
        postLessonSectionConfig(message.section);
      }
    } else if (message.type === 'vocal-training-state-change') {
      setTrainingState(message.key, message.state || {});
      if (message.section?.trainingKey) lessonSections.set(message.section.trainingKey, message.section);
      const section = lessonSections.get(message.key);
      if (section) postLessonSectionConfig(section);
    } else if (message.type === 'vocal-training-complete') {
      if (message.key) advanceTrainingState(message.key);
    } else if (message.type === 'vocal-open-training') {
      const exercise = byId[currentExerciseId];
      if (!exercise) return;
      if (message.section?.trainingKey) lessonSections.set(message.section.trainingKey, message.section);
      openTrainer(buildTrainingConfig(exercise, message.section || {}));
    } else if (message.type === 'vocal-preview-training') {
      const exercise = byId[currentExerciseId];
      if (!exercise) return;
      const config = buildTrainingConfig(exercise, message.section || {});
      previewTraining(config, document.createElement('button'));
      frame.contentWindow?.postMessage({ type: 'vocal-preview-state', key: config.trainingKey, playing: true }, '*');
    }
  }
});

populate();
daySelect.value = currentDay;
render(currentExerciseId, 'session');
