import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Configuration {
    http: {
        host: string;
        port: number;
    };
    zwave: {
        device: string;
    };
    prometheus: {
        url: string;
    };
}

interface APIConfigItem {
    config: Configuration;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    // private _config_test: Configuration = {
    //     driver: {
    //         device: '/dev/foo',
    //         autostart: false
    //     },
    //     prometheus: {
    //         url: 'http://123.456.123.232'
    //     }
    // };
    private _config: Configuration;
    private _config_observer: BehaviorSubject<Configuration> =
        new BehaviorSubject<Configuration>({} as Configuration);
    private _config_set_status_observer: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);


    constructor(private _http: HttpClient) {
        this._obtainConfig();
    }

    private _obtainConfig(): void {
        this._http.get<APIConfigItem>("/api/config")
        .subscribe(
            (config: APIConfigItem) => {
                if (Object.keys(config).length > 0) {
                    this._config = config.config;
                }
                this._config_observer.next(this._config);
            }
        );
    }

    public getConfig(): BehaviorSubject<Configuration> {
        return this._config_observer;
    }

    public setConfig(configstr: string): BehaviorSubject<boolean> {
        let _config: Configuration = {} as Configuration;
        try {
            _config = JSON.parse(configstr);
        } catch (e) {
            this._config_set_status_observer.next(false);
            return this._config_set_status_observer;
        }
        const api_config: APIConfigItem = { config: _config };
        this._http.post<boolean>("/api/config", api_config)
        .subscribe( (res: boolean) => {
            if (res) {
                this._obtainConfig();
            }
            this._config_set_status_observer.next(res);
        });
        return this._config_set_status_observer;
    }
}
