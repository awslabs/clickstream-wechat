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

export interface DeviceAppInfo {
	device_id: string;
	os_name?: string;
	os_version?: string;
	wechat_version?: string;
	wechat_sdk_version?: string;
	brand?: string;
	model?: string;
	system_language?: string;
	screen_height?: number;
	screen_width?: number;
	zone_offset?: number;
	network_type?: string;
	sdk_version?: string;
	sdk_name?: string;
	app_package_name?: string;
	app_version?: string;
}
