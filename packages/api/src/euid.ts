export const BOOK_CODES = [
  'GN','EX','LV','NU','DT','JS','JG','RT','S1','S2','K1','K2','C1','C2','EZ',
  'NE','ES','JB','PS','PR','EC','SS','IS','JE','LA','EK','DA','HO','JL','AM',
  'OB','JH','MI','NA','HA','ZP','HG','ZC','ML','MT','MK','LK','JN','AC','RO',
  'CO1','CO2','GA','EP','PH','CL','TH1','TH2','TI1','TI2','TT','PM','HE','JA',
  'PE1','PE2','JN1','JN2','JN3','JU','RE',
] as const;

export type BookCode = (typeof BOOK_CODES)[number];

const VERSE_EUID = /^[A-Z]{1,3}\d?-\d{3}-\d{3}$/;
const WORD_EUID = /^[A-Z]{1,3}\d?-\d{3}-\d{3}-W\d{4}$/;
const ENTITY_EUID = /^(PER|PLC|EVT|MAC|MH|PRO|CMD)-[A-Za-z0-9_]+$/;

export function isValidVerseEuid(euid: string): boolean {
  return VERSE_EUID.test(euid);
}

export function isValidWordEuid(euid: string): boolean {
  return WORD_EUID.test(euid);
}

export function isValidEntityEuid(euid: string): boolean {
  return ENTITY_EUID.test(euid);
}

export function isValidBookCode(code: string): code is BookCode {
  return (BOOK_CODES as readonly string[]).includes(code);
}

export function parseVerseEuid(
  euid: string,
): { book: string; chapter: number; verse: number } | null {
  if (!isValidVerseEuid(euid)) return null;
  const [book, chapter, verse] = euid.split('-');
  return { book, chapter: Number(chapter), verse: Number(verse) };
}
