// Отдельная точка входа стенда превью блоков: npx remotion bundle src/blocks/entry.ts
import {registerRoot} from 'remotion';
import {Previews} from './previews';
registerRoot(Previews);
