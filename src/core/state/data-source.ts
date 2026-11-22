import { asyncStorageAdapter } from '@/core/storage/async-storage.adapter';
export type DataSource = 'http' | 'mock';
const KEY = 'rotauni.motorista.data-source';
let active: DataSource = process.env.EXPO_PUBLIC_DATA_SOURCE === 'mock' ? 'mock' : 'http';
export const getInitialDataSource = () => active;
export const getDataSource = () => active;
export const setDataSource = (source: DataSource) => { active = source; };
export async function loadDataSource() { const saved = await asyncStorageAdapter.get<DataSource>(KEY); if (saved === 'http' || saved === 'mock') active = saved; return active; }
export function persistDataSource(source: DataSource) { return asyncStorageAdapter.set(KEY, source); }
