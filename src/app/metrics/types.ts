/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */

export declare type PrometheusValue = number | string;

export interface PrometheusMetric {
	instance: string;
	job: string;
	node: string;
}

export interface PrometheusReplyResult {
	metric: PrometheusMetric;
	value: PrometheusValue[];
}

export declare type PrometheusMatrixResult = PrometheusValue[];

export interface PrometheusMatrixReplyResult {
	metric: PrometheusMetric;
	values: PrometheusMatrixResult[];
}

export interface PrometheusReplyData {
	resultType: string;
	result: PrometheusReplyResult[] | PrometheusMatrixReplyResult[];
}

export interface PrometheusReply {
	status: string;
	data: PrometheusReplyData;
}

export interface ChartValue {
	value: number;
	name: string;
	tooltipText?: string;
}

export interface LineSeriesEntry {
	name: string;
	series: ChartValue[];
}
