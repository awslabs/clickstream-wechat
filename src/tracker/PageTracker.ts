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
import { objectToQueryString, wx_getPageTitle } from '../utils/helper';
import { StorageKeys, StorageUtil } from '../utils/StorageUtil';

export const DEFAULT_PAGE_INFO: PageInfo = {
	id: NotAvailable,
	route: NotAvailable,
	name: NotAvailable,
	timestamp: 0,
};

export class PageTracker extends BaseTracker {
	init() {
		const originalPage: WechatMiniprogram.Page.Constructor = Page;
		Page = page => {
			this.overwritePageMethod(page, 'onShow', this.onPageShow.bind(this));
			this.overwritePageMethod(
				page,
				'onShareAppMessage',
				this.onPageShare.bind(this)
			);
			this.overwritePageMethod(
				page,
				'onAddToFavorites',
				this.onPageFavorite.bind(this)
			);

			originalPage(page);
		};
	}

	/**
	 * Overwrite WeChat Mini Program Page method
	 * @param page WMP Page
	 * @param methodName method name
	 * @param customMethod overwritten method custom logic
	 * @private
	 */
	private overwritePageMethod(
		page: WechatMiniprogram.Page.Options<any, any>,
		methodName: string,
		customMethod: (input: any) => void
	): void {
		const originalMethod = page[methodName];
		page[methodName] = (data: any) => {
			const pages = getCurrentPages();

			customMethod(data);

			if (originalMethod) {
				originalMethod.apply(pages[pages.length - 1], data);
			}
		};
	}

	/**
	 * Overwrite Page onShow() method
	 * Functionalities:
	 * 1. Maintain pageInfo in wxStorage
	 * 2. Send _screen_view event if client is viewing a new page
	 * 3. Send _user_engagement event for last viewed page
	 * @private
	 */
	private onPageShow(): void {
		if (this.provider.deviceAppInfo.network_type) {
			this.onPageShowActions();
		} else {
			// Wait for wx.getNetworkType() completed
			setTimeout(() => this.onPageShowActions(), 500);
		}
	}
	private onPageShowActions(): void {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		const pageId = page.getPageId();
		const pageRoute =
			Object.keys(page.options).length > 0
				? `${page.route}?${objectToQueryString(page.options)}`
				: page.route;
		const pageTitle = wx_getPageTitle(page.route);

		// Retrieve last viewed page info
		let lastPage: PageInfo = DEFAULT_PAGE_INFO;
		const lastViewedPageStr = StorageUtil.get(StorageKeys.PageInfo);

		if (lastViewedPageStr !== '') {
			lastPage = JSON.parse(lastViewedPageStr) as PageInfo;
		}

		// Check if client is viewing a new page
		if (
			pageId !== lastPage.id ||
			pageRoute !== lastPage.route ||
			pageTitle !== lastPage.name
		) {
			const newPage: PageInfo = {
				id: pageId,
				route: pageRoute,
				name: pageTitle,
				timestamp: new Date().getTime(),
			};
			StorageUtil.set(StorageKeys.PageInfo, JSON.stringify(newPage));

			// Send _screen_view event
			this.provider.config.autoTrackPageShow &&
				this.provider.eventRecorder.sendEvent({
					name: PresetEvent.SCREEN_VIEW,
					attributes: {
						[ReservedAttribute.SCREEN_ID]: pageId,
						[ReservedAttribute.SCREEN_ROUTE]: pageRoute,
						[ReservedAttribute.SCREEN_NAME]: pageTitle,
						[ReservedAttribute.PREVIOUS_SCREEN_ID]: lastPage.id,
						[ReservedAttribute.PREVIOUS_SCREEN_ROUTE]: lastPage.route,
						[ReservedAttribute.PREVIOUS_SCREEN_NAME]: lastPage.name,
						[ReservedAttribute.ENGAGEMENT_TIMESTAMP]:
							lastPage.timestamp > 0
								? new Date().getTime() - lastPage.timestamp
								: undefined,
					},
				});

			// Send _user_engagement event if last viewed page engagement was not recorded upon
			// App onHide() event (pageId is available while timestamp is not 0)
			if (lastPage.id !== NotAvailable && lastPage.timestamp > 0) {
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
			}
		} else {
			// Upon App onHide(), the SDK will send _user_engagement event, then set PageInfo.timestamp to 0
			// When client reopens the mini program, if they return to the same page, the SDK reset the PageInfo.timestamp
			// So that the user engagement duration on the same page is resumed.
			if (lastPage.timestamp === 0) {
				lastPage.timestamp = new Date().getTime();
				StorageUtil.set(StorageKeys.PageInfo, JSON.stringify(lastPage));
			}
		}
	}

	/**
	 * Overwrite Page onShareAppMessage() method
	 * Functionalities:
	 * 1. Send _mp_share event
	 * @private
	 */
	private onPageShare(): void {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		const pageRoute = page.route;
		const pageTitle = wx_getPageTitle(pageRoute);

		this.provider.config.autoTrackMPShare &&
			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.MP_SHARE,
				attributes: {
					[ReservedAttribute.SCREEN_NAME]: pageTitle,
				},
			});
	}

	/**
	 * Overwrite Page onAddToFavorites() method
	 * Functionalities:
	 * 1. Send _mp_favorite event
	 * @private
	 */
	private onPageFavorite(): void {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		const pageRoute = page.route;
		const pageTitle = wx_getPageTitle(pageRoute);

		this.provider.config.autoTrackMPFavorite &&
			this.provider.eventRecorder.sendEvent({
				name: PresetEvent.MP_FAVORITE,
				attributes: {
					[ReservedAttribute.SCREEN_NAME]: pageTitle,
				},
			});
	}
}
