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

import { wx_uuid } from './helper';

const namespace: string = 'aws-solution/clickstream/';
export const StorageKeys = {
	DeviceId: `${namespace}deviceId`,
	FirstOpenRecorded: `${namespace}firstOpenRecorded`,
	SessionInfo: `${namespace}sessionInfo`,
	UserInfo: `${namespace}userInfo`,
	PageInfo: `${namespace}pageInfo`,
	ImmediateEvents: `${namespace}immediateEvents`,
	BufferedEvents: `${namespace}bufferedEvents`,
	SequenceId: `${namespace}sequenceId`,
};

export class StorageUtil {
	/**
	 * Get wxStorage value by key
	 * @param key key in StorageKeys
	 */
	static get(key: string): any {
		return wx.getStorageSync(key);
	}

	/**
	 * Set wxStorage value by key
	 * @param key key in StorageKeys
	 * @param value data of Primitive type, Date or JSON.stringify() object
	 */
	static set(key: string, value: any): void {
		wx.setStorageSync(key, value);
	}

	/**
	 * Get deviceId from wxStorage, set to a new uuid if not exists
	 */
	static getDeviceId(): string {
		let deviceId: string = wx.getStorageSync(StorageKeys.DeviceId) ?? '';
		if (deviceId === '') {
			deviceId = wx_uuid();
			wx.setStorageSync(StorageKeys.DeviceId, deviceId);
		}

		return deviceId;
	}
}
