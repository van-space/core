import { homedir } from 'os';
import { join } from 'path';
import { isDev } from '~/utils/index.util';

export const HOME = homedir();

export const TEMP_DIR = isDev ? join(__dirname, '../tmp') : '/tmp/mx-space';

export const DATA_DIR = isDev
  ? join(__dirname, '../tmp')
  : join(HOME, '.mx-space');

export const LOGGER_DIR = join(DATA_DIR, 'log');
