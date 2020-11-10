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
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PrometheusService } from './prometheus.service';
import { map, shareReplay } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


interface LayoutConfig {
    cols: number;
    cards: {
        daily_watt: {
            cols: number;
            rows: number;
        },
        last_30d_kwh: {
            cols: number;
            rows: number;
        },
        last_30d_slots: {
            cols: number;
            rows: number;
        }
    };
}


@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {

    public isHandset$: Observable<boolean> =
        this.breakpointObserver.observe([
            Breakpoints.Handset,
            Breakpoints.Tablet,
            Breakpoints.Medium,
            Breakpoints.Small
    ])
    .pipe(
        map(result => result.matches),
        shareReplay()
    );

    public kWh: ChartValue[] = [];
    public kWh_max: number = 0;

    public kWh_per_day: LineSeriesEntry[] = [];
    public kWh_per_day_series: {[id: string]: LineSeriesEntry} = {};

    public _url: string;
    public _has_prometheus: boolean = false;

    private _layout_handset: LayoutConfig = {
        cols: 1,
        cards: {
            daily_watt: { cols: 1, rows: 3 },
            last_30d_kwh: { cols: 1, rows: 3},
            last_30d_slots: { cols: 1, rows: 3}
        }
    };
    private _layout_regular: LayoutConfig = {
        cols: 4,
        cards: {
            daily_watt: { cols: 2, rows: 3 },
            last_30d_kwh: { cols: 1, rows: 3 },
            last_30d_slots: { cols: 1, rows: 3}
        }
    };
    public layout: LayoutConfig = this._layout_regular;

    private observer_kwh: BehaviorSubject<PrometheusReply>;
    private observer_kwh2: BehaviorSubject<PrometheusReply>;
    private subscription_kwh: Subscription;

    constructor(
        private _http: HttpClient,
        private _node_svc: NodesService,
        private _prom_svc: PrometheusService,
        private breakpointObserver: BreakpointObserver
    ) {
        this.isHandset$.subscribe(this._changeLayout.bind(this));
    }

    public ngOnInit(): void {
        this._setupMetrics();
    }

    private _changeLayout(handset_like: boolean): void {
        if (handset_like) {
            this.layout = this._layout_handset;
        } else {
            this.layout = this._layout_regular;
        }
    }

    private _setupMetrics(): void {
        this._setupMetricsKWh();
    }

    private _setupMetricsKWh(): void {
        const query =
            "sum_over_time(" +
            "(" +
                "(sum_over_time(home_energy_consumption_W[30d:10m])/1000)/" +
                "count_over_time(home_energy_consumption_W[30d:10m])" +
            ")[30d:1h])";
        const full_query = `query?query=${query}`;
        this.observer_kwh = this._prom_svc.setQuery("kwh", full_query);
        this.subscription_kwh = this.observer_kwh.subscribe({
            next: (res: PrometheusReply) => {
                console.debug("prom result: ", res);
                if (!('data' in res)) {
                    return;
                }
                // this._updateKWh(res.data);
            }
        });

        const start_date = new Date();
        start_date.setDate(-30);
        const end_date = new Date();
        const start = start_date.toISOString();
        const end = end_date.toISOString();
        const query2 = `query_range?query=home_energy_consumption_W&start=${start}&end=${end}&step=10m`;
        this.observer_kwh2 = this._prom_svc.setQuery("kwh2", query2);
        this.observer_kwh2.subscribe({
            next: (res: PrometheusReply) => {
                if (!('data' in res)) {
                    return;
                }
                console.debug("prom kwh2 result: ", res);
                const result = res.data.result as PrometheusMatrixReplyResult[];
                const entries: {[id: string]: ChartValue} = {};
                result.forEach( (entry: PrometheusMatrixReplyResult) => {
                    let agg: number = 0;
                    let npoints: number = 0;
                    entry.values.forEach( (point: PrometheusMatrixResult) => {
                        const point_val: number = +(point[1] as string);
                        if (point_val <= 0) {
                            return;
                        }
                        agg += (point_val / 6);
                        npoints++;
                    });
                    const n_kWh: number = (agg / 1000);
                    console.log(`kwh2 > ${entry.metric.node} > agg: ${n_kWh} kwh`);
                    const n: string = this._getNameFromNode(entry.metric.node);
                    entries[n] = { name: n, value: n_kWh};
                });
                const piechart: ChartValue[] = [];
                Object.keys(entries).sort().forEach( (k: string) => {
                    piechart.push(entries[k]);
                });
                this.kWh = [...piechart];
            }
        });

    }

    private _getNameFromNode(nodestr: string): string {
        let node_name = nodestr;
        const t: string[] = node_name.split('-');
        if (t.length === 2) {
            const node_id: number = +(t[1]);
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
        const entries: {[id: string]: ChartValue} = {};
        const result = data.result as PrometheusReplyResult[];
        result.forEach( (entry: PrometheusReplyResult) => {
            let _value: number = +(entry.value[1] as string);
            _value = Math.round((_value + Number.EPSILON) * 100) / 100;
            const _name: string = this._getNameFromNode(entry.metric.node);
            const chart_value: ChartValue = {
                name: _name,
                value: _value
            };
            entries[_name] = chart_value;

            if (_value > this.kWh_max) {
                this.kWh_max = _value;
            }
        });
        // ensure ordering when adding to chart.
        const piechart: ChartValue[] = [];
        Object.keys(entries).sort().forEach( (k: string) => {
            piechart.push(entries[k]);
        });
        this.kWh = [...piechart];
    }
}
