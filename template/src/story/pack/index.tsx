/* Без стилевого пакета: все слоты пустые, ролик собирается стандартными блоками шаблона.
   tools/reel_prep.py (этап pack) перезаписывает этот файл, если у проекта есть стилевой пакет. */
import type {Pack} from './types';

export const PACK: Pack = {name: '', version: 0, settings: {}};
