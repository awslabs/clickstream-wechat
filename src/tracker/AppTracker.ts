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

import { BaseTracker } from './BaseTracker';
import { NotAvailable } from '../provider/ClickstreamProvider';
import { PresetEvent, ReservedAttribute } from '../provider/Event';
import { PageInfo } from '../types/PageInfo';
import { StorageKeys, StorageUtil } from '../utils/StorageUtil';

export class AppTracker extends BaseTracker {
	isFirstTime = true;

	init() {
		const originalApp: WechatMiniprogram.App.Constructor = App;
		App = app => {
			this.overwriteAppMethod(app, 'onShow', this.onAppShow.bind(this));
			this.overwriteAppMethod(app, 'onHide', this.onAppHide.bind(this));
			originalApp(app);
		};
	}

	/**
	 * Overwrite WeChat Mini Program App method
	 * @param app WMP App
	 * @param methodName method name
	 * @param customMethod overwritten method custom logic
	 * @private
	 */
	private overwriteAppMethod(
		app: WechatMiniprogram.App.Options<any>,
		methodName: string,
		customMethod: (input: any) => void
	): void {
		const originalMethod = app[methodName];
		app[methodName] = (data: any) => {
			customMethod(data);

			if (originalMethod) {
				originalMethod(data);
			}
		};
	}

	/**
	 * Overwrite App onShow() method
	 * Functionalities:
	 * 1. Create or update sessionInfo, send _session_start event for new session
	 * 2. Send _first_open event if it's first time to open the mini program
	 * 3. Send _app_start event
	 * @private
	 */
	private onAppShow(): void {
		if (this.provider.deviceAppInfo.network_type) {
			this.onAppShowActions();
		} else {
			// Wait for wx.getNetworkType() completed
			setTimeout(() => this.onAppShowActions(), 500);
		}
	}

	private onAppShowActions(): void {
		// Update sessionInfo
		const isNewSession = this.provider.session.resume();

		// Send _session_start event for new session
		if (isNewSession) {
			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.SESSION_START,
			});
		}

		// Check if it's first open
		const firstOpenRecordedStr: string = StorageUtil.get(
			StorageKeys.FirstOpenRecorded
		);
		if (firstOpenRecordedStr === '') {
			StorageUtil.set(StorageKeys.FirstOpenRecorded, 'true');

			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.FIRST_OPEN,
			});
		}

		// Send _app_start event
		this.provider.config.autoTrackAppStart &&
			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.APP_START,
				attributes: {
					[ReservedAttribute.IS_FIRST_TIME]: this.isFirstTime,
				},
			});
		if (this.isFirstTime) {
			this.isFirstTime = false;
		}
	}

	/**
	 * Overwrite App onHide() method
	 * Functionalities:
	 * 1. Update sessionInfo: set pausedTime and calculate duration
	 * 2. Send _user_engagement event
	 * 3. Send _app_end event
	 * 4. Flush immediateSendEvents and bufferedEvents in wxStorage
	 * @private
	 */
	private onAppHide(): void {
		this.provider.session.pause();

		// Retrieve last viewed page info
		const lastViewedPageStr = StorageUtil.get(StorageKeys.PageInfo);
		if (lastViewedPageStr !== '') {
			const lastPage = JSON.parse(lastViewedPageStr) as PageInfo;

			if (lastPage.id !== NotAvailable && lastPage.timestamp !== 0) {
				// Send _user_engagement event
				this.provider.config.autoTrackUserEngagement &&
					this.provider.eventRecorder.sendEvent({
						name: PresetEvent.USER_ENGAGEMENT,
						attributes: {
							[ReservedAttribute.SCREEN_ID]: lastPage.id,
							[ReservedAttribute.SCREEN_ROUTE]: lastPage.route,
							[ReservedAttribute.SCREEN_NAME]: lastPage.name,
							[ReservedAttribute.ENGAGEMENT_TIMESTAMP]:
								new Date().getTime() - lastPage.timestamp,
							[ReservedAttribute.PREVIOUS_SCREEN_ID]: undefined,
							[ReservedAttribute.PREVIOUS_SCREEN_ROUTE]: undefined,
							[ReservedAttribute.PREVIOUS_SCREEN_NAME]: undefined,
						},
					});

				// Set PageInfo.timestamp to 0 to indicate that this page has _user_engagement event recorded
				lastPage.timestamp = 0;
				StorageUtil.set(StorageKeys.PageInfo, JSON.stringify(lastPage));
			}
		}

		// Send _app_end event
		this.provider.config.autoTrackAppEnd &&
			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.APP_END,
			});

		// Flush events in wxStorage
		setTimeout(() => {
			this.provider.eventRecorder.flushImmediateEvents();
			this.provider.eventRecorder.flushBufferedEvents();
		}, 500);
	}
}
