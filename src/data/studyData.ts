import { SubjectCourseData, SubjectMeta, SubjectName } from '../types/study';

export const SUBJECT_LIST: SubjectMeta[] = [
  {
    id: 'Chemistry',
    shortLabel: 'Chemistry',
    fullLabel: 'Chemistry',
    subtitle: 'Electrochemistry, Batteries & Energy Systems',
    accentText: 'text-teal-700',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
    barColor: 'bg-teal-600',
  },
  {
    id: 'Communication Skills',
    shortLabel: 'Comm. Skills',
    fullLabel: 'Communication Skills',
    subtitle: 'Technical Writing, Listening & Presentations',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    barColor: 'bg-amber-500',
  },
  {
    id: 'PSC',
    shortLabel: 'PSC (C Prog.)',
    fullLabel: 'PSC (Problem Solving with C)',
    subtitle: 'Algorithms, Control Flow, Arrays & Pointers',
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    barColor: 'bg-blue-600',
  },
];

export const SUBJECT_META_MAP: Record<SubjectName, SubjectMeta> = {
  Chemistry: SUBJECT_LIST[0],
  'Communication Skills': SUBJECT_LIST[1],
  PSC: SUBJECT_LIST[2],
};

/**
 * Exact hard-coded JSON data for the Quiz and Doubt Solver tabs.
 * Do not invent new questions here; filter strictly by subject.
 */
export const STUDY_DATA: SubjectCourseData[] = [
  {
    subject: 'Chemistry',
    unit: 1,
    quiz: [
      {
        question:
          'What is the potential of the Standard Hydrogen Electrode (SHE), used as the reference for measuring standard electrode potentials?',
        options: ['+1.00 V', '0.00 V', '-1.00 V', '+0.34 V'],
        answer: '0.00 V',
        explanation:
          'The SHE is defined as the reference electrode with a potential of 0.00 V.',
      },
      {
        question:
          'In a galvanic (voltaic) cell, where does oxidation occur and in which direction do electrons flow?',
        options: [
          'At the cathode; electrons flow from cathode to anode',
          'At the anode; electrons flow from cathode to anode',
          'At the cathode; electrons flow from anode to cathode',
          'At the anode; electrons flow from anode to cathode',
        ],
        answer: 'At the anode; electrons flow from anode to cathode',
        explanation:
          'Oxidation (loss of electrons) happens at the anode, and electrons flow naturally from the anode to the cathode.',
      },
      {
        question:
          'In the cathode reaction of the Leclanche dry cell, manganese changes from which oxidation state to which?',
        options: ['+2 to +4', '+3 to +4', '+4 to +3', '+4 to +2'],
        answer: '+4 to +3',
        explanation:
          'MnO2 (Mn in +4 state) is reduced to MnO(OH) (Mn in +3 state).',
      },
      {
        question:
          'Which electrolyte is used in the lead storage battery commonly found in automobiles and inverters?',
        options: [
          'Concentrated sodium hydroxide',
          'Ammonium chloride paste',
          '38% sulphuric acid solution',
          'Lithium hexafluorophosphate',
        ],
        answer: '38% sulphuric acid solution',
        explanation:
          'The lead storage battery has a Pb anode, a PbO2 cathode and a 38% H2SO4 solution as the electrolyte.',
      },
      {
        question:
          'In a lithium-cobalt oxide (LCO) battery, what happens to the lithium ions during charging?',
        options: [
          'They move from the anode (graphite) to the cathode (LiCoO2)',
          'They move from the cathode (LiCoO2) to the anode (graphite)',
          'They stay fixed in the electrolyte',
          'They are converted into lithium metal at the separator',
        ],
        answer: 'They move from the cathode (LiCoO2) to the anode (graphite)',
        explanation:
          'On charging, Li+ ions travel through the electrolyte from the LiCoO2 cathode to the graphite anode, and they move back on discharge.',
      },
      {
        question:
          'Which metal-air battery is commonly used in hearing aids because it is small and lasts a long time?',
        options: ['Lithium-ion', 'Lead-acid', 'Zinc-air', 'Nickel-metal hydride'],
        answer: 'Zinc-air',
        explanation:
          'The notes state that zinc-air batteries are commonly used in hearing aids.',
      },
      {
        question: 'How does a supercapacitor store and release energy?',
        options: [
          'By irreversible chemical decomposition of the electrolyte',
          'By reversible adsorption and desorption of ions at the electrode-electrolyte interface',
          'By burning hydrogen and oxygen',
          'By converting sunlight into electron-hole pairs',
        ],
        answer:
          'By reversible adsorption and desorption of ions at the electrode-electrolyte interface',
        explanation:
          'A supercapacitor is an electrochemical capacitor that works through reversible ion adsorption and desorption at the interface.',
      },
      {
        question:
          'In the H2-O2 fuel cell, which electrolyte is used and what is the only byproduct?',
        options: [
          'Sulphuric acid; carbon dioxide',
          'Ammonium chloride; ammonia',
          'Concentrated NaOH; water',
          'LiPF6; hydrogen peroxide',
        ],
        answer: 'Concentrated NaOH; water',
        explanation:
          'The H2-O2 fuel cell uses concentrated sodium hydroxide as electrolyte and produces only water (2H2 + O2 → 2H2O).',
      },
      {
        question:
          'Which element in the electrochemical series has the lowest (most negative) standard electrode potential, meaning it loses electrons most readily?',
        options: [
          'Gold (+1.5 V)',
          'Copper (+0.34 V)',
          'Zinc (-0.76 V)',
          'Lithium (-3.04 V)',
        ],
        answer: 'Lithium (-3.04 V)',
        explanation:
          'Lithium has the most negative standard electrode potential (-3.04 V), so it has the highest tendency to undergo oxidation.',
      },
      {
        question:
          'Why can the bandgap of quantum dots in QDSSCs be adjusted to suit specific light wavelengths?',
        options: [
          'By changing the size of the quantum dots',
          'By changing the electrolyte to NaOH',
          'By adding a separator',
          'By increasing the temperature to 298 K',
        ],
        answer: 'By changing the size of the quantum dots',
        explanation:
          'The notes state that the bandgap of quantum dots can be tuned by changing their size.',
      },
    ],
    doubts: [
      {
        question:
          'What is the difference between a galvanic cell and an electrolytic cell?',
        answer:
          'Step 1: Ask what the cell does with energy. A galvanic cell converts chemical energy into electrical energy; an electrolytic cell converts electrical energy into chemical energy. Step 2: Ask whether the reaction is spontaneous. Galvanic cells use spontaneous redox reactions and need no external power source; electrolytic cells drive non-spontaneous reactions and need an external voltage source. Step 3: Check the electrodes. In both cells oxidation happens at the anode and reduction at the cathode, but the anode is negative in a galvanic cell and positive in an electrolytic cell. Example: A zinc-copper cell (a battery) is galvanic, while the electrolysis of water is electrolytic.',
      },
      {
        question:
          'How do I use the electrochemical series to predict whether one metal can displace another?',
        answer:
          'Step 1: Find both metals in the electrochemical series, which is arranged by standard electrode potential. Step 2: Note which one sits higher in the series (more negative potential). It has a greater tendency to lose electrons. Step 3: The higher metal displaces the lower metal from its salt solution, but not the other way round. Example: Zinc (-0.76 V) is above copper (+0.34 V), so zinc displaces copper from copper sulfate solution, but copper cannot displace zinc.',
      },
      {
        question: 'How do primary, secondary and reserve batteries differ?',
        answer:
          'Step 1: Check whether the battery can be recharged. Primary batteries are single-use and cannot be recharged; secondary batteries are rechargeable and reusable. Step 2: Check how it is stored. Reserve batteries are stored unused for long periods and activated only when needed. Step 3: Match the type to its use. Primary batteries suit low-drain devices, secondary batteries suit devices that are used and recharged often, and reserve batteries suit emergencies and long-term storage. Example: An AA cell is primary, a lithium-ion or lead-acid battery is secondary, and military or emergency lighting batteries are reserve.',
      },
      {
        question:
          'How does a lead storage battery work during use and during charging?',
        answer:
          'Step 1: Know the parts. The anode is lead (Pb), the cathode is a lead grid packed with PbO2, and the electrolyte is 38% sulphuric acid. Step 2: During use (discharge), both electrodes turn into PbSO4. Anode: Pb + SO4^2- → PbSO4 + 2e-. Cathode: PbO2 + SO4^2- + 4H+ + 2e- → PbSO4 + 2H2O. Step 3: During charging, current is passed in the opposite direction, so PbSO4 on the anode and cathode is converted back into Pb and PbO2. Example: A car battery supplies current to start the engine (discharge) and is recharged as the car runs.',
      },
      {
        question:
          'What is the difference between a conventional capacitor and a supercapacitor?',
        answer:
          'Step 1: Compare the structure. A conventional capacitor has two conductive plates separated by a dielectric; a supercapacitor has porous electrodes (like activated carbon) with an electrolyte. Step 2: Compare capacity. Capacitors store little energy (μF to mF), while supercapacitors store much more (F to thousands of F). Step 3: Compare speed and voltage. Capacitors charge almost instantly and have a higher voltage per cell; supercapacitors charge fast but slower than capacitors, with a lower voltage per cell of about 2.7 to 3 V. Example: A capacitor is used for smoothing voltage in a circuit, while a supercapacitor is used for energy recovery in regenerative braking.',
      },
    ],
  },
];

/**
 * Curated daily study modules for the Study Planner timetable generator
 * across first-year engineering subjects.
 */
export const PLANNER_TOPICS: Record<SubjectName, string[]> = {
  Chemistry: [
    'Revise SHE reference potential & galvanic vs electrolytic cells',
    'Practice electrochemical series & metal displacement problems',
    'Study Leclanché dry cell & lead storage battery reactions',
    'Review Lithium-Cobalt Oxide (LCO) & Zinc-air battery notes',
    'Cover H2-O2 fuel cells, supercapacitors & QDSSC bandgap tuning',
    'Solve Unit 1 electrochemistry MCQs & write reaction summary',
  ],
  'Communication Skills': [
    'Review communication cycle, channels & workplace barriers',
    'Practice active listening techniques & oral presentation flow',
    'Draft formal engineering emails, memos & official letters',
    'Complete reading comprehension, note-making & precis exercise',
    'Structure technical report sections (abstract, findings, summary)',
    'Rehearse 3-minute technical pitch & revise grammar mechanics',
  ],
  PSC: [
    'Trace flowcharts, pseudocode & C operators precedence',
    'Code branching & loop exercises (if-else, switch, for, while)',
    'Solve 1D & 2D array traversal and string handling programs',
    'Practice modular C functions, parameter passing & recursion',
    'Dry-run pointer arithmetic & call-by-reference examples',
    'Revise structures, file operations & debug sample C programs',
  ],
};

import { UploadedNote } from '../types/study';

export const DEFAULT_NOTES: UploadedNote[] = [
  {
    id: 'note-chem-unit1',
    title: 'Unit 1: Electrochemistry & Battery Systems Handout',
    subject: 'Chemistry',
    uploadDate: '2026-10-28',
    sourceType: 'preset',
    wordCount: 380,
    content: `CHEMISTRY UNIT 1: ELECTROCHEMISTRY & ENERGY STORAGE SYSTEMS

1. Standard Hydrogen Electrode (SHE):
- Potential is set to exactly 0.00 V at 298 K, 1 atm H2 gas, and 1 M H+ ions.
- Acts as universal reference electrode to determine standard electrode potentials (E°).
- Lithium has the most negative potential (-3.04 V), exhibiting the highest oxidation tendency.

2. Electrochemical Cells:
- Galvanic (Voltaic) Cell: Converts chemical energy into electrical energy spontaneously. Oxidation occurs at Anode (negative pole), Reduction occurs at Cathode (positive pole). Electrons flow from anode to cathode through the external circuit.
- Electrolytic Cell: Converts electrical energy into chemical energy non-spontaneously using an external power source.

3. Commercial Batteries:
- Leclanché Dry Cell: Anode = Zinc container; Cathode = Carbon/Graphite rod surrounded by MnO2. Manganese is reduced from +4 state (MnO2) to +3 state (MnO(OH)).
- Lead Storage Battery: Anode = Spongy Pb; Cathode = PbO2 grid; Electrolyte = 38% H2SO4 solution. On discharge, both electrodes convert into PbSO4. On charging, reversed current converts PbSO4 back to Pb and PbO2.
- Lithium-Cobalt Oxide (LCO) Battery: LiCoO2 cathode, Graphite anode. During charging, Li+ ions travel from cathode (LiCoO2) through electrolyte to anode (graphite).
- Zinc-Air Battery: Uses atmospheric oxygen as cathode reactant and zinc metal anode. High energy density and long lifespan; widely used in hearing aids.

4. Modern Capacitors & Fuel Cells:
- Supercapacitors: Electrochemical double-layer capacitors storing energy via reversible ion adsorption/desorption at electrode-electrolyte interface. High power density and rapid charge/discharge cycles.
- H2-O2 Fuel Cell: Uses concentrated aqueous NaOH electrolyte. Reacts 2H2 + O2 -> 2H2O. Produces only pure water as byproduct.
- Quantum Dot Solar Cells (QDSSCs): Bandgap energy is tunable by altering the physical size of quantum dots.`,
  },
  {
    id: 'note-psc-cprog',
    title: 'PSC Unit 2: C Control Flow, Pointers & Modular Functions',
    subject: 'PSC',
    uploadDate: '2026-10-29',
    sourceType: 'preset',
    wordCount: 320,
    content: `PSC (PROBLEM SOLVING WITH C) - CORE LECTURE REVISION

1. Operator Precedence & Control Structures:
- Highest precedence: Parentheses (), post-increment ++, member access -> and .
- Relational operators (<, <=, >, >=) have higher precedence than equality (==, !=).
- Logical AND (&&) has higher precedence than logical OR (||). Both exhibit short-circuit evaluation.
- Switch statements require integer or character constant expressions. Remember 'break' to avoid fall-through.

2. Arrays & Memory Layout:
- Array indexing starts at index 0. C does not perform automatic bounds checking.
- 2D arrays are stored in row-major order: matrix[row][col] mapped to base + (row * num_cols + col) * sizeof(element).
- Strings in C are 1D character arrays terminated by a null character ('\\0').

3. Pointers & Parameter Passing:
- Pointer variable stores memory address of another variable: int *ptr = &val;
- Dereference operator (*): accesses value at stored address.
- Address-of operator (&): retrieves memory address.
- Pass-by-value copies variable value; changes inside function do not affect caller.
- Pass-by-reference simulated in C using pointers: allows function to mutate caller variables directly (e.g. swap(int *a, int *b)).
- Pointer arithmetic: (ptr + 1) increments the address by sizeof(data_type) bytes.`,
  },
  {
    id: 'note-comm-skills',
    title: 'Comm Skills: Technical Writing & Formal Reports Guide',
    subject: 'Communication Skills',
    uploadDate: '2026-10-30',
    sourceType: 'preset',
    wordCount: 290,
    content: `COMMUNICATION SKILLS FOR ENGINEERS - STUDY GUIDE

1. The 7 Cs of Effective Technical Communication:
- Completeness: Convey all necessary engineering facts.
- Conciseness: Eliminate unnecessary jargon and redundant fillers.
- Consideration: Tailor vocabulary to target audience (technical peer vs lay executive).
- Concreteness: Use specific data, measurements, and verifiable claims rather than vague adjectives.
- Clarity: Single interpretation, short direct sentences.
- Courtesy: Professional, respectful tone in emails and client communications.
- Correctness: Accurate grammar, technical terminology, and numerical formatting.

2. Engineering Technical Reports Architecture:
- Executive Summary / Abstract: High-level overview of problem, methodology, key findings, and final recommendation.
- Introduction & Scope: Context, objectives, and constraints.
- Methodology & Analysis: Experimental setup, calculations, and data presentation.
- Conclusions & Recommendations: Actionable next steps based on verified evidence.

3. Professional Correspondence:
- Formal Emails: Subject line must be concise and actionable (e.g., "Project Delta: Structural Load Test Results - Review Required").
- Active vs Passive Voice: Use active voice for clarity in instructions; passive voice is traditional in formal lab methodology to emphasize the procedure over the person.`,
  },
];

