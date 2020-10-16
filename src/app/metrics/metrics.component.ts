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
import {
    ChartValue,
    LineSeriesEntry,
    PrometheusReplyResult,
    PrometheusMatrixResult,
    PrometheusMatrixReplyResult,
    PrometheusReplyData,
    PrometheusReply
} from './types';
import { NodesService } from '../nodes/service/nodes-service.service';


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

    constructor(
        private _http: HttpClient,
        private _node_svc: NodesService
    ) { }

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
        const now: Date = new Date();
        console.debug(`month: ${now.getMonth()}, date: ${now}`);
        const firstjan: Date = new Date(2020, 0, 1);
        console.debug(`first jan: ${firstjan}`);
        console.debug(`first jan, iso: ${firstjan.toISOString()}`);

        interface DayValue {
            date: Date;
            value: number;
        }

        const query = "sum_over_time(home_energy_consumption_W[24h:1h])";
        const start = "2020-09-01T00:00:00.000Z";
        const end = "2020-09-17T23:59:59.000Z";
        const url = "http://172.20.20.51:9090/api/v1";
        const endpoint = `${url}/query_range?query=${query}&start=${start}&end=${end}&step=1d`;
        this._http.get<PrometheusReply>(endpoint)
        .subscribe( (res: PrometheusReply) => {
            console.debug(`watt sum per day: `, res);
        });
    }


    private _getMetricsWattToday(): void {
        const now = new Date();
        const start_date =
            new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end_date =
            new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const query = "home_energy_consumption_W";
        const start = start_date.toISOString();
        const end = end_date.toISOString();
        const url = "http://172.20.20.51:9090/api/v1";
        const endpoint = `${url}/query_range?query=${query}&start=${start}&end=${end}&step=10m`;
        this._http.get<PrometheusReply>(endpoint)
        .subscribe( (res: PrometheusReply) => {
            console.debug(`watt result for day: `, res);
            this._updateWattToday(res.data);
        });
    }

    private _getMetricsKWh(): void {
        const query =
            "sum_over_time(" +
            "(" +
                "(sum_over_time(home_energy_consumption_W[30d:10m])/1000)/" +
                "count_over_time(home_energy_consumption_W[30d:10m])" +
            ")[30d:1h])";
        const start = "2020-09-17T00:00:01.000Z";
        const end = "2020-09-17T23:59:59.000Z";
        const url = "http://172.20.20.51:9090/api/v1";
        const endpoint = `${url}/query?query=${query}`;
        this._http.get<PrometheusReply>(endpoint)
        .subscribe( (res: PrometheusReply) => {
            console.debug(`prom result: `, res);
            this._updateKWh(res.data);
        });
    }

    private _getNameFromNode(nodestr: string): string {
        let node_name = nodestr;
        const t: string[] = node_name.split('-');
        // console.debug(`node split name: `, t);
        if (t.length === 2) {
            const node_id: number = +(t[1]);
            // console.debug(`attempt getting info for node ${node_id}`);
            if (this._node_svc.nodeExists(node_id)) {
                const node = this._node_svc.getNodeById(node_id);
                if (node.info.name && node.info.name !== "") {
                    node_name = node.info.name;
                }
            }
        }
        return node_name;
    }

    private _updateKWh(data: PrometheusReplyData): void {
        const piechart: ChartValue[] = [];

        const result = data.result as PrometheusReplyResult[];
        result.forEach( (entry: PrometheusReplyResult) => {
            let _value: number = +(entry.value[1] as string);
            _value = Math.round((_value + Number.EPSILON) * 100) / 100;
            const chart_value: ChartValue = {
                name: this._getNameFromNode(entry.metric.node),
                value: _value
            };
            piechart.push(chart_value);

            if (_value > this.kWh_max) {
                this.kWh_max = _value;
            }
        });
        this.kWh = [...piechart];
    }

    private _updateWattToday(data: PrometheusReplyData): void {
        const watts = [];
        const result = data.result as PrometheusMatrixReplyResult[];
        result.forEach( (entry: PrometheusMatrixReplyResult) => {
            const node_name = this._getNameFromNode(entry.metric.node);
            const series_entry: LineSeriesEntry = {
                name: node_name,
                series: []
            };
            entry.values.forEach( (value: PrometheusMatrixResult) => {
                const date = new Date(+value[0] * 1000);
                // let series_name: string = " ";
                // if (date.getMinutes() == 30 || date.getMinutes() == 0) {
                // 	series_name = `${date.getHours()}h${date.getMinutes()}m`;
                // }
                let watt = +(value[1] as string);
                watt = Math.round((watt + Number.EPSILON) * 100) / 100;
                series_entry.series.push({
                    name: date.toISOString(),
                    value: watt
                });
            });
            watts.push(series_entry);
        });
        this.watt_today = [...watts];
        console.debug("watts today: ", this.watt_today);
    }

    public wattChartFormatXAxis(value: string): string {
        const date = new Date(value);
        const minutes = date.getMinutes();
        if (minutes === 0 || minutes === 30) {
            return `${date.getHours()}h${minutes}m`;
        }
        return "";
    }

    public getTimeFromISODate(datestr: string): string {
        const date = new Date(datestr);
        return `${date.getHours()}h${date.getMinutes()}m`;
    }
}
