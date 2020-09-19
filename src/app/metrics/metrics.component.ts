/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import {
	ChartValue,
	LineSeriesEntry,
	PrometheusReplyResult,
	PrometheusMatrixResult,
	PrometheusMatrixReplyResult,
	PrometheusReplyData,
	PrometheusReply
} from './types';


@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {


	public kWh: ChartValue[] = [];
	public kWh_max: number = 0;

	public watt_today: LineSeriesEntry[] = [];

	public kWh_per_day: LineSeriesEntry[] = [];
	public kWh_per_day_series: {[id: string]: LineSeriesEntry} = {};

	constructor(private _http: HttpClient) { }

	ngOnInit(): void {
		this._getMetrics();
	}


	private _getMetrics(): void {
		this._getMetricsKWh();
		// this._getWattSumPerDay();
		this._getMetricsWattToday();
		// this._getMetricsKWhSegmented();
	}

	_getWattSumPerDay(): void {
		let now: Date = new Date();
		console.debug(`month: ${now.getMonth()}, date: ${now}`);
		let firstjan: Date = new Date(2020, 0, 1);
		console.debug(`first jan: ${firstjan}`);
		console.debug(`first jan, iso: ${firstjan.toISOString()}`);

		interface DayValue {
			date: Date;
			value: number;
		}

		let query = "sum_over_time(home_energy_consumption_W[24h:1h])";
		let start = "2020-09-01T00:00:00.000Z";
		let end = "2020-09-17T23:59:59.000Z";
		let url = "http://172.20.20.51:9090/api/v1";
		let endpoint = `${url}/query_range?query=${query}&start=${start}&end=${end}&step=1d`;
		this._http.get<PrometheusReply>(endpoint)
		.subscribe( (res: PrometheusReply) => {
			console.debug(`watt sum per day: `, res);
		});
	}


	private _getMetricsWattToday(): void {
		let now = new Date();
		let start_date =
			new Date(now.getFullYear(), now.getMonth(), now.getDate());
		let end_date =
			new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

		let query = "home_energy_consumption_W";
		let start = start_date.toISOString();
		let end = end_date.toISOString();
		let url = "http://172.20.20.51:9090/api/v1";
		let endpoint = `${url}/query_range?query=${query}&start=${start}&end=${end}&step=30m`;
		this._http.get<PrometheusReply>(endpoint)
		.subscribe( (res: PrometheusReply) => {
			console.debug(`watt result for day: `, res);
			this._updateWattToday(res.data);
		});
	}

	private _getMetricsKWh(): void {
		let query = 
			"sum_over_time("+
				"("+
					"(sum_over_time(home_energy_consumption_W[30d])/1000)/"+
					"count_over_time(home_energy_consumption_W[30d])"+
				")[30d:1h])";
		let start = "2020-09-17T00:00:01.000Z";
		let end = "2020-09-17T23:59:59.000Z";
		let url = "http://172.20.20.51:9090/api/v1";
		let endpoint = `${url}/query?query=${query}`;
		this._http.get<PrometheusReply>(endpoint)
		.subscribe( (res: PrometheusReply) => {
			console.debug(`prom result: `, res)
			this._updateKWh(res.data);
		});
	}

	private _updateKWh(data: PrometheusReplyData): void {
		let piechart: ChartValue[] = [];

		let result = data.result as PrometheusReplyResult[];
		result.forEach( (entry: PrometheusReplyResult) => {
			let value: number = +(<string> entry.value[1]);
			value = Math.round((value + Number.EPSILON) * 100)/100;
			let chart_value: ChartValue = {
				name: entry.metric.node,
				value: value
			};
			piechart.push(chart_value);

			if (value > this.kWh_max) {
				this.kWh_max = value;
			}
		});
		this.kWh = [...piechart];
	}

	private _updateWattToday(data: PrometheusReplyData): void {
		let watts = [];
		let result = data.result as PrometheusMatrixReplyResult[];
		result.forEach( (entry: PrometheusMatrixReplyResult) => {
			let series_entry: LineSeriesEntry = {
				name: entry.metric.node,
				series: []
			}
			entry.values.forEach( (value: PrometheusMatrixResult) => {
				let date = new Date(+value[0]*1000);
				let watt = +(<string> value[1]);
				watt = Math.round((watt + Number.EPSILON) * 100) / 100;
				series_entry.series.push({
					name: `${date.getHours()}h${date.getMinutes()}m`,
					value: watt
				});
			});
			watts.push(series_entry);	
		});
		this.watt_today = [...watts];
		console.debug("watts today: ", this.watt_today);
	}

}
