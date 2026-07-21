import type { AppState } from '../types';
import { getSeedState } from '../data/seedData';

export const initialState: AppState = getSeedState();
