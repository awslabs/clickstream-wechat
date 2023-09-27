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

import { ErrorCode, EventLimit, PresetEvent, ReservedAttribute } from './Event';
import { logger } from '../ClickstreamAnalytics';
import packageConfig from '../config';
import { AppTracker } from '../tracker/AppTracker';
import { PageTracker } from '../tracker/PageTracker';
import { Session } from '../tracker/Session';
import {
	AnalyticsEvent,
	ClickstreamAttributes,
	ClickstreamConfiguration,
	ClickstreamEvent,
	DeviceAppInfo,
	Item,
	SendMode,
	UserInfo,
} from '../types';
import { EventRecorder } from '../utils/EventRecorder';
import { objectToQueryString, wx_uuid } from '../utils/helper';
import { StorageKeys, StorageUtil } from '../utils/StorageUtil';
import { EventError, EventValidator } from '../utils/Validator';

export const UNKNOWN = 'Unknown';
export const NotAvailable = 'N/a';

const DEFAULT_USER_INFO = {
	unique_id: wx_uuid(),
	attributes: {
		_user_first_touch_timestamp: {
			value: new Date().getTime(),
			set_timestamp: new Date().getTime(),
		},
	},
};
const PRESET_ATTRIBUTES_COUNT = 8;

export class ClickstreamProvider {
	config: ClickstreamConfiguration;
	userInfo: UserInfo;
	deviceAppInfo: DeviceAppInfo;
	session: Session;
	eventRecorder: EventRecorder;
	appTracker: AppTracker;
	pageTracker: PageTracker;

	constructor(config: ClickstreamConfiguration) {
		this.config = {
			appId: '',
			endpoint: '',
			sendMode: SendMode.Immediate,
			sendEventsInterval: 5000,
			autoTrackAppStart: true,
			autoTrackAppEnd: true,
			autoTrackPageShow: true,
			autoTrackUserEngagement: true,
			autoTrackMPShare: false,
			autoTrackMPFavorite: false,
			sessionTimeoutDuration: 1800000,
			debug: false,
			authCookie: '',
		};

		// Get user info
		const userInfoStr = StorageUtil.get(StorageKeys.UserInfo);
		if (userInfoStr === '') {
			// Set unique_id to a new UUID, persist userInfo into wxStorage
			this.userInfo = DEFAULT_USER_INFO;
			StorageUtil.set(StorageKeys.UserInfo, JSON.stringify(this.userInfo));
		} else {
			this.userInfo = JSON.parse(userInfoStr) as UserInfo;
		}

		// Get device and App info
		this.deviceAppInfo = this.getDeviceAppInfo();

		this.configure(config);
	}

	/**
	 * Configure provider on initialization and update by SDK user
	 * @param config
	 */
	configure(config: ClickstreamConfiguration): void {
		// Logger switch
		config.debug !== undefined && logger.toggleDebug(config.debug);

		// Check if appId and endpoint are undefined or empty
		if (!config.appId || !config.endpoint) {
			logger.error('appId and endpoint are required in the configuration');
			return;
		}
		Object.assign(this.config, config);

		// Initialize Session
		this.session = new Session(
			this.userInfo.unique_id,
			this.config.sessionTimeoutDuration
		);

		// Initialize EventRecorder
		this.eventRecorder = new EventRecorder(this);

		// Initialize App tracker
		this.appTracker = new AppTracker(this);
		this.appTracker.init();

		// Initialize Page tracker
		this.pageTracker = new PageTracker(this);
		this.pageTracker.init();

		// Start timer for sending batch events
		if (this.config.sendMode === SendMode.Batch) {
			setInterval(
				() => this.eventRecorder.flushBufferedEvents(),
				this.config.sendEventsInterval
			);
		}
	}

	/**
	 * Record custom event
	 * @param event
	 */
	record(event: ClickstreamEvent): void {
		let eventError: EventError;

		// Validate event name
		eventError = EventValidator.eventName(event.name);
		if (eventError.code !== ErrorCode.NO_ERROR) {
			logger.error(
				`Failed to send event. ${eventError.message} (error code: ${eventError.code})`
			);
			this.eventRecorder.sendEvent({
				name: PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ReservedAttribute.ERROR_CODE]: eventError.code,
					[ReservedAttribute.ERROR_MESSAGE]: eventError.message,
				},
			});

			return;
		}

		// Validate event attributes
		const validatedAttributes: ClickstreamAttributes = {};
		for (const key in event.attributes) {
			const value = event.attributes[key];
			if (value === null) continue;

			// Check current user attributes count
			if (
				Object.keys(validatedAttributes).length >=
				EventLimit.MAX_NUM_OF_ATTRIBUTES - PRESET_ATTRIBUTES_COUNT
			) {
				eventError = {
					code: ErrorCode.ATTRIBUTE_SIZE_EXCEED,
					message: `Reached the limit of attributes number. Will discard attributes that are beyond ${EventLimit.MAX_NUM_OF_ATTRIBUTES}`,
				};
				break;
			}

			const validation = EventValidator.eventAttribute(key, value);
			if (validation.code === ErrorCode.NO_ERROR) {
				validatedAttributes[key] = value;
			} else {
				eventError = validation;
			}
		}

		// Validate event items
		const validatedItems: Item[] = [];
		for (const index in event.items) {
			const item = event.items[index];

			// Check current items count
			if (validatedItems.length >= EventLimit.MAX_NUM_OF_ITEMS) {
				eventError = {
					code: ErrorCode.ITEM_SIZE_EXCEED,
					message: `Reached the limit of items number. Will discard items that are beyond ${EventLimit.MAX_NUM_OF_ITEMS}`,
				};
				break;
			}

			// Check item length
			if (JSON.stringify(item).length > EventLimit.MAX_LENGTH_OF_ITEM_VALUE) {
				eventError = {
					code: ErrorCode.ITEM_VALUE_LENGTH_EXCEED,
					message: `Invalid item. Item value is too long, max value length is ${EventLimit.MAX_LENGTH_OF_ITEM_VALUE}`,
				};
			} else {
				validatedItems.push(item);
			}
		}

		// Send custom event
		this.eventRecorder.sendEvent({
			name: event.name,
			attributes: validatedAttributes,
			items: validatedItems.length > 0 ? validatedItems : undefined,
		});

		if (eventError.code !== ErrorCode.NO_ERROR) {
			this.eventRecorder.sendEvent({
				name: PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ReservedAttribute.ERROR_CODE]: eventError.code,
					[ReservedAttribute.ERROR_MESSAGE]: eventError.message,
				},
			});
		}
	}

	/**
	 * Set userId with validation
	 * If userId is null or empty, reset userInfo, generate a new unique_id
	 * @param userId
	 */
	setUserId(userId: string | null): void {
		// Handle user logout, reset userInfo
		if (!userId) {
			this.userInfo = DEFAULT_USER_INFO;
			StorageUtil.set(StorageKeys.UserInfo, JSON.stringify(this.userInfo));

			logger.info('Set userId to null, reset UserInfo');
			return;
		}

		// Validate userId, update userInfo
		if (userId.length < EventLimit.MAX_LENGTH_OF_USER_VALUE) {
			logger.info('set userId to: ' + userId);
			this.userInfo.attributes._user_id = {
				value: userId,
				set_timestamp: new Date().getTime(),
			};
			StorageUtil.set(StorageKeys.UserInfo, JSON.stringify(this.userInfo));

			this.eventRecorder.sendEvent({ name: PresetEvent.PROFILE_SET });
		} else {
			const eventError: EventError = {
				code: ErrorCode.USER_ATTRIBUTE_VALUE_LENGTH_EXCEED,
				message: `Invalid user attribute value. Attribute value is too long, max value length is ${EventLimit.MAX_LENGTH_OF_USER_VALUE}`,
			};

			logger.error(
				`Failed to set userId. ${eventError.message} (error code: ${eventError.code})`
			);

			this.eventRecorder.sendEvent({
				name: PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ReservedAttribute.ERROR_CODE]: eventError.code,
					[ReservedAttribute.ERROR_MESSAGE]: eventError.message,
				},
			});
		}
	}

	/**
	 * Set user attributes
	 * Clean up the attribute if the attribute key is null
	 * @param attributes
	 */
	setUserAttributes(attributes: ClickstreamAttributes): void {
		const now = new Date().getTime();
		let eventError: EventError = { code: ErrorCode.NO_ERROR };
		let hasUpdate: boolean = false;

		// Clean up user attributes first, otherwise new attributes may fail to be set due to size exceeded
		for (const key in attributes) {
			if (attributes[key] === null) {
				delete this.userInfo.attributes[key];
				hasUpdate = true;
			}
		}

		// Validate and set user attributes
		for (const key in attributes) {
			const value = attributes[key];
			if (value === null) continue;

			// Check current user attributes count
			const attrCount = Object.keys(this.userInfo.attributes).length;
			if (attrCount >= EventLimit.MAX_NUM_OF_USER_ATTRIBUTES) {
				eventError = {
					code: ErrorCode.USER_ATTRIBUTE_SIZE_EXCEED,
					message: `Reached the limit of user attributes number. Will discard user attributes that are beyond ${EventLimit.MAX_NUM_OF_USER_ATTRIBUTES}`,
				};
				break;
			}

			const validation = EventValidator.eventUserAttribute(key, value);
			if (validation.code === ErrorCode.NO_ERROR) {
				this.userInfo.attributes[key] = {
					value: value,
					set_timestamp: now,
				};
				hasUpdate = true;
			} else {
				eventError = validation;
			}
		}

		// Update userInfo and send _profile_set event when there is substantial change
		if (hasUpdate) {
			StorageUtil.set(StorageKeys.UserInfo, JSON.stringify(this.userInfo));

			this.eventRecorder.sendEvent({ name: PresetEvent.PROFILE_SET });
		}

		if (eventError.code !== ErrorCode.NO_ERROR) {
			this.eventRecorder.sendEvent({
				name: PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ReservedAttribute.ERROR_CODE]: eventError.code,
					[ReservedAttribute.ERROR_MESSAGE]: eventError.message,
				},
			});
		}
	}

	/**
	 * Get device and App information by invoking WeChat APIs
	 * wx.getSystemInfoSync(), wx.getAccountInfoSync(), wx.getNetworkType()
	 * Note that wx.getNetworkType() is async call, so that network_type will be missing at provider initialization
	 * @private
	 */
	private getDeviceAppInfo(): DeviceAppInfo {
		const deviceAppInfo: DeviceAppInfo = {
			device_id: StorageUtil.getDeviceId(),
		};

		try {
			const systemInfo = wx.getSystemInfoSync();
			deviceAppInfo.os_name = systemInfo.platform;
			deviceAppInfo.os_version = systemInfo.system;
			deviceAppInfo.wechat_version = systemInfo.version;
			deviceAppInfo.wechat_sdk_version = systemInfo.SDKVersion;
			deviceAppInfo.brand = systemInfo.brand;
			deviceAppInfo.model = systemInfo.model;
			deviceAppInfo.system_language = systemInfo.language;
			deviceAppInfo.screen_height = systemInfo.screenHeight;
			deviceAppInfo.screen_width = systemInfo.screenWidth;
		} catch (e) {
			logger.error('Failed to call wx.getSystemInfoSync()');
			throw e;
		}

		deviceAppInfo.zone_offset = -new Date().getTimezoneOffset() * 60 * 1000;
		deviceAppInfo.sdk_version = packageConfig.sdkVersion;
		deviceAppInfo.sdk_name = 'aws-solution-clickstream-sdk';

		try {
			const accountInfo = wx.getAccountInfoSync();
			deviceAppInfo.app_package_name = accountInfo.miniProgram?.appId;
			deviceAppInfo.app_version = accountInfo.miniProgram?.version;
		} catch (e) {
			logger.error('Failed to call wx.getAccountInfoSync()');
			throw e;
		}

		// Asynchronously set network_type
		wx.getNetworkType()
			.then(network => (this.deviceAppInfo.network_type = network.networkType))
			.catch(e => logger.error('Failed to call wx.getNetworkType()', e));

		return deviceAppInfo;
	}

	/**
	 * Construct AnalyticsEvent from ClickstreamEvent
	 * @param clickstreamEvent
	 */
	constructAnalyticsEvent(clickstreamEvent: ClickstreamEvent): AnalyticsEvent {
		const sessionInfo = this.session.sessionInfo;
		const sessionAttributes: ClickstreamAttributes = {
			[ReservedAttribute.SESSION_ID]: sessionInfo.id,
			[ReservedAttribute.SESSION_START_TIMESTAMP]: sessionInfo.firstStartTime,
			[ReservedAttribute.SESSION_NUMBER]: sessionInfo.count,
			[ReservedAttribute.SESSION_DURATION]:
				new Date().getTime() - sessionInfo.firstStartTime,
		};

		const pages = getCurrentPages();
		const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
		const previousPage = pages.length > 1 ? pages[pages.length - 2] : null;
		const screenAttributes: ClickstreamAttributes = {
			[ReservedAttribute.SCREEN_ID]: currentPage ? currentPage.getPageId() : '',
			[ReservedAttribute.SCREEN_ROUTE]: this.getPageRoute(currentPage),
			[ReservedAttribute.PREVIOUS_SCREEN_ID]: previousPage
				? previousPage.getPageId()
				: '',
			[ReservedAttribute.PREVIOUS_SCREEN_ROUTE]:
				this.getPageRoute(previousPage),
		};

		return {
			app_id: this.config.appId,
			unique_id: this.userInfo.unique_id,
			device_id: this.deviceAppInfo.device_id,
			event_type: clickstreamEvent.name,
			event_id: wx_uuid(),
			timestamp: new Date().getTime(),
			platform: 'WeChatMP',
			os_name: this.deviceAppInfo.os_name ?? UNKNOWN,
			os_version: this.deviceAppInfo.os_version ?? UNKNOWN,
			wechat_version: this.deviceAppInfo.wechat_version ?? UNKNOWN,
			wechat_sdk_version: this.deviceAppInfo.wechat_sdk_version ?? UNKNOWN,
			brand: this.deviceAppInfo.brand ?? UNKNOWN,
			model: this.deviceAppInfo.model ?? UNKNOWN,
			system_language: this.deviceAppInfo.system_language ?? UNKNOWN,
			screen_height: this.deviceAppInfo.screen_height ?? 0,
			screen_width: this.deviceAppInfo.screen_width ?? 0,
			zone_offset: this.deviceAppInfo.zone_offset ?? 0,
			network_type: this.deviceAppInfo.network_type ?? undefined,
			sdk_version: this.deviceAppInfo.sdk_version ?? UNKNOWN,
			sdk_name: this.deviceAppInfo.sdk_name ?? UNKNOWN,
			app_version: this.deviceAppInfo.app_version ?? UNKNOWN,
			app_package_name: this.deviceAppInfo.app_package_name ?? UNKNOWN,
			user: this.userInfo.attributes,
			attributes: Object.assign(
				{},
				sessionAttributes,
				screenAttributes,
				clickstreamEvent.attributes
			),
			items: clickstreamEvent.items,
		};
	}

	/**
	 * Get page route with query parameters
	 * @param page
	 * @private
	 */
	private getPageRoute(
		page: WechatMiniprogram.Page.Instance<
			WechatMiniprogram.IAnyObject,
			WechatMiniprogram.IAnyObject
		>
	): string {
		if (!page) return '';

		if (Object.keys(page.options).length === 0) return page.route;

		return `${page.route}?${objectToQueryString(page.options)}`;
	}
}
