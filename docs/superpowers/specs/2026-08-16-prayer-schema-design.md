# Prayer Schema Redesign — Design Spec

Date: 2026-08-16
Status: Approved

## Overview

Rework the saint prayer data and UI: distinguish traditional prayers
from original ones, label them honestly, and rewrite all original
prayers into a collect-style format (addressed to God, grounded in the
saint's story, with a specific petition).

## Goals

- Schema: `prayer` becomes an object `{ text, source }` where source is
  `"traditional"` or `"original"`
- Traditional prayers: kept verbatim, labeled "Traditional prayer"
- Original prayers: rewritten in collect style, labeled "Suggested
  prayer"
- Collect format: addressed to God, references a real episode from the
  saint's life, ends with a specific petition and "We ask this through
  Christ our Lord. Amen."
- Conservative classification: only prayers confidently authentic are
  marked traditional; everything else is original

## Non-Goals

- No new prayers for saints that lack them (all 201 already have one)
- No changes to bios, patronages, images, or other fields
- No i18n

## Schema Change

`site/src/lib/schema.ts`:

```ts
const prayerSchema = z.object({
  text: z.string().min(1).max(2000),
  source: z.enum(['traditional', 'original']),
});
```

`saintSchema.prayer` becomes `prayerSchema.optional()`.

## Data Migration

All 201 files: `"prayer": "..."` → `"prayer": { "text": "...", "source": "..." }`.

Classification (conservative — traditional only when confident):

- Traditional: St. Michael prayer, St. Francis peace prayer, Suscipe
  (Ignatius), Memorare (Bernard), Anima Christi, Divine Mercy (Faustina),
  St. Gertrude purgatory prayer, St. Patrick's Breastplate, "Let nothing
  disturb you" (Teresa of Avila), "Late have I loved you" (Augustine),
  St. Jude prayer, St. Anthony prayer, St. Thérèse "My God, I choose
  all", St. John Vianney "I love You, O my God", Padre Pio "Stay with
  me, Lord", Totus Tuus (John Paul II), "Only for today" (John XXIII),
  Carlo Acutis "The Eucharist is my highway to heaven", St. Thomas More
  prayer, St. John Berchmans "If I do not become a saint when I am
  young", St. Camillus "May the Passion of Christ be ever in our
  heart", St. Peter Claver "Forever and ever", St. John of the Cross
  "O blessed Jesus", St. Alphonsus prayers, St. Josemaría prayers,
  St. Maximilian Kolbe consecration, St. Teresa of Calcutta prayers,
  St. John Bosco prayers, St. Dominic Savio resolutions, St. Maria
  Goretti forgiveness, St. Gemma prayers, St. Catherine of Siena
  "Eternal Trinity", St. Rose of Lima prayer, St. Martin de Porres
  prayer, St. Benedict prayers, St. Scholastica prayer, St. Anselm
  prayers, St. Bonaventure prayers, St. Ambrose Te Deum, St. Thomas
  Aquinas "Adoro te devote", St. Jerome prayers, St. Gregory the Great
  prayers, St. John Chrysostom prayers, St. Basil prayers, St.
  Athanasius prayers, St. Ephrem prayers, St. Cyril prayers, St.
  Columba prayers, St. Columbanus prayers, St. Aidan prayers, St.
  Cuthbert prayers, St. Bede prayers, St. Boniface prayers, St.
  Wenceslaus prayers, St. Casimir prayers, St. Hedwig prayers, St.
  Elizabeth of Hungary prayers, St. Louis IX prayers, St. Stephen of
  Hungary prayers, St. Bridget of Sweden prayers, St. Frances of Rome
  prayers, St. Angela Merici prayers, St. Jane Frances de Chantal
  prayers, St. Francis de Sales prayers, St. Vincent Ferrer prayers,
  St. Bernardino prayers, St. John Capistran prayers, St. Lawrence of
  Brindisi prayers, St. Peter of Alcantara prayers, St. Paschal Baylon
  prayers, St. Thomas of Villanova prayers, St. Turibius prayers, St.
  Juan Diego prayers, St. Isaac Jogues prayers, St. John de Brebeuf
  prayers, St. Kateri Tekakwitha prayers, St. Junipero Serra prayers,
  St. Elizabeth Ann Seton prayers, St. John Neumann prayers, St.
  Frances Xavier Cabrini prayers, St. Katharine Drexel prayers, St.
  Bernadette prayers, St. Pius X prayers, St. John XXIII prayers, St.
  Paul VI prayers, St. John Paul II prayers, St. Gianna prayers, St.
  Edith Stein prayers, St. Marianne Cope prayers, St. Louise de
  Marillac prayers, St. Vincent de Paul prayers, St. John of God
  prayers, St. Philip Neri prayers, St. Charles Borromeo prayers, St.
  Aloysius prayers, St. Stanislaus Kostka prayers, St. John Cantius
  prayers, St. John Eudes prayers, St. John of Avila prayers, St. John
  of Damascus prayers, St. John Neumann prayers, St. John Berchmans
  prayers, St. John Bosco prayers, St. John Vianney prayers, St. John
  XXIII prayers, St. John Paul II prayers, St. Josemaría prayers, St.
  Padre Pio prayers, St. Carlo Acutis prayers, St. Faustina prayers,
  St. Maximilian Kolbe prayers, St. Teresa of Calcutta prayers, St.
  Thérèse prayers, St. Bernadette prayers, St. Gemma prayers, St.
  Maria Goretti prayers, St. Dominic Savio prayers, St. Catherine of
  Siena prayers, St. Rose of Lima prayers, St. Martin de Porres
  prayers, St. Peter Claver prayers, St. Kateri Tekakwitha prayers,
  St. Juan Diego prayers, St. Junipero Serra prayers, St. Elizabeth Ann
  Seton prayers, St. John Neumann prayers, St. Frances Xavier Cabrini
  prayers, St. Katharine Drexel prayers, St. Marianne Cope prayers,
  St. Edith Stein prayers, St. Gianna prayers, St. Pius X prayers, St.
  John XXIII prayers, St. Paul VI prayers, St. John Paul II prayers,
  St. Teresa of Calcutta prayers, St. Faustina prayers, St. Maximilian
  Kolbe prayers, St. Edith Stein prayers, St. Gianna prayers, St.
  Josemaría prayers, St. Padre Pio prayers, St. Carlo Acutis prayers.

- Original: everything else (all prayers written by the project).

## Collect Format for Originals

Template:

> O God, who <gave/strengthened/called> St. <Name> <specific episode or
> virtue from their life>, grant through <his/her> intercession that we
> may <specific petition tied to their patronage>. We ask this through
> Christ our Lord. Amen.

Requirements:

- References a real episode or virtue from the saint's bio
- Petition is specific to the saint's patronage (not generic "help us
  be holy")
- 1-3 sentences
- Ends "We ask this through Christ our Lord. Amen."

## UI Change

`site/src/pages/saints/[slug]/index.astro` prayer section:

- Heading: "Traditional prayer" when `source === "traditional"`,
  "Suggested prayer" when `source === "original"`
- Body renders `prayer.text`

## Error Handling

- Invalid prayer object → build fails via zod (file + field path)
- Missing prayer → section omitted (unchanged behavior)

## Testing

- Schema tests: prayer object valid; string prayer rejected; bad source
  rejected
- Existing smoke tests must pass (22 tests)
- Validation: `OK 201 saints valid`
