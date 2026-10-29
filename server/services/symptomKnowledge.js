/**
 * Static, general health-information content for the rule-based symptom
 * guide. This is NOT diagnostic logic. Content is intentionally general and
 * avoids medication or treatment recommendations.
 */

export const SYMPTOMS = [
  {
    id: 'fever',
    label: 'Fever',
    keywords: ['fever', 'temperature', 'feverish', 'bukhar'],
    info: 'A raised body temperature is commonly the body’s response to an infection, but it can have many causes.',
    seeDoctorIf: [
      'It lasts more than 3 days or keeps returning',
      'It is very high, or occurs in an infant under 3 months',
      'It comes with a rash, stiff neck, confusion or difficulty breathing',
    ],
    facilityType: 'clinic',
  },
  {
    id: 'cough',
    label: 'Cough',
    keywords: ['cough', 'coughing'],
    info: 'Coughs are often linked to colds or other respiratory irritation and many settle on their own.',
    seeDoctorIf: [
      'It lasts longer than 3 weeks',
      'You cough up blood',
      'It comes with breathlessness, chest pain or weight loss',
    ],
    facilityType: 'clinic',
  },
  {
    id: 'sore_throat',
    label: 'Sore throat',
    keywords: ['sore throat', 'throat pain', 'throat'],
    info: 'A sore throat is frequently associated with common viral infections.',
    seeDoctorIf: ['You have difficulty swallowing or breathing', 'It lasts longer than a week', 'You have a high fever with it'],
    facilityType: 'clinic',
  },
  {
    id: 'headache',
    label: 'Headache',
    keywords: ['headache', 'head ache', 'head pain', 'migraine'],
    info: 'Headaches are very common and are often related to tension, dehydration, lack of sleep or screen use.',
    seeDoctorIf: [
      'It is sudden and severe ("worst headache of your life")',
      'It follows a head injury',
      'It comes with fever, stiff neck, confusion, vision changes or weakness',
    ],
    facilityType: 'clinic',
  },
  {
    id: 'stomach_pain',
    label: 'Stomach / abdominal pain',
    keywords: ['stomach', 'abdominal', 'abdomen', 'belly', 'tummy'],
    info: 'Abdominal discomfort has many possible causes, from indigestion to conditions that need prompt care.',
    seeDoctorIf: ['The pain is severe or getting worse', 'You have a fever or persistent vomiting', 'The pain lasts more than a day or two'],
    facilityType: 'clinic',
  },
  {
    id: 'diarrhoea',
    label: 'Diarrhoea',
    keywords: ['diarrhoea', 'diarrhea', 'loose motion', 'loose stools'],
    info: 'Diarrhoea is often caused by infections or food and can lead to dehydration, especially in children and older adults.',
    seeDoctorIf: ['There is blood in the stool', 'Signs of dehydration appear (very little urine, dizziness)', 'It lasts more than 2 days in adults or 24 hours in children'],
    facilityType: 'clinic',
  },
  {
    id: 'vomiting',
    label: 'Nausea / vomiting',
    keywords: ['vomit', 'vomiting', 'nausea', 'nauseous', 'throwing up'],
    info: 'Nausea and vomiting can accompany infections, food-related illness, motion sickness and many other conditions.',
    seeDoctorIf: ['You cannot keep fluids down for 24 hours', 'There is blood or a dark "coffee ground" appearance', 'It comes with severe abdominal pain or headache'],
    facilityType: 'clinic',
  },
  {
    id: 'rash',
    label: 'Skin rash',
    keywords: ['rash', 'itch', 'itchy', 'hives', 'skin'],
    info: 'Rashes can result from irritation, allergies, infections and other causes.',
    seeDoctorIf: ['It spreads quickly or is painful', 'It comes with fever', 'It does not fade when pressed with a glass'],
    facilityType: 'clinic',
  },
  {
    id: 'fatigue',
    label: 'Tiredness / fatigue',
    keywords: ['tired', 'fatigue', 'weakness', 'exhausted', 'low energy'],
    info: 'Ongoing tiredness can be linked to sleep, stress, diet, infections or other health conditions.',
    seeDoctorIf: ['It lasts several weeks', 'It comes with weight loss, fever or breathlessness'],
    facilityType: 'doctors',
  },
  {
    id: 'dizziness',
    label: 'Dizziness',
    keywords: ['dizzy', 'dizziness', 'lightheaded', 'vertigo'],
    info: 'Dizziness can be related to dehydration, standing up quickly, inner-ear problems and other causes.',
    seeDoctorIf: ['It keeps happening', 'You faint or nearly faint', 'It comes with chest pain, palpitations or weakness'],
    facilityType: 'clinic',
  },
  {
    id: 'body_ache',
    label: 'Body ache / joint pain',
    keywords: ['body ache', 'body pain', 'joint pain', 'muscle pain', 'aches'],
    info: 'Aches are common with viral illnesses and after physical strain.',
    seeDoctorIf: ['A joint is hot, red or swollen', 'Pain follows an injury and you cannot bear weight', 'It lasts more than a couple of weeks'],
    facilityType: 'clinic',
  },
  {
    id: 'toothache',
    label: 'Toothache',
    keywords: ['tooth', 'teeth', 'toothache', 'gum'],
    info: 'Tooth pain is often related to decay, gum problems or a cracked tooth.',
    seeDoctorIf: ['There is facial swelling or fever', 'The pain is severe or lasts more than a day or two'],
    facilityType: 'dentist',
  },
  {
    id: 'ear_pain',
    label: 'Ear pain',
    keywords: ['ear', 'earache'],
    info: 'Ear pain is often linked to infections or blockages, especially in children.',
    seeDoctorIf: ['There is discharge or hearing loss', 'It comes with high fever', 'It lasts more than 2–3 days'],
    facilityType: 'clinic',
  },
  {
    id: 'burning_urination',
    label: 'Burning urination',
    keywords: ['urine', 'urination', 'burning pee', 'peeing'],
    info: 'Burning or frequent urination can be associated with urinary infections and other conditions.',
    seeDoctorIf: ['You have a fever or back/side pain', 'There is blood in the urine', 'You are pregnant'],
    facilityType: 'clinic',
  },
];

/**
 * Potentially serious symptoms. Matching any of these produces an emergency
 * warning regardless of any other result (including AI output).
 */
export const RED_FLAGS = [
  { id: 'chest_pain', label: 'Chest pain or pressure', keywords: ['chest pain', 'chest pressure', 'chest tightness', 'heart attack', 'pain in chest'] },
  { id: 'breathing', label: 'Severe difficulty breathing', keywords: ['can\'t breathe', 'cannot breathe', 'difficulty breathing', 'shortness of breath', 'breathless', 'not breathing', 'choking'] },
  { id: 'stroke', label: 'Signs of stroke (face drooping, arm weakness, slurred speech)', keywords: ['face drooping', 'slurred speech', 'one side weak', 'weakness on one side', 'stroke', 'paralysis', 'numb on one side'] },
  { id: 'unconscious', label: 'Fainting, unconsciousness or unresponsiveness', keywords: ['unconscious', 'fainted', 'passed out', 'unresponsive', 'not waking'] },
  { id: 'seizure', label: 'Seizure / fits', keywords: ['seizure', 'fits', 'convulsion'] },
  { id: 'bleeding', label: 'Severe or uncontrolled bleeding', keywords: ['heavy bleeding', 'severe bleeding', 'bleeding a lot', 'won\'t stop bleeding', 'vomiting blood', 'coughing blood'] },
  { id: 'allergy', label: 'Severe allergic reaction (swelling of face/throat)', keywords: ['throat swelling', 'tongue swelling', 'face swelling', 'anaphylaxis', 'lips swelling'] },
  { id: 'confusion', label: 'Sudden confusion or severe drowsiness', keywords: ['confused', 'confusion', 'disoriented', 'very drowsy'] },
  { id: 'stiff_neck', label: 'Fever with stiff neck or rash that does not fade', keywords: ['stiff neck', 'neck stiffness'] },
  { id: 'injury', label: 'Serious injury, accident or burn', keywords: ['accident', 'head injury', 'severe burn', 'broken bone', 'fracture'] },
  { id: 'poisoning', label: 'Poisoning or overdose', keywords: ['poison', 'overdose', 'swallowed chemical'] },
  { id: 'pregnancy', label: 'Pregnancy with bleeding, severe pain or reduced baby movement', keywords: ['pregnant bleeding', 'pregnancy bleeding', 'baby not moving'] },
  { id: 'self_harm', label: 'Thoughts of self-harm or suicide', keywords: ['suicide', 'kill myself', 'self harm', 'self-harm', 'end my life'] },
];

export const RED_FLAG_IDS = RED_FLAGS.map((f) => f.id);
export const SYMPTOM_IDS = SYMPTOMS.map((s) => s.id);
