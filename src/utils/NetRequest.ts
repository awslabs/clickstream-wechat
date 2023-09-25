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

import { objectToQueryString, wx_hashcode } from './helper';
import { logger } from '../ClickstreamAnalytics';
import { ClickstreamConfiguration } from '../types';

export class NetRequest {
	static readonly REQUEST_TIMEOUT = 10 * 1000;
	static readonly BATCH_REQUEST_TIMEOUT = 15 * 1000;

	/**
	 * Send request to Clickstream ingestion server
	 * <platform>, <appId> and <event_bundle_sequence_id> are required query params
	 * @param data
	 * @param config
	 * @param sequenceId
	 * @param timeout
	 */
	static sendRequest(
		data: string,
		config: ClickstreamConfiguration,
		sequenceId: number,
		timeout = NetRequest.REQUEST_TIMEOUT
	): Promise<boolean> {
		const queryParams = {
			platform: 'WeChatMP',
			appId: config.appId,
			event_bundle_sequence_id: sequenceId,
			hashCode: wx_hashcode(data),
		};
		const url = `${config.endpoint}?${objectToQueryString(queryParams)}`;

		return this.wxRequest(
			'POST',
			url,
			data,
			{
				'Content-Type': 'application/json; charset=utf-8',
				cookie: config.authCookie,
			},
			timeout
		)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Convert wx.request() to Promise call
	 * @param method
	 * @param url
	 * @param data
	 * @param header
	 * @param timeout
	 * @private
	 */
	private static wxRequest(
		method: 'POST' | 'OPTIONS' | 'GET' | 'HEAD' | 'PUT' | 'DELETE',
		url: string,
		data: string,
		header: object,
		timeout: number
	) {
		return new Promise((resolve, reject) => {
			wx.request({
				method,
				url,
				data,
				header,
				timeout,
				success(res) {
					if (res.statusCode === 200) {
						resolve(res);
					} else {
						logger.error(
							`wx.request() failed with status code ${res.statusCode}`
						);
						reject(res);
					}
				},
				fail(err) {
					logger.error(
						`Failed to send request because of ${err.errMsg} (${err.errno})`
					);
					reject(err);
				},
			});
		});
	}
}
