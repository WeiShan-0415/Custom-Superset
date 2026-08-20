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
import kuala_lumpur from './kuala_lumpur.geojson';
import labuan from './labuan.geojson';
import malacca from './malacca.geojson';
import negeri_sembilan from './negeri_sembilan.geojson';
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
  kuala_lumpur,
  labuan,
  malacca,
  negeri_sembilan,
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
  no_map: 'No map',
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

// Kept as lightweight metadata so a dashboard filter can select the map even
// when the query only returns district and metric columns.
const districtsByState: Record<string, readonly string[]> = {
  johor: [
    'Segamat',
    'Ledang',
    'Muar',
    'Batu Pahat',
    'Kluang',
    'Kulaijaya',
    'Pontian',
    'Johor Bahru',
    'Kota Tinggi',
    'Mersing',
  ],
  kedah: [
    'Bandar Baharu',
    'Kulim',
    'Baling',
    'Kuala Muda',
    'Yan',
    'Pendang',
    'Sik',
    'Kota Setar',
    'Pokok Sena',
    'Padang Terap',
    'Kubang Pasu',
    'Langkawi',
  ],
  kelantan: [
    'Tumpat',
    'Kota Bharu',
    'Pasir Puteh',
    'Pasir Mas',
    'Machang',
    'Tanah Merah',
    'Jeli',
    'Kuala Krai',
    'Kecil Lojing',
    'Gua Musang',
    'Bachok',
  ],
  kuala_lumpur: ['Kuala Lumpur'],
  labuan: ['Labuan'],
  malacca: ['Alor Gajah', 'Melaka Tengah', 'Jasin'],
  negeri_sembilan: [
    'Jelebu',
    'Jempol',
    'Kuala Pilah',
    'Rembau',
    'Tampin',
    'Seremban',
    'Port Dickson',
  ],
  pahang: [
    'Cameron Highlands',
    'Lipis',
    'Jerantut',
    'Raub',
    'Kuantan',
    'Temerloh',
    'Maran',
    'Pekan',
    'Bentong',
    'Bera',
    'Rompin',
  ],
  penang: [
    'Seberang Perai Selatan',
    'Seberang Perai Tengah',
    'Seberang Perai Utara',
    'Barat Daya',
    'Timur Laut',
  ],
  perak: [
    'Hulu Perak',
    'Selama',
    'Kerian',
    'Larut dan Matang',
    'Kuala Kangsar',
    'Kampar',
    'Kinta',
    'Perak Tengah',
    'Hilir Perak',
    'Muallim',
    'Batang Padang',
    'Bagan Datuk',
    'Manjung',
  ],
  perlis: ['Perlis'],
  putrajaya: ['Putrajaya'],
  sabah: [
    'Sipitang',
    'Tenom',
    'Beaufort',
    'Kuala Penyu',
    'Nabawan / Persiangan',
    'Keningau',
    'Papar',
    'Putatan',
    'Tambunan',
    'Penampang',
    'Kota Kinabalu',
    'Tuaran',
    'Kota Belud',
    'Ranau',
    'Kota Marudu',
    'Kudat',
    'Kalabakan',
    'Tawau',
    'Kunak',
    'Semporna',
    'Lahad Datu',
    'Tongod',
    'Kinabatangan',
    'Sandakan',
    'Telupid',
    'Beluran',
    'Pitas',
  ],
  sarawak: [
    'Lundu',
    'Bau',
    'Kuching',
    'Samarahan',
    'Asajaya',
    'Tebedu',
    'Serian',
    'Simunjan',
    'Sri Aman',
    'Betong',
    'Pusa',
    'Saratok',
    'Kabong',
    'Sarikei',
    'Pakan',
    'Lubok Antu',
    'Julau',
    'Maradong',
    'Kanowit',
    'Sibu',
    'Song',
    'Selangau',
    'Dalat',
    'Kapit',
    'Tatau',
    'Mukah',
    'Matu',
    'Daro',
    'Bintulu',
    'Sebauh',
    'Bukit Mabong',
    'Belaga',
    'Beluru',
    'Subis',
    'Miri',
    'Telang Usan',
    'Marudi',
    'Lawas',
    'Limbang',
    'Tanjung Manis',
  ],
  selangor: [
    'Sabak Bernam',
    'Kuala Selangor',
    'Hulu Selangor',
    'Sepang',
    'Klang',
    'Kuala Langat',
    'Petaling',
    'Gombak',
    'Hulu Langat',
  ],
  terengganu: [
    'Hulu Terengganu',
    'Setiu',
    'Kuala Terengganu',
    'Dungun',
    'Kemaman',
    'Besut',
    'Kuala Nerus',
    'Marang',
  ],
};

export const stateOptions: [string, string][] = [
  ['no_map', stateLabels.no_map],
  ...Object.keys(states)
    .map((key): [string, string] => [key, stateLabels[key]])
    .sort((a, b) => a[1].localeCompare(b[1])),
];

// Alternate names for states whose district data key doesn't match every
// common spelling (e.g. the Malay name, or the name without its English
// parenthetical).
const STATE_ALIASES: Record<string, string> = {
  melaka: 'malacca',
  'pulau pinang': 'penang',
};

// Matches a free-text state value (e.g. from a "state_name" data column)
// to one of the state keys above, trying an exact key match, a known
// alias, then a case-insensitive label match. Returns undefined if none
// of the 16 states match.
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

export function inferStateKeyFromDistricts(
  districts: readonly string[],
): string | undefined {
  const normalizedDistricts = Array.from(
    new Set(districts.map(value => value.trim().toLowerCase()).filter(Boolean)),
  );
  if (normalizedDistricts.length === 0) return undefined;

  const matchedStates = new Set<string>();
  Object.entries(districtsByState).forEach(([state, stateDistricts]) => {
    const districtSet = new Set(
      stateDistricts.map(value => value.toLowerCase()),
    );
    if (normalizedDistricts.some(value => districtSet.has(value))) {
      matchedStates.add(state);
    }
  });

  return matchedStates.size === 1 ? Array.from(matchedStates)[0] : undefined;
}

export default states;
