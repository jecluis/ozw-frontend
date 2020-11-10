import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NodesService } from 'src/app/nodes/service/nodes-service.service';
import { PrometheusService } from '../../prometheus.service';
import {
    LineSeriesEntry,
    PrometheusMatrixReplyResult, PrometheusMatrixResult,
    PrometheusReply, PrometheusReplyData
} from '../../types';

@Component({
  selector: 'app-daily-wattage-metrics',
  templateUrl: './daily-wattage-metrics.component.html',
  styleUrls: ['./daily-wattage-metrics.component.scss']
})
export class DailyWattageMetricsComponent implements OnInit {

    public isHandset$: Observable<boolean> =
        this._breakpoint_observer.observe([
            Breakpoints.Handset,
            Breakpoints.Tablet,
            Breakpoints.Medium,
            Breakpoints.Small
    ])
    .pipe(
        map(result => result.matches),
        shareReplay()
    );

    public watt_today: LineSeriesEntry[] = [];
    private _subject_watt_today: BehaviorSubject<PrometheusReply>;

    constructor(
        private _breakpoint_observer: BreakpointObserver,
        private _node_svc: NodesService,
        private _prom_svc: PrometheusService
    ) { }

    ngOnInit(): void {
        this._setup();
    }

    private _setup(): void {
        const now = new Date();
        const start_date =
            new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end_date =
            new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const query = "home_energy_consumption_W";
        const start = start_date.toISOString();
        const end = end_date.toISOString();
        const full_query = `query_range?query=${query}&start=${start}&end=${end}&step=10m`;
        this._subject_watt_today =
            this._prom_svc.setQuery("watt-today", full_query);
        this._subject_watt_today.subscribe({
            next: (res: PrometheusReply) => {
                // console.debug("watt result for day: ", res);
                if (!('data' in res)) {
                    return;
                }
                this._update(res.data);
            }
        });
    }

    private _update(data: PrometheusReplyData): void {
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
        // console.debug("watts today: ", this.watt_today);
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

    public formatXAxis(value: string): string {
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
