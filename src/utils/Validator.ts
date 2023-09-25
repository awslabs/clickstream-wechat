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

import { ErrorCode, EventLimit } from '../provider/Event';
import { AttributeValue } from '../types';

export interface EventError {
	code: number;
	message?: string;
}

export class EventValidator {
	/**
	 * Validate event name:
	 * a) naming regex
	 * b) name length
	 * @param name
	 */
	static eventName(name: string): EventError {
		if (!EventValidator.isValidName(name)) {
			return {
				code: ErrorCode.EVENT_NAME_INVALID,
				message:
					'Invalid event name. Event name can only consist of alphanumeric characters and underscores ' +
					'but not start with a digit (0-9)',
			} as EventError;
		}

		if (name.length > EventLimit.MAX_LENGTH_OF_NAME) {
			return {
				code: ErrorCode.EVENT_NAME_LENGTH_EXCEED,
				message: `Invalid event name. Event name is too long, max name length is ${EventLimit.MAX_LENGTH_OF_NAME}`,
			} as EventError;
		}

		return {
			code: ErrorCode.NO_ERROR,
		} as EventError;
	}

	/**
	 * Validate event attribute (name and value)
	 * a) attribute name: naming regex
	 * b) attribute name: length
	 * c) attribute value: length
	 * @param name
	 * @param value
	 */
	static eventAttribute(name: string, value: AttributeValue): EventError {
		if (!EventValidator.isValidName(name)) {
			return {
				code: ErrorCode.ATTRIBUTE_NAME_INVALID,
				message:
					'Invalid attribute name. Attribute name can only consist of alphanumeric characters and underscores ' +
					'but not start with a digit (0-9)',
			} as EventError;
		}

		if (name.length > EventLimit.MAX_LENGTH_OF_NAME) {
			return {
				code: ErrorCode.ATTRIBUTE_NAME_LENGTH_EXCEED,
				message: `Invalid attribute name. Attribute name is too long, max name length is ${EventLimit.MAX_LENGTH_OF_NAME}`,
			} as EventError;
		}

		if (String(value).length > EventLimit.MAX_LENGTH_OF_VALUE) {
			return {
				code: ErrorCode.ATTRIBUTE_VALUE_LENGTH_EXCEED,
				message: `Invalid attribute value. Attribute value is too long, max value length is ${EventLimit.MAX_LENGTH_OF_VALUE}`,
			} as EventError;
		}

		return {
			code: ErrorCode.NO_ERROR,
		} as EventError;
	}

	/**
	 * Validate event user attribute (name and value)
	 * a) attribute name: naming regex
	 * b) attribute name: length
	 * c) attribute value: length
	 * @param name
	 * @param value
	 */
	static eventUserAttribute(name: string, value: AttributeValue): EventError {
		if (!EventValidator.isValidName(name)) {
			return {
				code: ErrorCode.USER_ATTRIBUTE_NAME_INVALID,
				message:
					'Invalid user attribute name. Attribute name can only consist of alphanumeric characters and underscores ' +
					'but not start with a digit (0-9)',
			};
		}

		if (name.length > EventLimit.MAX_LENGTH_OF_NAME) {
			return {
				code: ErrorCode.USER_ATTRIBUTE_NAME_LENGTH_EXCEED,
				message: `Invalid user attribute name. Attribute name is too long, max name length is ${EventLimit.MAX_LENGTH_OF_NAME}`,
			};
		}

		if (String(value).length > EventLimit.MAX_LENGTH_OF_USER_VALUE) {
			return {
				code: ErrorCode.USER_ATTRIBUTE_VALUE_LENGTH_EXCEED,
				message: `Invalid user attribute value. Attribute value is too long, max value length is ${EventLimit.MAX_LENGTH_OF_USER_VALUE}`,
			};
		}

		return {
			code: ErrorCode.NO_ERROR,
		};
	}

	/**
	 * Valid name consists of alphanumeric characters and underscores, but not start with a digit (0-9)
	 * @param name
	 * @private
	 */
	private static isValidName(name: string): boolean {
		const regex = /^(?![0-9])[0-9a-zA-Z_]+$/;
		return regex.test(name);
	}
}
