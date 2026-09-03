/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import johor from './johor.geojson';
import kedah from './kedah.geojson';
import kelantan from './kelantan.geojson';
import kualaLumpur from './kuala_lumpur.geojson';
import labuan from './labuan.geojson';
import malacca from './malacca.geojson';
import negeriSembilan from './negeri_sembilan.geojson';
import pahang from './pahang.geojson';
import penang from './penang.geojson';
import perak from './perak.geojson';
import perlis from './perlis.geojson';
import putrajaya from './putrajaya.geojson';
import sabah from './sabah.geojson';
import sarawak from './sarawak.geojson';
import selangor from './selangor.geojson';
import terengganu from './terengganu.geojson';

// Each entry maps a state key to the URL of its district-level boundary
// GeoJSON (webpack resolves `*.geojson` imports to asset URLs, fetched
// on demand at render time rather than bundled into the JS payload).
const states: Record<string, string> = {
  johor,
  kedah,
  kelantan,
  kuala_lumpur: kualaLumpur,
  labuan,
  malacca,
  negeri_sembilan: negeriSembilan,
  pahang,
  penang,
  perak,
  perlis,
  putrajaya,
  sabah,
  sarawak,
  selangor,
  terengganu,
};

const stateLabels: Record<string, string> = {
  johor: 'Johor',
  kedah: 'Kedah',
  kelantan: 'Kelantan',
  kuala_lumpur: 'Kuala Lumpur',
  labuan: 'Labuan',
  malacca: 'Malacca (Melaka)',
  negeri_sembilan: 'Negeri Sembilan',
  pahang: 'Pahang',
  penang: 'Penang (Pulau Pinang)',
  perak: 'Perak',
  perlis: 'Perlis',
  putrajaya: 'Putrajaya',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  selangor: 'Selangor',
  terengganu: 'Terengganu',
};

// Not a Storybook story; this file just isn't matched by the storybook
// plugin's own file glob, so it inherits the naming-convention rule.
// eslint-disable-next-line storybook/prefer-pascal-case
export const stateOptions: [string, string][] = Object.keys(states)
  .map((key): [string, string] => [key, stateLabels[key]])
  .sort((a, b) => a[1].localeCompare(b[1]));

// Alternate names for states whose data key doesn't match every common
// spelling (e.g. the Malay name, or the name without its English
// parenthetical).
const STATE_ALIASES: Record<string, string> = {
  melaka: 'malacca',
  'pulau pinang': 'penang',
  'my-01': 'johor',
  'my-02': 'kedah',
  'my-03': 'kelantan',
  'my-04': 'malacca',
  'my-05': 'negeri_sembilan',
  'my-06': 'pahang',
  'my-07': 'penang',
  'my-08': 'perak',
  'my-09': 'perlis',
  'my-10': 'selangor',
  'my-11': 'terengganu',
  'my-12': 'sabah',
  'my-13': 'sarawak',
  'my-14': 'kuala_lumpur',
  'my-15': 'labuan',
  'my-16': 'putrajaya',
};

// Matches a free-text state value (e.g. from a "state_name" data column, or
// a district GeoJSON feature's own `properties.state`) to one of the state
// keys above, trying an exact key match, a known alias (including MY state
// codes), then a
// case-insensitive label match. Returns undefined if none of the 16 states
// match.
export function normalizeStateKey(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  const key = trimmed.replace(/[\s-]+/g, '_');
  if (states[key]) return key;
  if (STATE_ALIASES[trimmed]) return STATE_ALIASES[trimmed];
  const match = Object.entries(stateLabels).find(
    ([, label]) => label.toLowerCase() === trimmed,
  );
  return match?.[0];
}

export function getStateLabel(state: string): string {
  return stateLabels[state] ?? state;
}

export default states;
