
import * as httpEdge from '../cli-httpRequest';
// import * as error from './ew-error';
import * as fs from 'fs';
const EDGEWORKERS_API_BASE = '/edgeworkers/v1';

export function getAllVersions(ewId: string , accountKey: string) {
    httpEdge.setAccountKey(accountKey);
    return httpEdge.getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/versions`).then(r => r.body);
  }