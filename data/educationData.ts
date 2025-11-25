import { Skill, Quiz, SkillProgress } from '@/types';

export const SKILLS: Skill[] = [
  {
    id: 'skill_poda_limpeza',
    name: 'Poda de Limpeza',
    description: 'Tecnicas de poda de limpeza para cacaueiro hibrido e clonal',
    icon: 'scissors',
    color: '#2D5016',
    category: 'Manejo',
    minLevel: 1,
    progressionRules: [
      {
        level: 'teaser',
        xpRequired: 0,
        title: 'Iniciante',
        description: 'Conhecimento basico teorico',
      },
      {
        level: 'N1_assistido',
        xpRequired: 300,
        title: 'N1 Assistido',
        description: 'Pode executar sob supervisao',
      },
      {
        level: 'N2_autonomo',
        xpRequired: 900,
        title: 'N2 Autonomo',
        description: 'Pode executar de forma independente',
      },
      {
        level: 'N3_mentoravel',
        xpRequired: 2500,
        title: 'N3 Mentor',
        description: 'Pode ensinar outros trabalhadores',
      },
    ],
    courses: [
      {
        id: 'course_poda_limpeza_teaser',
        skillId: 'skill_poda_limpeza',
        level: 'teaser',
        title: 'Introducao a Poda de Limpeza',
        description: 'Conheca os conceitos basicos da poda de limpeza do cacaueiro',
        duration: '15 min',
        xpReward: 50,
        quizId: 'quiz_poda_limpeza_intro',
        modules: [
          {
            id: 'mod_intro_1',
            title: 'O que e Poda de Limpeza?',
            description: 'Entenda a importancia da poda para a saude do cacaueiro',
            contentType: 'text',
            icon: 'book-open',
            content: [
              'A poda de limpeza e uma pratica essencial para manter a saude e produtividade do cacaueiro.',
              'Objetivo principal: remover ramos improdutivos, doentes ou mal posicionados.',
              'Beneficios: melhora a circulacao de ar, entrada de luz e facilita a colheita.',
              'Frequencia recomendada: 1-2 vezes por ano, dependendo da variedade.',
            ],
          },
          {
            id: 'mod_intro_2',
            title: 'Arquitetura em Taca',
            description: 'O formato ideal para a copa do cacaueiro',
            contentType: 'text',
            icon: 'target',
            content: [
              'A arquitetura desejavel e em formato de TACA, com ramos equilibrados.',
              'Ramos principais devem ter comprimentos parecidos para distribuir peso dos frutos.',
              'Evite deixar a copa muito fechada ou muito aberta.',
              'A poda circular (Chico Duron) deixa a planta mais baixa e com ramos mais grossos.',
            ],
          },
          {
            id: 'mod_intro_3',
            title: 'O que Remover?',
            description: 'Identificando ramos que devem ser podados',
            contentType: 'checklist',
            icon: 'check-square',
            content: [
              'Ramos secos ou mortos',
              'Ramos doentes (vassoura-de-bruxa, podridao)',
              'Chupoes - ramos ortotrópicos vigorosos que drenam energia',
              'Palmas chupadeiras - ramos plagiotrópicos pouco produtivos',
              'Ramos que crescem para o centro da copa',
              'Ramos entrelaçados ou cruzados',
              'Frutos secos ou doentes',
            ],
          },
        ],
      },
      {
        id: 'course_poda_limpeza_n1',
        skillId: 'skill_poda_limpeza',
        level: 'N1_assistido',
        title: 'Poda de Limpeza N1 - Pratica Assistida',
        description: 'Aprenda a executar a poda de limpeza sob supervisao',
        duration: '45 min',
        xpReward: 150,
        quizId: 'quiz_poda_limpeza_taca_circular_v1',
        prerequisites: ['course_poda_limpeza_teaser'],
        modules: [
          {
            id: 'mod_n1_1',
            title: 'Ferramentas e Seguranca',
            description: 'Equipamentos necessarios e cuidados',
            contentType: 'checklist',
            icon: 'tool',
            content: [
              'Tesoura de poda afiada e limpa',
              'Serrote para galhos mais grossos',
              'Luvas de protecao',
              'Oculos de seguranca',
              'Desinfetante para ferramentas (alcool 70%)',
              'Pasta cicatrizante para cortes grandes',
            ],
          },
          {
            id: 'mod_n1_2',
            title: 'Tecnica de Corte',
            description: 'Como fazer cortes corretos',
            contentType: 'text',
            icon: 'scissors',
            content: [
              'Corte limpo, sem rasgo e sem ferir o ramo principal/tronco.',
              'Nunca arranque no braco - use sempre a ferramenta adequada.',
              'Nao deixe toco longo - corte rente mas sem danificar a casca.',
              'Use lamina afiada - lamina cega causa cortes irregulares.',
              'Para galhos grossos: faca 3 cortes para evitar rasgo da casca.',
            ],
          },
          {
            id: 'mod_n1_3',
            title: 'Sequencia de Trabalho',
            description: 'Ordem correta para executar a poda',
            contentType: 'checklist',
            icon: 'list',
            content: [
              '1. Avalie a planta inteira antes de comecar',
              '2. Remova primeiro os ramos secos e doentes',
              '3. Depois remova chupoes e palmas chupadeiras',
              '4. Por ultimo, ajuste a arquitetura em taca',
              '5. Recolha e descarte adequadamente os residuos',
              '6. Desinfete ferramentas entre plantas doentes',
            ],
          },
          {
            id: 'mod_n1_4',
            title: 'Checklist Pre-Inicio',
            description: 'Verificacoes antes de comecar o servico',
            contentType: 'checklist',
            icon: 'clipboard',
            content: [
              'Ferramentas limpas e afiadas',
              'EPIs em bom estado',
              'Area de trabalho demarcada',
              'Fotos ANTES tiradas (4+ plantas)',
              'Ordem de Servico conferida',
              'Condicoes climaticas favoraveis',
            ],
          },
          {
            id: 'mod_n1_5',
            title: 'Checklist de Execucao',
            description: 'Durante a execucao do servico',
            contentType: 'checklist',
            icon: 'activity',
            content: [
              'Manter ritmo constante sem pressa',
              'Verificar cada planta antes de cortar',
              'Nao exagerar nos cortes (maximo 30% da copa)',
              'Desinfetear ferramentas ao encontrar doencas',
              'Organizar residuos em montes',
              'Hidratar-se regularmente',
            ],
          },
          {
            id: 'mod_n1_6',
            title: 'Checklist de Conclusao',
            description: 'Ao finalizar o servico',
            contentType: 'checklist',
            icon: 'check-circle',
            content: [
              'Fotos DEPOIS tiradas (mesmas plantas)',
              'Area limpa e organizada',
              'Ferramentas limpas e guardadas',
              'Residuos recolhidos ou empilhados',
              'Registro de plantas podadas',
              'Check-out no aplicativo com GPS',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'skill_enxertia',
    name: 'Enxertia',
    description: 'Tecnicas de enxertia para melhoramento genetico do cacaueiro',
    icon: 'git-branch',
    color: '#8B4513',
    category: 'Propagacao',
    minLevel: 2,
    progressionRules: [
      {
        level: 'teaser',
        xpRequired: 0,
        title: 'Iniciante',
        description: 'Conhecimento basico teorico',
      },
      {
        level: 'N1_assistido',
        xpRequired: 400,
        title: 'N1 Assistido',
        description: 'Pode executar sob supervisao',
      },
      {
        level: 'N2_autonomo',
        xpRequired: 1200,
        title: 'N2 Autonomo',
        description: 'Pode executar de forma independente',
      },
      {
        level: 'N3_mentoravel',
        xpRequired: 3000,
        title: 'N3 Mentor',
        description: 'Pode ensinar outros trabalhadores',
      },
    ],
    courses: [
      {
        id: 'course_enxertia_teaser',
        skillId: 'skill_enxertia',
        level: 'teaser',
        title: 'Introducao a Enxertia',
        description: 'Conheca os conceitos basicos da enxertia de cacau',
        duration: '20 min',
        xpReward: 60,
        modules: [
          {
            id: 'mod_enx_1',
            title: 'O que e Enxertia?',
            description: 'Conceitos fundamentais',
            contentType: 'text',
            icon: 'book-open',
            content: [
              'Enxertia e a uniao de duas partes de plantas diferentes.',
              'Cavaleiro (enxerto): parte superior que produz os frutos.',
              'Porta-enxerto: parte inferior que fornece as raizes.',
              'Objetivo: combinar caracteristicas desejaveis de duas plantas.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'skill_colheita',
    name: 'Colheita',
    description: 'Tecnicas de colheita e pos-colheita do cacau',
    icon: 'package',
    color: '#FFB800',
    category: 'Colheita',
    minLevel: 1,
    progressionRules: [
      {
        level: 'teaser',
        xpRequired: 0,
        title: 'Iniciante',
        description: 'Conhecimento basico teorico',
      },
      {
        level: 'N1_assistido',
        xpRequired: 250,
        title: 'N1 Assistido',
        description: 'Pode executar sob supervisao',
      },
      {
        level: 'N2_autonomo',
        xpRequired: 800,
        title: 'N2 Autonomo',
        description: 'Pode executar de forma independente',
      },
      {
        level: 'N3_mentoravel',
        xpRequired: 2000,
        title: 'N3 Mentor',
        description: 'Pode ensinar outros trabalhadores',
      },
    ],
    courses: [
      {
        id: 'course_colheita_teaser',
        skillId: 'skill_colheita',
        level: 'teaser',
        title: 'Introducao a Colheita de Cacau',
        description: 'Aprenda a identificar frutos maduros e tecnicas de colheita',
        duration: '15 min',
        xpReward: 50,
        modules: [
          {
            id: 'mod_col_1',
            title: 'Identificando Frutos Maduros',
            description: 'Quando colher o cacau',
            contentType: 'text',
            icon: 'eye',
            content: [
              'Frutos maduros mudam de cor (verde para amarelo/laranja ou vermelho para laranja).',
              'O som do fruto muda quando esta maduro (mais oco).',
              'Frutos muito maduros podem germinar dentro da casca.',
              'Colha regularmente para evitar perdas.',
            ],
          },
        ],
      },
    ],
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz_poda_limpeza_intro',
    skillId: 'skill_poda_limpeza',
    title: 'Quiz - Introducao a Poda de Limpeza',
    passPercent: 70,
    xp: { baseComplete: 30, passBonus: 30, maxScoreBonus: 20 },
    questions: [
      {
        prompt: 'Qual e o principal objetivo da poda de limpeza?',
        choices: [
          'Fazer a planta crescer mais alta',
          'Remover ramos improdutivos, doentes ou mal posicionados',
          'Aumentar a quantidade de folhas',
          'Deixar a planta mais bonita',
        ],
        correctIndex: 1,
        explanation: 'A poda de limpeza remove ramos que prejudicam a saude e produtividade da planta.',
      },
      {
        prompt: 'Qual formato de copa e recomendado para o cacaueiro?',
        choices: [
          'Cone (pontudo)',
          'Taca, com ramos equilibrados',
          'Parede fechada',
          'Qualquer formato',
        ],
        correctIndex: 1,
        explanation: 'A arquitetura em taca permite melhor distribuicao de luz e equilibrio dos frutos.',
      },
      {
        prompt: 'O que sao "chupoes" na poda?',
        choices: [
          'Frutos doentes',
          'Folhas velhas',
          'Ramos vigorosos que drenam energia da planta',
          'Raizes expostas',
        ],
        correctIndex: 2,
        explanation: 'Chupoes sao ramos ortotropicos muito vigorosos que consomem energia e desorganizam a arquitetura.',
      },
      {
        prompt: 'Com que frequencia deve ser feita a poda de limpeza?',
        choices: [
          'Todo mes',
          '1-2 vezes por ano',
          'A cada 5 anos',
          'Nunca',
        ],
        correctIndex: 1,
        explanation: 'A poda de limpeza deve ser feita 1-2 vezes por ano, dependendo da variedade.',
      },
      {
        prompt: 'O que NAO deve ser removido na poda de limpeza?',
        choices: [
          'Ramos secos',
          'Ramos doentes',
          'Ramos produtivos bem posicionados',
          'Chupoes',
        ],
        correctIndex: 2,
        explanation: 'Ramos produtivos e bem posicionados devem ser mantidos para garantir a producao.',
      },
    ],
  },
  {
    id: 'quiz_poda_limpeza_taca_circular_v1',
    skillId: 'skill_poda_limpeza',
    title: 'Poda de Limpeza - Poda Circular (Taca)',
    passPercent: 80,
    xp: { baseComplete: 50, passBonus: 50, maxScoreBonus: 40 },
    questions: [
      {
        prompt: 'Qual formato de copa e recomendado como arquitetura desejavel para o cacaueiro?',
        choices: [
          'Cone (pontudo) para crescer alto',
          'Taca, com conducao equilibrada dos ramos',
          'Uma "parede" de ramos fechada, sem aberturas',
          'Qualquer formato serve, desde que corte bastante',
        ],
        correctIndex: 1,
        explanation: 'Arquitetura desejavel em taca, com ramos conduzidos para equilibrio e boa captacao de luz.',
      },
      {
        prompt: 'No conceito de taca, o que significa "equilibrio" de copa na pratica?',
        choices: [
          'Deixar um lado mais pesado para "tombar" a planta para o sol',
          'Manter ramos principais em comprimentos parecidos, evitando desequilibrio quando carregar frutos',
          'Cortar todos os ramos secundarios e deixar so o tronco',
          'Abrir um buraco grande no topo para entrar sol direto',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'A "poda circular" (Chico Duron/Durao) tende a deixar a planta...',
        choices: [
          'Mais alta e com copa fechada',
          'Mais baixa, com ramos mais grossos e formato de taca',
          'Totalmente sem sombra (pleno sol interno)',
          'Sem necessidade de remocao de ramos internos',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Na poda de limpeza (manutencao), qual alvo e prioridade para preservar a taca?',
        choices: [
          'Ramos para o centro da copa e ramos entrelacados/cruzados',
          'Somente folhas velhas',
          'Somente galhos muito grossos (sempre)',
          'Somente galhos externos (de fora para dentro)',
        ],
        correctIndex: 0,
      },
      {
        prompt: 'O que sao "chupoes" e por que entram na limpeza?',
        choices: [
          'Ramos ortotropicos muito vigorosos (base/caule) que drenam energia e baguncam a arquitetura',
          'Frutos doentes presos ao tronco',
          'Um tipo de praga',
          'Folhas novas saudaveis',
        ],
        correctIndex: 0,
      },
      {
        prompt: '"Palmas chupadeiras" sao melhor descritas como...',
        choices: [
          'Ramos plagiotropicos vigorosos, em geral pouco produtivos, que funcionam como dreno',
          'Ramos sempre produtivos que nunca devem ser cortados',
          'Somente ramos secos',
          'Ramos que dao flores direto no tronco',
        ],
        correctIndex: 0,
      },
      {
        prompt: 'Qual pratica esta alinhada com "limpeza" + "taca" (sem exagero)?',
        choices: [
          'Abrir um "clarao" de sol dentro da copa',
          'Eliminar ramos problema e manter a copa arejada sem buraco grande',
          'Cortar metade da copa em qualquer epoca',
          'So cortar galhos altos para "dar trabalho" mais rapido',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Na manutencao/limpeza, alem de ramos, tambem podem entrar como alvo...',
        choices: [
          'Frutos secos e doentes',
          'Somente flores',
          'Somente raizes',
          'Somente tronco',
        ],
        correctIndex: 0,
      },
      {
        prompt: 'Qual e o criterio de "corte bom"?',
        choices: [
          'Arrancar no braco para ganhar velocidade',
          'Corte limpo, sem rasgo e sem ferir o ramo principal/tronco',
          'Deixar toco longo para "nao machucar"',
          'Cortar com lamina cega para evitar corte "profundo"',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Por que evidencias (fotos/checklist) e avaliacao pos-servico sao parte do padrao do app?',
        choices: [
          'So burocracia, sem impacto',
          'Tornam o servico auditavel, reduzem conflito e aumentam confianca',
          'Substituem qualquer necessidade de orientacao tecnica',
          'Servem apenas para punir o trabalhador',
        ],
        correctIndex: 1,
      },
    ],
  },
];

export const getSkillById = (id: string): Skill | undefined => {
  return SKILLS.find(skill => skill.id === id);
};

export const getQuizById = (id: string): Quiz | undefined => {
  return QUIZZES.find(quiz => quiz.id === id);
};

export const getCourseById = (courseId: string): { skill: Skill; course: typeof SKILLS[0]['courses'][0] } | undefined => {
  for (const skill of SKILLS) {
    const course = skill.courses.find(c => c.id === courseId);
    if (course) {
      return { skill, course };
    }
  }
  return undefined;
};

export const calculateLevel = (xpTotal: number, progressionRules: Skill['progressionRules']): string => {
  let currentLevel = progressionRules[0]?.level || 'teaser';
  for (const rule of progressionRules) {
    if (xpTotal >= rule.xpRequired) {
      currentLevel = rule.level;
    }
  }
  return currentLevel;
};

export const getNextLevelInfo = (xpTotal: number, progressionRules: Skill['progressionRules']) => {
  for (let i = 0; i < progressionRules.length; i++) {
    if (xpTotal < progressionRules[i].xpRequired) {
      return {
        nextLevel: progressionRules[i],
        xpNeeded: progressionRules[i].xpRequired - xpTotal,
        progress: i > 0 
          ? (xpTotal - progressionRules[i-1].xpRequired) / (progressionRules[i].xpRequired - progressionRules[i-1].xpRequired)
          : xpTotal / progressionRules[i].xpRequired,
      };
    }
  }
  return null;
};

export const DEFAULT_SKILL_PROGRESS: SkillProgress = {
  skillId: '',
  xpTotal: 0,
  level: 'teaser',
  coursesCompleted: [],
  quizzesCompleted: [],
  updatedAt: new Date().toISOString(),
};
