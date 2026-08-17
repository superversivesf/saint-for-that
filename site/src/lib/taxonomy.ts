export interface Category {
  id: string;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'everyday', label: 'Everyday life', description: 'Lost items, housework, errands, daily needs' },
  { id: 'illness', label: 'Illness & healing', description: 'Diseases, mental health, specific conditions' },
  { id: 'jobs', label: 'Jobs & professions', description: 'Vocations, trades, occupations' },
  { id: 'travel', label: 'Travel & transport', description: 'Travelers, drivers, sailors, aviators' },
  { id: 'persecution', label: 'Persecution & prisoners', description: 'Martyrs, oppressed, prisoners, refugees' },
  { id: 'spiritual', label: 'Spiritual life', description: 'Doubt, conversion, prayer, temptations' },
  { id: 'military', label: 'Military & first responders', description: 'Soldiers, police, firefighters, EMS' },
  { id: 'family', label: 'Children & family', description: 'Children, mothers, fathers, fertility, marriage' },
  { id: 'nature', label: 'Animals & nature', description: 'Pets, ecology, environment, weather' },
  { id: 'special', label: 'Special intentions', description: 'Impossible causes, the dying, the poor' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const NEED_SYNONYMS: Record<string, string[]> = {
  'accountants': ['bookkeepers', 'accounting', 'taxes', 'auditors', 'cpas', 'bookkeeping', 'tax preparation', 'finance', 'ledgers', 'tax filing'],
  'actors': ['acting', 'theater', 'theatre', 'performers', 'stage', 'drama', 'thespians', 'performing arts', 'actresses', 'performer'],
  'advertisers': ['advertising', 'marketing', 'ads', 'ad agencies', 'promotions', 'copywriting', 'publicity', 'campaigns', 'marketers', 'ad men'],
  'altar servers': ['altar boys', 'altar girls', 'serving mass', 'acolytes', 'mass servers', 'liturgical serving', 'altar serving', 'servers'],
  'animals': ['pets', 'livestock', 'animal welfare', 'animal care', 'wildlife', 'farm animals', 'creatures', 'beasts', 'vets', 'animal rescue'],
  'anxiety': ['worry', 'stress', 'nervousness', 'anxious', 'panic', 'anxiety attacks', 'angst', 'unease', 'apprehension', 'dread'],
  'architects': ['architecture', 'building design', 'drafting', 'building plans', 'architectural design', 'blueprints', 'structural design', 'design buildings', 'architect'],
  'artists': ['painting', 'art', 'painters', 'sculptors', 'artistry', 'drawing', 'sculpture', 'fine arts', 'visual arts', 'sketching'],
  'back pain': ['backache', 'back problems', 'lower back pain', 'backaches', 'spine pain', 'lumbar pain', 'slipped disc', 'sciatica', 'bad back', 'back ache'],
  'bakers': ['baking', 'bakery', 'bread making', 'bread', 'pastry', 'pastries', 'baking bread', 'dough', 'bake', 'baked goods'],
  'beekeepers': ['bees', 'beekeeping', 'honey', 'apiary', 'hives', 'honey bees', 'bee keeper', 'bee keeping', 'apiarists', 'honeybees'],
  'blindness': ['blind', 'vision loss', 'sight loss', 'visually impaired', 'cannot see', 'loss of sight', 'going blind', 'sight impaired', 'vision impaired', 'blindness'],
  'breast disease': ['breast cancer', 'breast health', 'mastitis', 'breast tumors', 'breast lumps', 'mammogram', 'breast care', 'breast ailments', 'breast disease'],
  'brewers': ['brewing', 'beer', 'beer making', 'breweries', 'ale', 'ale making', 'brewing beer', 'brewmaster', 'fermentation', 'beer brewing'],
  'brides': ['bride', 'wedding', 'weddings', 'marriage', 'getting married', 'brides to be', 'engaged women', 'wedding day', 'bridal', 'bride to be'],
  'builders': ['building', 'construction', 'building trades', 'construction workers', 'carpentry', 'building houses', 'home builders', 'contractors', 'home construction'],
  'butchers': ['butchery', 'meat cutting', 'meat', 'meat cutters', 'slaughter', 'meat preparation', 'butchering', 'meat sellers', 'meat market'],
  'cancer': ['tumors', 'oncology', 'tumor', 'cancer treatment', 'chemotherapy', 'chemo', 'malignancy', 'malignant', 'cancer patients', 'carcinoma'],
  'canon lawyers': ['canon law', 'church law', 'ecclesiastical law', 'canon legal', 'church legal', 'canon law experts', 'catholic law', 'church courts'],
  'catechists': ['catechism', 'ccd', 'religious education', 'faith formation', 'ccd teachers', 'catechesis', 'catechism teachers', 'religious instruction', 'ccd classes'],
  'childbirth': ['labor', 'delivery', 'giving birth', 'birth', 'pregnant', 'contractions', 'birthing', 'labor and delivery', 'having a baby', 'child birth'],
  'children': ['kids', 'child', 'childhood', 'little ones', 'youngsters', 'pediatric', 'childrens health', 'school age', 'toddlers', 'babies'],
  'chronic pain': ['constant pain', 'persistent pain', 'ongoing pain', 'pain management', 'chronic suffering', 'long term pain', 'chronic pain syndrome', 'pain relief', 'chronic ache', 'intractable pain'],
  'church reform': ['reforming the church', 'church renewal', 'ecclesiastical reform', 'renewing the church', 'church changes', 'church improvement', 'church revitalization', 'church reform'],
  'church unity': ['christian unity', 'ecumenism', 'unity of christians', 'ecumenical', 'church reunion', 'christian reunion', 'unity of the churches', 'church unity', 'christian reconciliation', 'church fellowship'],
  'cobblers': ['cobbling', 'shoe making', 'shoe repair', 'shoemakers', 'shoes', 'shoe makers', 'shoe fixing', 'leather work', 'cobbler', 'shoemaker'],
  'computer users': ['computers', 'computing', 'computer work', 'using computers', 'pc users', 'screen time', 'computer screens', 'laptops', 'typing', 'desktop computers'],
  'confessors': ['confession', 'confessor', 'sacramental confession', 'confessing', 'reconciliation', 'penance', 'confessional', 'confessing sins', 'sacrament of confession', 'absolution'],
  'contemplation': ['contemplative prayer', 'meditation', 'contemplative', 'meditating', 'prayerful meditation', 'contemplative life', 'quiet prayer', 'silent prayer', 'reflecting', 'contemplating'],
  'contemplatives': ['contemplative life', 'contemplative', 'contemplative prayer', 'contemplative orders', 'meditation', 'prayerful life', 'religious life', 'contemplative religious', 'contemplative spirituality', 'inner life'],
  'conversion': ['converting', 'convert', 'change of heart', 'turning to god', 'faith conversion', 'religious conversion', 'converting to catholicism', 'spiritual conversion', 'coming to faith', 'conversion of heart'],
  'converts': ['convert', 'converted', 'new converts', 'new catholics', 'converts to catholicism', 'new christians', 'converted catholics', 'converts to the faith', 'neophytes', 'new believers'],
  'cooks': ['cooking', 'chefs', 'cook', 'kitchen', 'food preparation', 'culinary', 'culinary arts', 'cooking food', 'making meals', 'chef'],
  'dancers': ['dancing', 'dance', 'ballet', 'ballroom dancing', 'performance dance', 'choreography', 'dance performance', 'dance artists', 'ballet dancers', 'dancer'],
  'dentistry': ['dentists', 'dentist', 'teeth', 'dental', 'dental care', 'dental work', 'tooth care', 'oral health', 'cavities', 'dental hygiene'],
  'difficult marriages': ['marriage problems', 'troubled marriage', 'marriage difficulties', 'marriage struggles', 'struggling marriage', 'marital problems', 'marriage issues', 'marriage crisis', 'marital conflict', 'hard marriage'],
  'divorced people': ['divorce', 'divorced', 'divorcee', 'divorced catholics', 'divorced persons', 'divorce recovery', 'after divorce', 'going through divorce', 'separated', 'divorce support'],
  'earthquakes': ['earthquake', 'quakes', 'seismic activity', 'tremors', 'earth quakes', 'seismic events', 'earthquake disaster', 'earth quake', 'temblors', 'seismic'],
  'ecology': ['environment', 'ecological', 'environmental', 'eco', 'conservation', 'green', 'sustainability', 'environmentalism', 'eco friendly', 'ecosystem'],
  'engaged couples': ['engaged', 'engagement', 'getting married', 'engaged to be married', 'engagement period', 'pre cana', 'marriage preparation', 'preparing for marriage', 'betrothed', 'engaged couples'],
  'england': ['english', 'britain', 'english catholics', 'uk', 'british', 'england catholics', 'great britain', 'united kingdom', 'english christians', 'anglican convert'],
  'environment': ['environmental', 'ecology', 'conservation', 'environmentalism', 'green', 'nature', 'environmental protection', 'eco', 'environmental care', 'natural environment'],
  'europe': ['european', 'european catholics', 'europe catholics', 'european countries', 'european union', 'eu', 'european christians', 'europeans', 'continental europe', 'european nations'],
  'expectant mothers': ['pregnancy', 'childbirth', 'expecting', 'pregnant', 'expecting a baby', 'moms to be', 'pregnant women', 'expecting mothers', 'expectant moms', 'prenatal'],
  'eye diseases': ['eye problems', 'eye disease', 'eye health', 'vision problems', 'eye conditions', 'eye disorders', 'ophthalmology', 'eye ailments', 'eyesight problems', 'vision issues'],
  'families': ['family', 'family life', 'family members', 'family issues', 'family problems', 'household', 'relatives', 'family concerns', 'family struggles', 'family matters'],
  'farmers': ['farming', 'agriculture', 'farm', 'farm workers', 'farming life', 'agricultural workers', 'farm life', 'farming community', 'crops', 'ranchers'],
  'fathers': ['father', 'dads', 'fatherhood', 'parenting fathers', 'daddies', 'fathering', 'fatherly', 'being a dad', 'dad', 'fathers and children'],
  'firefighters': ['fire fighters', 'fire fighting', 'fire', 'firemen', 'fire rescue', 'fire department', 'fighting fires', 'fire service', 'firefighter', 'fire brigade'],
  'first communicants': ['first communion', 'communion', 'holy communion', 'first communion prep', 'first communion children', 'communion preparation', 'first eucharist', 'first communion kids', 'first communicant', 'eucharist'],
  'lost items': ['lost keys', 'missing things', 'misplaced objects', 'lost stuff', 'lost property', 'missing items', 'lost belongings', 'cant find', 'misplaced', 'lost and found'],
  'travelers': ['travel', 'journeys', 'trips', 'traveling', 'travelers', 'voyages', 'traveling abroad', 'road trips', 'tourists', 'traveling safely'],
  'soldiers': ['military', 'armed forces', 'army', 'soldiers', 'troops', 'infantry', 'military service', 'service members', 'veterans', 'warfighters'],
  'impossible causes': ['hopeless causes', 'desperate situations', 'impossible situations', 'lost causes', 'hopeless cases', 'desperate causes', 'no hope', 'impossible problems', 'hopeless', 'desperate'],
  'students': ['studies', 'exams', 'learning', 'school', 'pupils', 'studying', 'test taking', 'college students', 'schoolwork', 'academic success'],
  'sick children': ['sick kids', 'ill children', 'sick children', 'sick little ones', 'childrens illness', 'kids health', 'sick toddlers', 'sick babies', 'ill kids', 'hospitalized children'],
  'mental illness': ['depression', 'mental health', 'mental illness', 'anxiety disorders', 'bipolar', 'schizophrenia', 'mental health struggles', 'psychiatric', 'mental disorders', 'mental wellness'],
};

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
