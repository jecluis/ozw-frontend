import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ValuesService } from 'src/app/nodes/service/values-service.service';
import { NetworkNode } from 'src/app/types/Node';
import { NetworkValue } from 'src/app/types/Value';

@Component({
  selector: 'app-device-meter-item',
  templateUrl: './device-meter-item.component.html',
  styleUrls: ['./device-meter-item.component.scss']
})
export class DeviceMeterItemComponent implements OnInit {

    @Input() public node: NetworkNode;

    private METER_CLS: number = 50;  // COMMAND_METER = 0x32
    private _VALUEIDS = {
        electric: [
            { idx: 0, label: "kWh" },
            { idx: 4, label: "kVah" },
            { idx: 8, label: "W" },
            { idx: 12, label: "Pulse" },
            { idx: 16, label: "V" },
            { idx: 20, label: "A" }
        ]
    };

    private electric: {[id: string]: NetworkValue} = {};
    private electric_obs: {[id: string]: BehaviorSubject<string>} = {};

    constructor(
        private _values_svc: ValuesService
    ) { }

    public ngOnInit(): void {
        this._VALUEIDS.electric.forEach( ({idx, label}) => {
            const vid = `${this.node.id}-${this.METER_CLS}-1-${idx}`;
            if (!this._values_svc.hasValueID(this.node.id, vid)) {
                return;
            }
            this._values_svc.getValueByID(this.node.id, vid).subscribe({
                next: (value: NetworkValue) => {
                    this.electric[label] = value;
                    this._updatedValue(label);
                }
            });
        });
    }

    private _updatedValue(label: string): void {
        const value: NetworkValue = this.electric[label];
        if (!(label in this.electric_obs)) {
            this.electric_obs[label] = new BehaviorSubject<string>("");
        }
        const value_str = `${value.value.value} ${value.value.units}`;
        this.electric_obs[label].next(value_str);
    }

    private _hasElectricMetric(label: string): boolean {
        return label in this.electric;
    }

    private _getElectricValue(label: string): BehaviorSubject<string> {
        if (!(label in this.electric_obs)) {
            this._updatedValue(label);
        }
        return this.electric_obs[label];
    }

    public isElectric(): boolean {
        return Object.keys(this.electric).length > 0;
    }

    public hasEnergy(): boolean { return this._hasElectricMetric('kWh'); }
    public hasPower(): boolean { return this._hasElectricMetric('W'); }
    public hasTension(): boolean { return this._hasElectricMetric('V'); }
    public hasCurrent(): boolean { return this._hasElectricMetric('A'); }

    public getEnergy(): BehaviorSubject<string> {
        return this._getElectricValue('kWh');
    }

    public getPower(): BehaviorSubject<string> {
        return this._getElectricValue('W');
    }

    public getTension(): BehaviorSubject<string> {
        return this._getElectricValue('V');
    }

    public getCurrent(): BehaviorSubject<string> {
        return this._getElectricValue('A');
    }
}
