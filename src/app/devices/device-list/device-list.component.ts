import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NodesService } from 'src/app/nodes/service/nodes-service.service';
import { NetworkNode } from 'src/app/types/Node';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit {

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
    public _device_type: string = "all";
    public nodes_subject: BehaviorSubject<NetworkNode[]> =
        new BehaviorSubject<NetworkNode[]>([]);

    private _nodes: NetworkNode[] = [];
    private _is_handset: boolean = false;

    constructor(
        private _breakpointObserver: BreakpointObserver,
        private _router: Router,
        private _nodes_svc: NodesService
    ) {
        this.isHandset$.subscribe({
            next: (result: boolean) => {
                this._is_handset = result;
            }
        });
    }

    private _updateNodes(): void {
        const tmp: NetworkNode[] = [];
        this._nodes.forEach( (node: NetworkNode) => {
            switch (this._device_type) {
                case 'all':
                    break;
                case 'switch':
                    if (!node.type.is_switch) {
                        return;
                    }
                    break;
                case 'meter':
                    if (!node.type.is_meter) {
                        return;
                    }
                    break;
                case 'sensor':
                    return;  // not supported atm.
            }
            tmp.push(node);
        });
        this.nodes_subject.next(tmp);
    }

    public ngOnInit(): void {
        this._nodes_svc.getNodes().subscribe({
            next: (nodes: NetworkNode[]) => {
                this._nodes = nodes;
                this._updateNodes();
            }
        });
    }

    public selectNode(event: NetworkNode): void {
        console.log("device-list > selected ", event);
        this._router.navigate(['/extended-device-details', event.id]);
    }

    public selectDeviceType(type: string): void {
        if (type === this._device_type) {
            return;
        }
        this._device_type = type;
        this._updateNodes();
    }

    public isDeviceType(type: string): boolean {
        return !!this._device_type && this._device_type === type;
    }

}
