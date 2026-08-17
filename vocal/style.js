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
    "lesson": "htm/Minor Scale Asc. Intervals.htm"
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
let currentDay = 'A';
let sessionIndex = 0;
let currentExerciseId = SESSIONS[currentDay][0];

function pathFor(p) { return p ? encodeURI(p) : ''; }

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
}

function chooseDay(day) {
  currentDay = day;
  sessionIndex = 0;
  render(SESSIONS[currentDay][sessionIndex], 'session');
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
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
});

populate();
daySelect.value = currentDay;
render(currentExerciseId, 'session');
