import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');

const TRADITIONAL_OPENINGS = [
  'St. Michael the Archangel, defend us',
  'Lord, make me an instrument',
  'Take, Lord, and receive',
  'Remember, O most gracious Virgin Mary',
  'Soul of Christ, sanctify me',
  'You expired, Jesus',
  'Eternal Father, I offer You',
  'Christ with me',
  'Let nothing disturb you',
  'Late have I loved you',
  'Most holy Apostle, St. Jude',
  'O Holy St. Anthony',
  'My God, I choose all',
  'I love You, O my God',
  'Stay with me, Lord',
  'Totus Tuus',
  'Only for today',
  'The Eucharist is my highway to heaven',
  'Give me the grace, good Lord',
  'If I do not become a saint when I am young',
  'May the Passion of Christ be ever in our heart',
  'Forever and ever',
  'O blessed Jesus',
  'O God, who didst give to blessed',
  'O glorious St. Joseph',
  'Hail, glorious St. Patrick',
  'O glorious Prince of the heavenly host',
  'O glorious St. Anne',
  'O glorious St. Monica',
  'O glorious St. Martha',
  'O glorious St. Peter',
  'O glorious St. Paul',
  'O glorious St. Luke',
  'O glorious St. Matthew',
  'O glorious St. John the Baptist',
  'O glorious St. Mary Magdalene',
  'O glorious St. Cecilia',
  'O glorious St. Agnes',
  'O glorious St. Agatha',
  'O glorious St. Lucy',
  'O glorious St. Catherine',
  'O glorious St. Barbara',
  'O glorious St. Margaret',
  'O glorious St. Dorothy',
  'O glorious St. Anastasia',
  'O glorious St. Euphemia',
  'O glorious St. Thecla',
  'O glorious St. Pelagia',
  'O glorious St. Mary of Egypt',
  'O glorious St. Thais',
  'O glorious St. Moses the Black',
  'O glorious St. Onuphrius',
  'O glorious St. Paul the Hermit',
  'O glorious St. Hilarion',
  'O glorious St. Chariton',
  'O glorious St. Euthymius',
  'O glorious St. Sabbas',
  'O glorious St. Theodosius',
  'O glorious St. Daniel the Stylite',
  'O glorious St. Alypius',
  'O glorious St. Maron',
  'O glorious St. John Climacus',
  'O glorious St. Maximus the Confessor',
  'O glorious St. Sophronius',
  'O glorious St. Andrew of Crete',
  'O glorious St. John Damascene',
  'O glorious St. Theodore the Studite',
  'O glorious St. Nicephorus',
  'O glorious St. Methodius',
  'O glorious St. Cyril',
  'O glorious St. Clement of Ohrid',
  'O glorious St. Naum',
  'O glorious St. Sava',
  'O glorious St. Simeon',
  'O glorious St. Stephen of Hungary',
  'O glorious St. Ladislaus',
  'O glorious St. Emeric',
  'O glorious St. Margaret of Hungary',
  'O glorious St. Kinga',
  'O glorious St. Hedwig',
  'O glorious St. Stanislaus',
  'O glorious St. Adalbert',
  'O glorious St. John Nepomucene',
  'O glorious St. Wenceslaus',
  'O glorious St. Ludmila',
  'O glorious St. Procopius',
  'O glorious St. Agnes of Bohemia',
  'O glorious St. Zdislava',
  'O glorious St. John Sarkander',
  'O glorious St. Andrew Bobola',
  'O glorious St. Josaphat',
  'O glorious St. Casimir',
  'O glorious St. Hyacinth',
  'O glorious St. Stanislaus Kostka',
  'O glorious St. John Cantius',
  'O glorious St. Faustina',
  'O glorious St. Maximilian Kolbe',
  'O glorious St. Edith Stein',
  'O glorious St. John Paul II',
  'O glorious St. Teresa of Calcutta',
  'O glorious St. Padre Pio',
  'O glorious St. Carlo Acutis',
  'O glorious St. Josemaria Escriva',
  'O glorious St. Gianna Beretta Molla',
  'O glorious St. John XXIII',
  'O glorious St. Paul VI',
  'O glorious St. Pius X',
  'O glorious St. John Bosco',
  'O glorious St. Dominic Savio',
  'O glorious St. Maria Goretti',
  'O glorious St. Gemma Galgani',
  'O glorious St. Therese of Lisieux',
  'O glorious St. Bernadette',
  'O glorious St. John Vianney',
  'O glorious St. Catherine Laboure',
  'O glorious St. Margaret Mary Alacoque',
  'O glorious St. Claude de la Colombiere',
  'O glorious St. Louis de Montfort',
  'O glorious St. Alphonsus Liguori',
  'O glorious St. Gerard Majella',
  'O glorious St. Paul of the Cross',
  'O glorious St. Camillus de Lellis',
  'O glorious St. John of God',
  'O glorious St. Vincent de Paul',
  'O glorious St. Louise de Marillac',
  'O glorious St. Elizabeth Ann Seton',
  'O glorious St. John Neumann',
  'O glorious St. Katharine Drexel',
  'O glorious St. Frances Xavier Cabrini',
  'O glorious St. Rose Philippine Duchesne',
  'O glorious St. Theodore Guerin',
  'O glorious St. Junipero Serra',
  'O glorious St. Kateri Tekakwitha',
  'O glorious St. Juan Diego',
  'O glorious St. Martin de Porres',
  'O glorious St. Rose of Lima',
  'O glorious St. Turibius',
  'O glorious St. Peter Claver',
  'O glorious St. Josephine Bakhita',
  'O glorious St. Charles Lwanga',
  'O glorious St. Paul Miki',
  'O glorious St. Andrew Kim Taegon',
  'O glorious St. Lorenzo Ruiz',
  'O glorious St. Pedro Calungsod',
  'O glorious St. Oscar Romero',
  'O glorious St. Damien of Molokai',
  'O glorious St. Marianne Cope',
  'O glorious St. Peter Chanel',
  'O glorious St. John de Brebeuf',
  'O glorious St. Isaac Jogues',
  'O glorious St. Rene Goupil',
  'O glorious St. Jean de Lalande',
  'O glorious St. Noel Chabanel',
  'O glorious St. Charles Garnier',
  'O glorious St. Antoine Daniel',
  'O glorious St. Gabriel Lalemant',
];

const args = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
});

function isTraditional(text: string): boolean {
  const t = text.trim().toLowerCase();
  return TRADITIONAL_OPENINGS.some((o) => t.startsWith(o.toLowerCase()));
}

function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  let converted = 0;
  let traditional = 0;
  let original = 0;
  let skipped = 0;

  for (const f of files) {
    const path = join(SAINTS_DIR, f);
    const saint = JSON.parse(readFileSync(path, 'utf-8'));
    if (typeof saint.prayer !== 'string') {
      skipped++;
      continue;
    }
    const source = isTraditional(saint.prayer) ? 'traditional' : 'original';
    const prayer = { text: saint.prayer, source };
    if (args.values['dry-run']) {
      console.log(`[dry-run] ${f}: ${source}`);
    } else {
      saint.prayer = prayer;
      writeFileSync(path, JSON.stringify(saint, null, 2) + '\n');
    }
    converted++;
    source === 'traditional' ? traditional++ : original++;
  }

  console.log(`Done: ${converted} converted (${traditional} traditional, ${original} original), ${skipped} skipped.`);
}

main();
