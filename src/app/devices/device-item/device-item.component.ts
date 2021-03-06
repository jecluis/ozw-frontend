import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NodesService } from 'src/app/nodes/service/nodes-service.service';
import { ValuesService } from 'src/app/nodes/service/values-service.service';
import { NetworkNode, NetworkNodeStateEnum } from 'src/app/types/Node';
import { NetworkValue } from 'src/app/types/Value';

@Component({
  selector: 'app-device-item',
  templateUrl: './device-item.component.html',
  styleUrls: ['./device-item.component.scss']
})
export class DeviceItemComponent implements OnInit {

    @Input() public node: NetworkNode;
    @Output() public node_selected: EventEmitter<NetworkNode> =
        new EventEmitter<NetworkNode>();

    public isHandset$: Observable<boolean> =
        this._breakpointObserver.observe([
            Breakpoints.Handset,
            // Breakpoints.Medium,
            Breakpoints.Small
        ]
    )
    .pipe(
        map(result => result.matches),
        shareReplay()
    );
    public orientation: string = "row";

    private _switch_state: BehaviorSubject<boolean|undefined> =
        new BehaviorSubject<boolean|undefined>(undefined);

    constructor(
        private _values_svc: ValuesService,
        private _breakpointObserver: BreakpointObserver
    ) { }

    public ngOnInit(): void {
        if (!!this.node && this.node.type.is_switch) {
            this._values_svc.getSwitchState(this.node.id).subscribe({
                next: (value: NetworkValue|undefined) => {
                    if (!value) {
                        this._switch_state.next(undefined);
                        return;
                    }
                    const is_on: boolean =
                        (!!value && value.value.value as boolean === true);
                    this._switch_state.next(is_on);
                }
            });
        }
        this.isHandset$.subscribe({
            next: (is_handset: boolean) => {
                this.orientation = (is_handset ? "column" : "row");
            }
        });
    }

    public getName(): string {
        if (!this.node) {
            return "Unknown Node";
        }
        if (this.node.info.name && this.node.info.name !== "") {
            return this.node.info.name;
        }
        return `${this.node.info.product}`;
    }

    public hasName(): boolean {
        return (this.node && this.node.info.name && this.node.info.name !== "");
    }

    public getProduct(): string {
        if (!this.node) {
            return "Unknown Product";
        }
        return this.node.info.product;
    }

    public getSwitchState(): BehaviorSubject<boolean|undefined> {
        return this._switch_state;
    }


    public isAlive(): boolean {
        return this.node.state.state === NetworkNodeStateEnum.Alive;
    }

    public isAwake(): boolean {
        return this.node.state.state === NetworkNodeStateEnum.Awake;
    }

    public isFailed(): boolean {
        return this.node.state.state === NetworkNodeStateEnum.Dead;
    }

    public isAsleep(): boolean {
        return !this.isAlive() && !this.isAwake() && !this.isFailed();
    }

    public showMoreInfo(): void {
        this.node_selected.next(this.node);
    }

    public getUpdatedAt(): string {
        if (!this.node || !this.node.last_seen) {
            return "unknown";
        }

        const date = new Date(this.node.last_seen);
        const now = new Date().getTime();
        let diff = Math.floor((now - date.getTime()) / 1000);

        const month_secs = 2.628e+6; // months in seconds
        const week_secs = 604800; // weeks in seconds
        const day_secs = 86400; // 24h in seconds
        const hour_secs = 3600;
        const min_secs = 60;

        const months = Math.floor(diff / month_secs);
        diff -= months * month_secs;

        const weeks = Math.floor(diff / week_secs);
        diff -= weeks * week_secs;

        const days = Math.floor(diff / day_secs);
        diff -= days * day_secs;

        const hours = Math.floor(diff / hour_secs);
        diff -= hours * hour_secs;

        const mins = Math.floor(diff / min_secs);
        diff -= mins * min_secs;


        const time_lst = [];
        if (months > 0) {
            time_lst.push(`${months}mo`);
        }

        if (weeks > 0) {
            time_lst.push(`${weeks}wk`);
        }

        if (days > 0) {
            time_lst.push(`${days}d`);
        }

        if (hours > 0) {
            time_lst.push(`${hours}h`);
        }

        if (mins > 0) {
            time_lst.push(`${mins}m`);
        }

        if (time_lst.length === 0) {
            if (diff > 0) {
                return "about a minute ago";
            } else {
                return "few seconds ago";
            }
        }
        return `${time_lst.join(', ')} ago`;
    }
}
