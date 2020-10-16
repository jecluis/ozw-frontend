import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { ConfigService, Configuration } from '../config/config.service';
import { PrometheusReply } from './types';


interface RecurringQuery {
    query: string;
    observable: BehaviorSubject<PrometheusReply>;
}


@Injectable({
  providedIn: 'root'
})
export class PrometheusService {

    private _url: string = "";
    private _has_prometheus: boolean = false;
    private _queries: {[id: string]: RecurringQuery} = {};

    constructor(
        private _http: HttpClient,
        private _cfg_svc: ConfigService
    ) {
        this._cfg_svc.getConfig().subscribe({
            next: this._updateConfig.bind(this)
        });

        interval(10000).subscribe({
            next: () => {
                this._checkAndUpdatePrometheusURL(this._url);
            }
        });

        interval(30000).subscribe({
            next: () => {
                this._triggerQueries();
            }
        });
    }

    private _updateConfig(config: Configuration): void {
        if (!config || !config.prometheus) {
            return;
        }
        if (config.prometheus.url !== this._url) {
            this._updatePrometheusURL(config.prometheus.url);
        }
    }

    private _updatePrometheusURL(url: string): void {
        if (url === "") {
            this._has_prometheus = false;
        } else if (url === this._url) {
            return;
        } else {
            this._checkAndUpdatePrometheusURL(url);
        }
    }

    private _checkAndUpdatePrometheusURL(url: string): void {
        const endpoint = `${url}/api/v1/status/config`;
        this._http.get<{}>(endpoint)
        .subscribe( (res: any) => {
            if ('status' in res && res.status === "success") {
                this._has_prometheus = true;
            } else {
                this._has_prometheus = false;
            }
            this._url = url;
            this._triggerQueries();
        });
    }

    private _triggerQueries(): void {
        console.debug(`handle queue > len: ${this._queries.length}`);
        if (!this._has_prometheus) {
            return;
        }
        Object.values(this._queries).forEach( (item: RecurringQuery) => {
            const endpoint: string = `${this._url}/api/v1/${item.query}`;
            this._http.get<PrometheusReply>(endpoint)
            .subscribe({
                next: (reply: PrometheusReply) => {
                    item.observable.next(reply);
                }
            });
        });
    }

    public hasPrometheus(): boolean {
        return this._has_prometheus;
    }

    public setQuery(
        name: string,
        querystr: string
    ): BehaviorSubject<PrometheusReply> {
        const item: RecurringQuery = {
            query: querystr,
            observable: new BehaviorSubject({} as PrometheusReply)
        };
        if (name in this._queries) {
            delete this._queries[name];
        }
        this._queries[name] = item;
        this._triggerQueries();
        return item.observable;
    }

    public unsetQuery(name: string): void {
        if (name in this._queries) {
            delete this._queries[name];
        }
    }

}
