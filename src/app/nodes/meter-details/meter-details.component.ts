import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NetworkNode } from 'src/app/types/Node';
import { NetworkValue } from 'src/app/types/Value';
import { ValuesService } from '../service/values-service.service';

@Component({
  selector: 'app-meter-details',
  templateUrl: './meter-details.component.html',
  styleUrls: ['./meter-details.component.scss']
})
export class MeterDetailsComponent implements OnInit, OnChanges {

    @Input() node: NetworkNode;

    private _value_watt: number = 0;
    private _value_volt: number = 0;
    private _value_amps: number = 0;

    public constructor(
        private _values_svc: ValuesService
    ) { }

    public ngOnInit(): void {
        this._updateValues();
    }

    public ngOnChanges(): void { }


    private _updateValues(): void {
        const watt_vid = `${this.node.id}-50-1-8`;
        const volt_vid = `${this.node.id}-50-1-16`;
        const amps_vid = `${this.node.id}-50-1-20`;

        this._values_svc.getValueByID(this.node.id, watt_vid).subscribe({
            next: (value: NetworkValue) => {
                if (!value || !('value' in value)) {
                    return;
                }
                this._value_watt = value.value.value as number;
            }
        });
        this._values_svc.getValueByID(this.node.id, volt_vid).subscribe({
            next: (value: NetworkValue) => {
                if (!value || !('value' in value)) {
                    return;
                }
                this._value_volt = value.value.value as number;
            }
        });
        this._values_svc.getValueByID(this.node.id, amps_vid).subscribe({
            next: (value: NetworkValue) => {
                if (!value || !('value' in value)) {
                    return;
                }
                this._value_amps = value.value.value as number;
            }
        });
    }

    getWatts(): number {
        return this._value_watt;
    }

    getVolts(): number {
        return this._value_volt;
    }

    getAmps(): number {
        return this._value_amps;
    }
}
