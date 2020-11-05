import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NodesTableComponent } from 'src/app/nodes/table/nodes-table.component';
import { NetworkNode } from 'src/app/types/Node';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit {

    public isHandset$: Observable<boolean> =
        this.breakpointObserver.observe([
            Breakpoints.Handset,
            // Breakpoints.Medium,
            Breakpoints.Small
        ]
    )
    .pipe(
        map(result => result.matches),
        shareReplay()
    );
    public device_type: string = "all";

    private _is_handset: boolean = false;

    constructor(
        private breakpointObserver: BreakpointObserver,
        private router: Router
    ) {
        this.isHandset$.subscribe({
            next: (result: boolean) => {
                this._is_handset = result;
            }
        });
    }

    public ngOnInit(): void {
    }

    public selectNode(event: NetworkNode): void {
        console.log("device-list > selected ", event);
        this.router.navigate(['/extended-device-details', event.id]);
    }

}
