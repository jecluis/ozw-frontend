/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import {
    AfterViewInit, Component, OnInit, ViewChild, Output, EventEmitter,
    ChangeDetectionStrategy,
    Input
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { NodesTableDataSource } from './nodes-table-datasource';
import {
    trigger, state, style, transition, animate
} from '@angular/animations';
import {
    NetworkService, NetworkState
} from '../../network/service/network.service';
import { NodesService } from '../service/nodes-service.service';
import { ValuesService } from '../service/values-service.service';
import { NetworkValue } from 'src/app/types/Value';
import { BehaviorSubject } from 'rxjs';
import { NetworkNode, NetworkNodeStateEnum } from 'src/app/types/Node';

@Component({
  selector: 'app-nodes-table',
  templateUrl: './nodes-table.component.html',
  styleUrls: ['./nodes-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed',
          animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodesTableComponent implements AfterViewInit, OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatTable) table: MatTable<NetworkNode>;
    _data_source: NodesTableDataSource;

    /** Columns displayed in the table. Columns IDs can be added, removed,
     * or reordered.
     */
    displayedColumns = [
        'id', 'product', 'name', 'type', 'state', 'capabilities',
        'lastseen', 'switch', 'metering', 'info'
    ];
    expandedNode: NetworkNode | null;
    expand_node: boolean = false;

    @Output() selected_node = new EventEmitter<NetworkNode>();
    @Input() expanded_info = false;

    current_network_state: string = 'unknown';

    private _switch_node:
        {[id: number]: BehaviorSubject<NetworkValue|undefined>} = {};
    private _switch_state:
        {[id: number]: BehaviorSubject<boolean|undefined>} = {};

    constructor(
        private _nodes_svc: NodesService,
        private _values_svc: ValuesService,
        private network: NetworkService) { }

    ngOnInit(): void {
        this._data_source = new NodesTableDataSource(this._nodes_svc);

        this.network.getStateObserver()
        .subscribe({
            next: (_state: NetworkState) => {
                if (_state !== this.current_network_state) {
                    this.current_network_state = _state;
                }
            }
        });
    }

    ngAfterViewInit(): void {
        this._data_source._sort = this.sort;
        this._data_source._paginator = this.paginator;
        this.table.dataSource = this._data_source;
    }

    toggle_info(node: NetworkNode): void {
        console.log("toggle info for node: ", node);
        this.selected_node.next(node);
    }

    toggle_details(node: NetworkNode): void {
        console.log("toggle details for node:", node);
        if (this.expanded_info) {
            console.log("  don't expand!");
            return;
        }

        if (!this.isExpandable(node)) {
            return;
        }

        this.expand_node = (!!node && node !== this.expandedNode);
        this.expandedNode = (!!node && this.expand_node ? node : null);
    }

    isExpandedDetails(node: NetworkNode): boolean {
        const r = this.expand_node && this.expandedNode === node &&
               !this.expanded_info;
        console.log("expanded details: ", r);
        if (!r) {
            console.log("expand node: ", this.expand_node, ", expanded:",
                        this.expandedNode, ", more: ", this.expanded_info);
        }
        return r;
    }

    isExpandable(node: NetworkNode): boolean {
        return node.type.is_meter || node.type.is_switch;
    }


    public getLastSeenStr(node: NetworkNode): string {
        const date = new Date(node.last_seen);
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
                return "a few seconds ago";
            }
        }
        return `${time_lst.join(', ')} ago`;
    }


    isSwitchedOn(nodeid: number): BehaviorSubject<boolean|undefined> {

        const node: NetworkNode = this._nodes_svc.getNodeById(nodeid);
        if (node.state.state !== NetworkNodeStateEnum.Alive) {
            return undefined;
        }

        if (nodeid in this._switch_node) {
            return this._switch_state[nodeid];
        } else {
            this._switch_node[nodeid] = this._values_svc.getSwitchState(nodeid);
            this._switch_state[nodeid] =
                new BehaviorSubject<boolean|undefined>(undefined);
            this._switch_node[nodeid].subscribe(
                (value: NetworkValue|undefined) => {
                    const _is_on: boolean =
                        (!!value && value.value.value as boolean === true);
                    this._switch_state[nodeid].next(_is_on);
                }
            );
        }
        return this._switch_state[nodeid];
    }
}
