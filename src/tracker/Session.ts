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

import { logger } from '../ClickstreamAnalytics';
import { StorageKeys, StorageUtil } from '../utils/StorageUtil';

const MaxUniqueIdLength = 8;

export interface SessionInfo {
	id: string;
	count: number;
	firstStartTime: number;
	lastStartTime: number;
	pausedTime: number;
	activeDuration: number;
}

export class Session {
	timeout: number;
	uniqueId: string;
	sessionInfo: SessionInfo;

	constructor(uniqueId: string, timeout: number) {
		this.uniqueId = uniqueId;
		this.timeout = timeout;

		const sessionInfoStr = StorageUtil.get(StorageKeys.SessionInfo);
		if (sessionInfoStr === '') {
			this.sessionInfo = {
				id: this.generateSessionId(uniqueId),
				count: 1,
				firstStartTime: 0,
				lastStartTime: 0,
				pausedTime: 0,
				activeDuration: 0,
			};
			this.persistSessionInfo();
		} else {
			this.sessionInfo = JSON.parse(sessionInfoStr) as SessionInfo;
		}
	}

	/**
	 * Update sessionInfo on App onShow(), there are 3 scenarios:
	 * 1) First time new session
	 * 2) Resume existing session
	 * 3) Start a new session after session timeout
	 * @return boolean whether it's a new session
	 */
	resume(): boolean {
		let isNewSession = false;
		const now = new Date().getTime();

		// First time new session
		if (this.sessionInfo.firstStartTime === 0) {
			this.sessionInfo.firstStartTime = now;
			this.sessionInfo.lastStartTime = now;
			isNewSession = true;
		} else if (now - this.sessionInfo.lastStartTime < this.timeout) {
			// Resume existing session
			this.sessionInfo.lastStartTime = now;
		} else {
			// Start a new session
			this.sessionInfo = {
				id: this.generateSessionId(this.uniqueId),
				count: this.sessionInfo.count + 1,
				firstStartTime: now,
				lastStartTime: now,
				pausedTime: 0,
				activeDuration: 0,
			};
			isNewSession = true;
		}

		this.persistSessionInfo();
		logger.info('Session resume() sessionInfo: ', this.sessionInfo);

		return isNewSession;
	}

	/**
	 * Update sessionInfo on App onHide()
	 */
	pause(): void {
		const now = new Date().getTime();
		this.sessionInfo.activeDuration += now - this.sessionInfo.lastStartTime;
		this.sessionInfo.pausedTime = now;

		this.persistSessionInfo();
		logger.info('Session pause() sessionInfo: ', this.sessionInfo);
	}

	/**
	 * Generate sessionId in the format of <last 8 chars of uniqueId>-<yyyyMMdd>-<HHmmssSSS>
	 * @param uniqueId
	 * @private
	 */
	private generateSessionId(uniqueId: string): string {
		const uniqueIdPart = uniqueId.slice(-MaxUniqueIdLength);

		const now = new Date();
		const year = now.getUTCFullYear().toString().padStart(4, '0');
		const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
		const day = now.getUTCDate().toString().padStart(2, '0');
		const hours = now.getUTCHours().toString().padStart(2, '0');
		const minutes = now.getUTCMinutes().toString().padStart(2, '0');
		const seconds = now.getUTCSeconds().toString().padStart(2, '0');
		const milliseconds = now.getUTCMilliseconds().toString().padStart(3, '0');
		const formattedTime = `${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;

		return `${uniqueIdPart}-${formattedTime}`;
	}

	/**
	 * Save sessionInfo to wxStorage
	 * @private
	 */
	private persistSessionInfo(): void {
		StorageUtil.set(StorageKeys.SessionInfo, JSON.stringify(this.sessionInfo));
	}
}
