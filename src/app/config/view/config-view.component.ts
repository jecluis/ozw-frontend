import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
    FormGroup, FormControl, Validators, ValidatorFn, AbstractControl
} from '@angular/forms';
import { ConfigService, Configuration } from '../config.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
    selector: 'app-config-view',
    templateUrl: './config-view.component.html',
    styleUrls: ['./config-view.component.scss']
})
export class ConfigViewComponent implements OnInit, OnDestroy {

    constructor(
        private _config_svc: ConfigService,
        private _dialog: MatDialog
    ) { }

    public configtext_ctrl =
        new FormControl('', [Validators.required, isValidJSON()]);
    public configform = new FormGroup({
        configtext: this.configtext_ctrl
    });

    private _show_setting_error: boolean = false;
    private _show_setting_success: boolean = false;
    private _is_setting: boolean = false;
    private _config: Configuration = {} as Configuration;
    private _config_subscription: Subscription =
        this._config_svc.getConfig().subscribe( (config: Configuration) => {
            this._config = config;
            console.log(`config-view: new config: `, this._config);
            this._updateConfig();
        }
    );
    private _set_subscription: Subscription;

    ngOnInit(): void {
        this._updateConfig();
    }

    ngOnDestroy(): void {
        this._config_subscription.unsubscribe();
    }

    private _updateConfig(): void {
        console.log("config-view: update config");
        this.configtext_ctrl.setValue(
            JSON.stringify(this._config, null, '   '));
    }

    public isSettingConfig(): boolean {
        return this._is_setting;
    }

    public showSettingError(): boolean {
        return this._show_setting_error;
    }

    public showSettingSuccess(): boolean {
        return this._show_setting_success;
    }

    public openConfirmDialog(): void {
        const _dialog_ref = this._dialog.open(ConfigViewConfirmDialogComponent);
        _dialog_ref.afterClosed().subscribe( (result: boolean) => {
            if (!!result && result) {
                this._confirmConfigChange();
            }
            console.log(`config-view: dialog result: ${result}`);
        });
    }

    private _confirmConfigChange(): void {
        const configstr: string = this.configform.value.configtext;
        console.log(`config-view: set config to ${configstr}`);

        this._show_setting_error = false;
        this._show_setting_success = false;

        this._set_subscription = this._config_svc.setConfig(configstr)
        .subscribe(
            (res: boolean) => {
                console.log(`config-view: set result: ${res}`);
                if (res) {
                    this._show_setting_error = false;
                    this._show_setting_success = true;
                } else {
                    this._show_setting_error = true;
                    this._show_setting_success = false;
                }
                this._is_setting = false;
                this._set_subscription?.unsubscribe();
            },
            (error) => {
                this._show_setting_error = true;
                this._show_setting_success = false;
                this._is_setting = false;
            });
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