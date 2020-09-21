import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators, Validator, ValidatorFn, AbstractControl } from '@angular/forms';
import { ConfigService, Configuration } from '../config.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
	selector: 'app-config-view',
	templateUrl: './config-view.component.html',
	styleUrls: ['./config-view.component.scss']
})
export class ConfigViewComponent implements OnInit {

	constructor(
		private _config_svc: ConfigService,
		private _dialog: MatDialog
	) { }

	configtext_ctrl = new FormControl('', [Validators.required, isValidJSON()]);
	configform = new FormGroup({
		configtext: this.configtext_ctrl
	});

	private _config: Configuration = {} as Configuration;
	private _config_subscription: Subscription =
		this._config_svc.getConfig().subscribe( (config: Configuration) => {
			this._config = config;
			console.log(`config-view: new config: `, this._config);
			this._updateConfig();
		}
	);

	ngOnInit(): void {
		this._updateConfig();
	}

	ngOnDestroy(): void {
		this._config_subscription.unsubscribe();
	}

	private _updateConfig() {
		console.log("config-view: update config");
		this.configtext_ctrl.setValue(
			JSON.stringify(this._config, null, '   '));
	}

	public openConfirmDialog() {
		const _dialog_ref = this._dialog.open(ConfigViewConfirmDialogComponent);
		_dialog_ref.afterClosed().subscribe( (result: boolean) => {
			if (!!result && result) {
				this._confirmConfigChange();
			}
			console.log(`config-view: dialog result: ${result}`);
		});
	}

	private _confirmConfigChange() {
		let configstr: string = this.configform.value['configtext'];
		console.log(`config-view: set config to ${configstr}`);
		if (!this._config_svc.setConfig(configstr)) {
			console.error("invalid configuration");
		}
	}
}

function isValidJSON(): ValidatorFn {
	return (control: AbstractControl): {[key: string]: any | null} => {
		let is_valid_json: boolean = false;
		try {
			JSON.parse(control.value);
			is_valid_json = true;
		} catch (e) { }
		return (is_valid_json ? null : { invalidJSON: {value: control.value}});
	}
}

@Component({
	selector: 'app-config-view-confirm-dialog',
	templateUrl: 'config-view-confirm-dialog.html'
})
export class ConfigViewConfirmDialogComponent { }