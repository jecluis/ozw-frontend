import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

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
        private breakpointObserver: BreakpointObserver
    ) {
        this.isHandset$.subscribe({
            next: (result: boolean) => {
                this._is_handset = result;
            }
        });
    }

    public ngOnInit(): void {
    }

}
