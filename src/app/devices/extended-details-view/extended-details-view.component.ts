import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { Component, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Observer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NodesService } from 'src/app/nodes/service/nodes-service.service';
import { NetworkNode } from 'src/app/types/Node';

@Component({
  selector: 'app-extended-details-view',
  templateUrl: './extended-details-view.component.html',
  styleUrls: ['./extended-details-view.component.scss']
})
export class ExtendedDetailsViewComponent implements OnInit, OnChanges {

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
    public node_id: number = -1;
    public scope: string = "user";

    private _node?: NetworkNode = undefined;
    private _name_subject: BehaviorSubject<string> =
        new BehaviorSubject<string>("Unknown Node");


    constructor(
        private _route: ActivatedRoute,
        private _nodes_svc: NodesService,
        private _router: Router,
        private _breakpointObserver: BreakpointObserver
    ) { }

    public ngOnInit(): void {

        if (!this._route.snapshot.paramMap.has("nodeid")) {
            console.error("extended-details-view > nodeid not provided");
            return;
        }
        this._updateNodeID();
    }

    public ngOnChanges(): void {
        this._updateNodeID();
    }

    private _updateNodeID(): void {
        this.node_id = +(this._route.snapshot.paramMap.get("nodeid"));
        this._node = this._nodes_svc.getNodeById(this.node_id);

        if (this._node && this._node.info && this._node.info.name !== "") {
            this._name_subject.next(this._node.info.name);
        } else {
            this._name_subject.next(`Node ${this.node_id}`);
        }
    }

    public getNodeName(): BehaviorSubject<string> {
        return this._name_subject;
    }

    public goBack(): void {
        this._router.navigate(['/devices']);
    }
}
