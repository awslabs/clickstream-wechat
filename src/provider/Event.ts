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

export const EventLimit = {
	// MAX_NUM_OF_EVENT_TYPE: 50,
	MAX_NUM_OF_ATTRIBUTES: 500,
	MAX_NUM_OF_USER_ATTRIBUTES: 100,
	MAX_LENGTH_OF_NAME: 50,
	MAX_LENGTH_OF_VALUE: 1024,
	MAX_LENGTH_OF_USER_VALUE: 256,
	MAX_NUM_OF_EVENT_IN_BATCH: 100,
	MAX_LENGTH_OF_ERROR_VALUE: 256,
	MAX_NUM_OF_ITEMS: 100,
	MAX_LENGTH_OF_ITEM_VALUE: 256,
};

export const ErrorCode = {
	NO_ERROR: 0,
	EVENT_NAME_INVALID: 1001,
	EVENT_NAME_LENGTH_EXCEED: 1002,
	ATTRIBUTE_NAME_LENGTH_EXCEED: 2001,
	ATTRIBUTE_NAME_INVALID: 2002,
	ATTRIBUTE_VALUE_LENGTH_EXCEED: 2003,
	ATTRIBUTE_SIZE_EXCEED: 2004,
	USER_ATTRIBUTE_SIZE_EXCEED: 3001,
	USER_ATTRIBUTE_NAME_LENGTH_EXCEED: 3002,
	USER_ATTRIBUTE_NAME_INVALID: 3003,
	USER_ATTRIBUTE_VALUE_LENGTH_EXCEED: 3004,
	ITEM_SIZE_EXCEED: 4001,
	ITEM_VALUE_LENGTH_EXCEED: 4002,
};

export const ReservedAttribute = {
	ATTRIBUTES: 'attributes',

	// User
	USER: 'user',
	USER_ID: '_user_id',
	USER_NAME: '_user_name',
	USER_FIRST_TOUCH_TIMESTAMP: '_user_first_touch_timestamp',

	// Error
	ERROR_CODE: '_error_code',
	ERROR_MESSAGE: '_error_message',

	// Session
	SESSION_ID: '_session_id',
	SESSION_START_TIMESTAMP: '_session_start_timestamp',
	SESSION_DURATION: '_session_duration',
	SESSION_NUMBER: '_session_number',

	// Page
	SCREEN_ID: '_screen_id',
	SCREEN_ROUTE: '_screen_route',
	SCREEN_NAME: '_screen_name',
	PREVIOUS_SCREEN_ID: '_previous_screen_id',
	PREVIOUS_SCREEN_ROUTE: '_previous_screen_route',
	PREVIOUS_SCREEN_NAME: '_previous_screen_name',

	// Other
	ENGAGEMENT_TIMESTAMP: '_engagement_time_msec',
	IS_FIRST_TIME: '_is_first_time',
};

export const PresetEvent = {
	FIRST_OPEN: '_first_open',
	APP_START: '_app_start',
	APP_END: '_app_end',
	SESSION_START: '_session_start',
	SCREEN_VIEW: '_screen_view',
	USER_ENGAGEMENT: '_user_engagement',
	PROFILE_SET: '_profile_set',
	MP_SHARE: '_mp_share',
	MP_FAVORITE: '_mp_favorite',
	CLICKSTREAM_ERROR: '_clickstream_error',
};

export const BufferedEventsConstants = {
	MAX_SIZE: 1024 * 512,
	STRINGIFY_PREFIX: '[',
	STRINGIFY_SUFFIX: ']',
	STRINGIFY_DELIMITER: ',',
};
