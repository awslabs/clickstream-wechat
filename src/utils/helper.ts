/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import * as CryptoJS from 'crypto-js';

/**
 * Generate uuid
 */
export const wx_uuid = () => {
	const hexDigits = '0123456789abcdef';
	let uuid = '';

	for (let i = 0; i < 32; i++) {
		uuid += hexDigits[Math.floor(Math.random() * 16)];
	}

	// Insert hyphens to conform to UUID format
	uuid =
		uuid.substr(0, 8) +
		'-' +
		uuid.substr(8, 4) +
		'-' +
		'4' + // Version 4 UUID
		uuid.substr(12, 3) +
		'-' +
		hexDigits[Math.floor(Math.random() * 4) + 8] + // Variant
		uuid.substr(15, 3) +
		'-' +
		uuid.substr(18);

	return uuid;
};

/**
 * Generate hash code
 * @param data
 */
export const wx_hashcode = (data: string): string => {
	return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex).substring(0, 8);
};

declare const __wxConfig: any;
/**
 * Get page title from __wxConfig global variable
 * @param route
 */
export const wx_getPageTitle = (route: string): string => {
	const fullPath: string = route + '.html';
	if (__wxConfig && __wxConfig.page) {
		return __wxConfig.page[fullPath]?.window?.navigationBarTitleText || '';
	}

	return '';
};

/**
 * Convert an object to query string
 * @param params
 */
export const objectToQueryString = (params: Record<string, any>) => {
	const query = [];

	for (const key in params) {
		const value = params[key];
		if (value !== undefined && value !== null) {
			query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	}

	return query.join('&');
};

/**
 * Generate a random integer between <min> and <max> (inclusive)
 * @param min
 * @param max
 */
export const getRandomInt = (min: number, max: number): number => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
