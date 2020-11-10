import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NodesService } from 'src/app/nodes/service/nodes-service.service';
import { PrometheusService } from '../../prometheus.service';
import {
    ChartValue,
    PrometheusMatrixReplyResult, PrometheusMatrixResult,
    PrometheusReply
} from '../../types';

@Component({
  selector: 'app-last30-days-kwh-meter',
  templateUrl: './last30-days-kwh-meter.component.html',
  styleUrls: ['./last30-days-kwh-meter.component.scss']
})
export class Last30DaysKWhMeterComponent implements OnInit {

    public kWh: ChartValue[] = [];
    private observer_kwh: BehaviorSubject<PrometheusReply>;

    constructor(
        private _prom_svc: PrometheusService,
        private _node_svc: NodesService
    ) { }

    ngOnInit(): void {
        this._setup();
    }

    private _setup(): void {
        const start_date = new Date();
        start_date.setDate(-30);
        const end_date = new Date();
        const start = start_date.toISOString();
        const end = end_date.toISOString();
        const query = `query_range?query=home_energy_consumption_W&start=${start}&end=${end}&step=10m`;
        this.observer_kwh = this._prom_svc.setQuery("kwh", query);

        this.observer_kwh.subscribe({
            next: (res: PrometheusReply) => {
                if (!('data' in res)) {
                    return;
                }
                const result = res.data.result as PrometheusMatrixReplyResult[];
                this._update(result);
            }
        });
    }

    private _update(result: PrometheusMatrixReplyResult[]): void {
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
            // console.log(`kwh2 > ${entry.metric.node} > agg: ${n_kWh} kwh`);
            const n: string = this._getNameFromNode(entry.metric.node);
            entries[n] = { name: n, value: n_kWh};
        });
        const piechart: ChartValue[] = [];
        Object.keys(entries).sort().forEach( (k: string) => {
            piechart.push(entries[k]);
        });
        this.kWh = [...piechart];
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
}
