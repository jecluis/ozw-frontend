import { Component, OnInit } from '@angular/core';
import {
    LineSeriesEntry,
    PrometheusReply,
    PrometheusMatrixReplyResult,
    PrometheusMatrixResult,
    ChartValue
} from '../types';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval } from 'rxjs';


export interface SlotInterval {
    start: SlotDate;
    end: SlotDate;
    kwh?: number;
}

export interface Slot {
    name: string;
    intervals: SlotInterval[];
}


function slotdate(h: number, m: number, s: number): SlotDate {
    return new SlotDate(h, m, s);
}


class SlotDate {
    constructor(
        public hour: number,
        public min: number,
        public sec: number
    ) { }

    public getDate(d: Date): Date {
        const date: Date = new Date(d);
        date.setHours(this.hour);
        date.setMinutes(this.min);
        date.setSeconds(this.sec);
        return date;
    }

    public getISOString(d: Date): string {
        return this.getDate(d).toISOString();
    }
}

declare type SlotResultMap = {[id: string]: number};

@Component({
    selector: 'app-metrics-per-time-slot',
    templateUrl: './per-time-slot.component.html',
    styleUrls: ['./per-time-slot.component.scss']
})
export class PerTimeSlotComponent implements OnInit {

    constructor(private _http: HttpClient) { }

    public chart_data: LineSeriesEntry[] = [];

    private kWh_per_day_map: {[id: string]: SlotResultMap} = {};
    private _slots_updated_observer = new BehaviorSubject<boolean>(false);
    private _slots_updated_subscription: Subscription = undefined;

    private slots: Slot[] = [
        {
            name: "high",
            intervals: [
                { start: slotdate(9, 30, 0), end: slotdate(10, 59, 59) },
                { start: slotdate(17, 30, 0), end: slotdate(19, 59, 59) }
            ]
        },
        {
            name: "normal",
            intervals: [
                { start: slotdate(8, 0, 0), end: slotdate(9, 29, 59) },
                { start: slotdate(11, 0, 0), end: slotdate(17, 29, 59) },
                { start: slotdate(20, 0, 0), end: slotdate(21, 59, 59) }
            ]
        },
        {
            name: "low",
            intervals: [
                { start: slotdate(22, 0, 0), end: slotdate(23, 59, 59) },
                { start: slotdate(0, 0, 0), end: slotdate(7, 59, 59) }
            ]
        }
    ];

    private cost: {[id: string]: number} = {
        high: 0.1826,
        normal: 0.1247,
        low: 0.0625
    };

    ngOnInit(): void {
        this._subscribeUpdates();
        this._generateMetrics();
    }

    private _subscribeUpdates(): void {
        this._slots_updated_subscription =
            this._slots_updated_observer.subscribe(
                (res: boolean) => {
                    if (!res) { return; }
                    this._updateChart();
                }
        );
    }

    private _updateChart(): void {
        if (!this._slots_updated_subscription) {
            return;
        }
        // we need to unsubscribe and resubscribe so we can safely update the
        // chart without having competing threads changing the values.
        this._slots_updated_subscription.unsubscribe();
        this._slots_updated_subscription = undefined;

        let chart: LineSeriesEntry[] = [];
        for (let day in this.kWh_per_day_map) {
            let series_entry: LineSeriesEntry = {
                name: day,
                series: []
            };
            for (let slot in this.kWh_per_day_map[day]) {
                let kwh: number = this.kWh_per_day_map[day][slot];
                let chartvalue: ChartValue = {
                    name: slot,
                    value: kwh,
                    tooltipText: `${kwh} kWh`
                }
                series_entry.series.push(chartvalue);
            }
            if (series_entry.series.length > 0) {
                chart.push(series_entry);

                let total_cost: number = 0;
                series_entry.series.forEach( (v: ChartValue) => {
                    total_cost += this._round(v.value*this.cost[v.name]);
                });
                console.log(`total cost ${day}: ${total_cost}`);
            }
        }

        this.chart_data = [...chart];
        this._subscribeUpdates();
    }

    private _round(value: number): number {
        return Math.round((value + Number.EPSILON) * 100)/100;
    }

    private _obtainSlot(
        date: Date,
        slot_name: string,
        slot: SlotInterval
    ): void {
        const start: string = slot.start.getISOString(date);
        const end: string = slot.end.getISOString(date);
        const query = "sum(home_energy_consumption_W)";
        const url = "http://172.20.20.51:9090/api/v1";
        const endpoint = `${url}/query_range?query=${query}&start=${start}&end=${end}&step=10m`;

        this._http.get<PrometheusReply>(endpoint)
        .subscribe( (res: PrometheusReply) => {
            const result = res.data.result as PrometheusMatrixReplyResult[];
            result.forEach( (entry: PrometheusMatrixReplyResult) => {

                let first: number = Number.MAX_VALUE;
                let last: number = 0;
                let sum: number = 0;
                // console.log(`interval data points: `, entry.values);

                entry.values.forEach( (results: PrometheusMatrixResult) => {
                    const ts = results[0] as number;
                    if (ts < first) { first = ts; }
                    if (ts > last) { last = ts; }
                    const tdate = new Date(ts * 1000);
                    const _result = +(results[1] as string);
                    if (_result < 0) {
                        return;
                    }
                    // console.log(`data point: ${tdate} = ${res}`);
                    // 10 minute samples, each is 1/6th of kWh
                    sum += _result / 6;
                });

                const hours: number = this._round((last - first) / 3600);
                const avg: number = this._round(sum / 1000);
                console.log(
                    `interval ${start} to ${end} (${hours}h): ${avg}`);
                slot.kwh = avg;
                const month_day_str =
                    `${date.getMonth() + 1}/${date.getDate()}`;
                if (!(slot_name in this.kWh_per_day_map[month_day_str])) {
                    this.kWh_per_day_map[month_day_str][slot_name] = 0;
                }
                this.kWh_per_day_map[month_day_str][slot_name] += avg;
                this._slots_updated_observer.next(true);
            });
        });

    }


    private _generateMetrics(): void {
        const now = new Date();
        const today = now.getDate();

        for (let day = 1; day <= today; day++) {
            const date = new Date();
            date.setDate(day);
            const month_day_str = `${date.getMonth() + 1}/${day}`;
            this.kWh_per_day_map[month_day_str] = {};

            this.slots.forEach( (slot: Slot) => {
                const slot_name = slot.name;

                slot.intervals.forEach( (_interval: SlotInterval) => {
                    this._obtainSlot(date, slot_name, _interval);
                });
            });
        }
    }
}
