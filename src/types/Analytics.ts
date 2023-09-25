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
import { UserAttributes } from './UserInfo';

export interface ClickstreamConfiguration {
	/**
	 * Configured in the Clickstream control plane
	 */
	appId: string;

	/**
	 * Ingestion server endpoint
	 */
	endpoint: string;

	/**
	 * Send events to ingestion server immediately or in batch
	 * Value options: Immediate (default) | Batch
	 */
	sendMode?: SendMode;

	/**
	 * Send events interval in millisecond for Batch mode, default value is 5000
	 */
	sendEventsInterval?: number;

	/**
	 * Whether auto record event for App onShow(), auto track is enabled by default
	 */
	autoTrackAppShow?: boolean;

	/**
	 * Whether auto record event for App onHide(), auto track is enabled by default
	 */
	autoTrackAppEnd?: boolean;

	/**
	 * Whether auto record event for Page onShow(), auto track is enabled by default
	 */
	autoTrackPageShow?: boolean;

	/**
	 * Whether auto record event for user engagement on single page, auto track is enabled by default
	 */
	autoTrackUserEngagement?: boolean;

	/**
	 * Whether auto record event when user shares mini program, auto track is disabled by default
	 */
	autoTrackMPShare?: boolean;

	/**
	 * Whether auto record event when user adds mini program to favorite, auto track is disabled by default
	 */
	autoTrackMPFavorite?: boolean;

	/**
	 * Session timeout duration in millisecond, default value is 30 minutes
	 */
	sessionTimeoutDuration?: number;

	/**
	 * Whether print logs to console, disabled by default
	 */
	debug?: boolean;

	/**
	 * Authentication cookie
	 */
	authCookie?: string;
}

export enum SendMode {
	Immediate = 'Immediate',
	Batch = 'Batch',
}

export type AttributeValue = string | number | boolean | null;

export interface ClickstreamAttributes {
	[key: string]: AttributeValue;
}

type Currency = string | number;

export interface Item {
	brand?: string;
	category?: string;
	category2?: string;
	category3?: string;
	category4?: string;
	category5?: string;
	creative_name?: string;
	creative_slot?: string;
	id?: string;
	location_id?: string;
	name?: string;
	price?: Currency;
	quantity?: number;
}

export interface ClickstreamEvent {
	name: string;
	attributes?: ClickstreamAttributes;
	items?: Item[];
}

export interface AnalyticsEvent {
	app_id: string;
	unique_id: string;
	device_id: string;
	event_type: string;
	event_id: string;
	timestamp: number;
	platform: string;
	os_name: string;
	os_version: string;
	wechat_version: string;
	wechat_sdk_version: string;
	brand: string;
	model: string;
	system_language: string;
	screen_height: number;
	screen_width: number;
	zone_offset: number;
	network_type: string;
	sdk_version: string;
	sdk_name: string;
	app_version: string;
	app_package_name: string;
	user: UserAttributes;
	attributes: ClickstreamAttributes;
	items: Item[];
}
