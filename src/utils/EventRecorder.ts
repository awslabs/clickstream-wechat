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
import { getRandomInt } from './helper';
import { NetRequest } from './NetRequest';
import { StorageKeys, StorageUtil } from './StorageUtil';
import { logger } from '../ClickstreamAnalytics';
import { ClickstreamProvider } from '../provider/ClickstreamProvider';
import { BufferedEventsConstants } from '../provider/Event';
import { AnalyticsEvent, ClickstreamEvent, SendMode } from '../types';

export class EventRecorder {
	provider: ClickstreamProvider;
	sequenceId: number;

	constructor(provider: ClickstreamProvider) {
		this.provider = provider;

		const sequenceId: any = StorageUtil.get(StorageKeys.SequenceId);
		this.sequenceId = sequenceId === '' ? 0 : sequenceId;
	}

	/**
	 * Send event immediately or save to buffer for batch send
	 * @param event
	 */
	sendEvent(event: ClickstreamEvent): void {
		const analyticsEvent: AnalyticsEvent =
			this.provider.constructAnalyticsEvent(event);

		logger.info('New event: ', event, analyticsEvent);

		switch (this.provider.config.sendMode) {
			case SendMode.Immediate:
				this.immediateSendEvent(analyticsEvent);
				break;
			case SendMode.Batch:
				this.handleBatchEvent(analyticsEvent);
				break;
			default:
				break;
		}
	}

	/**
	 * Send event immediately
	 * If succeeded, retry sending previously failed events
	 * If failed, save event to wxStorage for later retry
	 * @param event
	 * @private
	 */
	private immediateSendEvent(event: AnalyticsEvent): void {
		// Send single event request
		NetRequest.sendRequest(
			JSON.stringify([event]),
			this.provider.config,
			this.incrementSequenceId()
		).then(result => {
			if (result) {
				logger.info(`Send request ${event.event_id} successfully!`);

				// Retry sending failed events after 5 - 10 seconds delay
				setTimeout(
					() => this.flushImmediateEvents(),
					getRandomInt(5, 10) * 1000
				);
			} else {
				logger.warn(`Failed to send request: ${event}`);

				// Persist event to wxStorage waiting for next retry upon sending request successfully or App onHide()
				let immediateEventsCache = StorageUtil.get(StorageKeys.ImmediateEvents);
				if (immediateEventsCache === '') {
					immediateEventsCache = {};
				}
				immediateEventsCache[event.event_id] = JSON.stringify(event);
				StorageUtil.set(StorageKeys.ImmediateEvents, immediateEventsCache);
			}
		});
	}

	/**
	 * Send immediateEvents in wxStorage
	 */
	async flushImmediateEvents() {
		const events = StorageUtil.get(StorageKeys.ImmediateEvents);
		if (events === '' || Object.keys(events).length === 0) return;

		// Retry failed events that were sent at least one minute ago
		for (const key in events) {
			const event = JSON.parse(events[key]) as AnalyticsEvent;
			if (new Date().getTime() - event.timestamp < 60 * 1000) continue;

			const res = await NetRequest.sendRequest(
				JSON.stringify([event]),
				this.provider.config,
				this.incrementSequenceId()
			);
			if (res) {
				logger.info(`Resend request ${event.event_id} successfully.`);
				delete events[key];
			} else {
				logger.warn(`Failed to resend request: ${event}`);
			}
		}

		StorageUtil.set(StorageKeys.ImmediateEvents, events);
	}

	/**
	 * Save event to buffer for batch send triggered by timer
	 * Send event immediately if exceeding max size of the buffer
	 * @param event
	 * @private
	 */
	private handleBatchEvent(event: AnalyticsEvent): void {
		let eventsStr = StorageUtil.get(StorageKeys.BufferedEvents);
		if (eventsStr === '') {
			eventsStr =
				BufferedEventsConstants.STRINGIFY_PREFIX + JSON.stringify(event);
		} else {
			eventsStr +=
				BufferedEventsConstants.STRINGIFY_DELIMITER + JSON.stringify(event);
		}

		// Check buffered events length
		if (eventsStr.length < BufferedEventsConstants.MAX_SIZE) {
			StorageUtil.set(StorageKeys.BufferedEvents, eventsStr);
		} else {
			logger.info(
				`Exceeds max size of events buffer. Send event ${event.event_id} immediately.`
			);
			this.immediateSendEvent(event);
		}
	}

	/**
	 * Send events in the buffer
	 */
	async flushBufferedEvents() {
		const events = StorageUtil.get(StorageKeys.BufferedEvents);
		if (events === '') return;

		const res = await NetRequest.sendRequest(
			events + BufferedEventsConstants.STRINGIFY_SUFFIX,
			this.provider.config,
			this.incrementSequenceId(),
			NetRequest.BATCH_REQUEST_TIMEOUT
		);
		if (res) {
			logger.info('Flush buffered events successfully.');
			StorageUtil.set(StorageKeys.BufferedEvents, undefined);
		} else {
			logger.warn('Failed to flush buffered events.');
		}
	}

	/**
	 * Increment sequenceId by 1
	 * @private
	 */
	private incrementSequenceId(): number {
		StorageUtil.set(StorageKeys.SequenceId, ++this.sequenceId);
		return this.sequenceId;
	}
}
