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
import { getStateLabel, inferStateKeyFromDistricts } from '.';

test('returns the display label for a state map key', () => {
  expect(getStateLabel('negeri_sembilan')).toBe('Negeri Sembilan');
});

test('infers a state from a filtered set of its districts', () => {
  expect(inferStateKeyFromDistricts(['Kuching', 'Sibu'])).toBe('sarawak');
});

test('matches district names without case or surrounding whitespace', () => {
  expect(inferStateKeyFromDistricts(['  KOTA KINABALU  '])).toBe('sabah');
});

test('ignores unknown district aliases when known districts identify one state', () => {
  expect(inferStateKeyFromDistricts(['Tangkak', 'Johor Bahru'])).toBe('johor');
});

test('does not infer a state from districts belonging to different states', () => {
  expect(inferStateKeyFromDistricts(['Petaling', 'Kuching'])).toBeUndefined();
});

test('does not infer a state from an empty result', () => {
  expect(inferStateKeyFromDistricts([])).toBeUndefined();
});

test('does not infer a state when no district matches the map metadata', () => {
  expect(inferStateKeyFromDistricts(['Unknown district'])).toBeUndefined();
});
