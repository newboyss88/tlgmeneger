
import { translations } from './src/lib/i18n/translations';

const uzKeys = Object.keys(translations.uz);
const ruKeys = Object.keys(translations.ru);
const enKeys = Object.keys(translations.en);

console.log('uz keys:', uzKeys.length);
console.log('ru keys:', ruKeys.length);
console.log('en keys:', enKeys.length);

const missingInRu = uzKeys.filter(k => !ruKeys.includes(k));
const missingInEn = uzKeys.filter(k => !enKeys.includes(k));

console.log('Missing in ru:', missingInRu);
console.log('Missing in en:', missingInEn);
