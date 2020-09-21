import { Injectable } from '@angular/core';
import { config, BehaviorSubject } from 'rxjs';

export interface Configuration {
	driver: {
		device: string;
		autostart: boolean;
	},	
	prometheus: {
		url: string
	}
}

@Injectable({
	providedIn: 'root'
})
export class ConfigService {

	private _config_test: Configuration = {
		driver: {
			device: '/dev/foo',
			autostart: false
		},
		prometheus: {
			url: 'http://123.456.123.232'
		}
	}
	private _config = new BehaviorSubject<Configuration>(undefined);

	constructor() {
		console.log("config-svc: construct!");
		this._config.next(this._config_test);
	}


	public getConfig(): BehaviorSubject<Configuration> {
		return this._config;
	}

	public setConfig(configstr: string): boolean {
		let config: Configuration = undefined;
		try {
			config = JSON.parse(configstr);
		} catch (e) {
			return false;
		}
		this._config.next(config);
		console.log('config-svc: set configuration');
		return true;
	}
	

}
