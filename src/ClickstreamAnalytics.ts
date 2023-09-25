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

import { ClickstreamProvider } from './provider/ClickstreamProvider';
import {
	ClickstreamAttributes,
	ClickstreamConfiguration,
	ClickstreamEvent,
} from './types';
import { Logger } from './utils/Logger';

export const logger: Logger = new Logger();

export class ClickstreamAnalytics {
	private static provider: ClickstreamProvider;

	/**
	 * Initialize Clickstream WeChat SDK
	 * @param config SDK configuration
	 */
	public static init(config: ClickstreamConfiguration): boolean {
		// Initialize logger
		logger.toggleDebug(config.debug ?? false);

		if (this.provider !== undefined) {
			logger.info('Clickstream Wechat mini program SDK has been initialized.');
			return false;
		}

		// Configure Clickstream provider
		this.provider = new ClickstreamProvider(config);

		return true;
	}

	public static configure(config: ClickstreamConfiguration): void {
		this.provider.configure(config);
	}

	public static record(event: ClickstreamEvent): void {
		this.provider.record(event);
	}

	public static setUserId(userId: string | null): void {
		this.provider.setUserId(userId);
	}

	public static setUserAttribute(attributes: ClickstreamAttributes): void {
		this.provider.setUserAttributes(attributes);
	}
}
