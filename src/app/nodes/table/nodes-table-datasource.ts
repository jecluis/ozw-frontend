/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map, catchError, finalize } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject } from 'rxjs';
import { NodesService } from '../service/nodes-service.service';
import { NetworkNode } from '../../types/Node';



export interface NetworkNodeInfo {
    manufacturer: string;
    manufacturerid: string;
    product: string;
    producttype: string;
    productid: string;
    type: string;
    name: string;
    loc: string;
}


/**
 * Data source for the NodesTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class NodesTableDataSource extends DataSource<NetworkNode> {
    public _paginator: MatPaginator;
    public _sort: MatSort;
    public _nodes_data: NetworkNode[] = [];
    private _nodes_subject = new BehaviorSubject<NetworkNode[]>([]);
    private _filtered_nodes_subject = new BehaviorSubject<NetworkNode[]>([]);
    private _filtered_nodes: NetworkNode[] = [];
    private _filter_node_type: string = "all";

    constructor(
        private _node_svc: NodesService,
        private _node_type_subject: BehaviorSubject<string>) {
        super();
    }

    private _updateNodes(): void {
        console.log("nodes-table-ds > filter: ", this._filter_node_type);
        const filtered: NetworkNode[] = [];
        this._nodes_data.forEach( (node: NetworkNode) => {
            if (this._filter_node_type === "all") {
                filtered.push(node);
                console.log("nodes-table-ds > push node ", node);
            } else {
                if (this._filter_node_type === "switch" &&
                    node.type.is_switch) {
                    filtered.push(node);
                } else if (this._filter_node_type === "meter" &&
                           node.type.is_meter) {
                    filtered.push(node);
                }
            }
        });
        console.log("nodes-table-ds > filtered: ", filtered);
        this._filtered_nodes_subject.next(filtered);
    }

    /**
     * Connect this data source to the table. The table will only update when
     * the returned stream emits new items.
     * @returns A stream of the items to be rendered.
     */
    connect(): Observable<NetworkNode[]> {
        // Combine everything that affects the rendered data into one update
        // stream for the data-table to consume.
        this._nodes_subject = this._node_svc.getNodes();
        this._nodes_subject.subscribe( (nodes: NetworkNode[]) => {
            this._nodes_data = nodes;
            this._updateNodes();
        });
        this._node_type_subject.subscribe({
            next: (node_type: string) => {
                console.log("nodes-table-ds > change filter: ", node_type);
                this._filter_node_type = node_type;
                this._updateNodes();
            }
        });
        this._filtered_nodes_subject.subscribe({
            next: (nodes: NetworkNode[]) => {
                this._filtered_nodes = nodes;
            }
        });

        const dataMutations = [
            this._filtered_nodes_subject,
            this._paginator.page,
            this._sort.sortChange
        ];

        return merge(...dataMutations).pipe(map(() => {
            return this.getPagedData(this.getSortedData([...this._filtered_nodes]));
        }));
    }

    /**
     * Called when the table is being destroyed. Use this function, to clean up
     * any open connections or free any held resources that were set up during
     * connect.
     */
    disconnect(): void {}

    /**
     * Paginate the data (client-side). If you're using server-side pagination,
     * this would be replaced by requesting the appropriate data from the
     * server.
     */
    private getPagedData(data: NetworkNode[]): NetworkNode[] {
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        return data.splice(startIndex, this._paginator.pageSize);
    }

    /**
     * Sort the data (client-side). If you're using server-side sorting,
     * this would be replaced by requesting the appropriate data from the
     * server.
     */
    private getSortedData(data: NetworkNode[]): NetworkNode[] {
        if (!this._sort.active || this._sort.direction === '') {
            return data;
        }

        return data.sort((a, b) => {
            const isAsc = this._sort.direction === 'asc';
            switch (this._sort.active) {
                case 'type': return compare(+a.info.type, +b.info.type, isAsc);
                case 'product':
                    return compare(a.info.product, b.info.product, isAsc);
                case 'id': return compare(+a.id, +b.id, isAsc);
                case 'state':
                    return compare(+a.state.state, +b.state.state, isAsc);
                default: return 0;
            }
        });
    }
}

/** Simple _sort comparator for example ID/Name columns (for client-side
 *  sorting).
 */
function compare(
    a: string | number,
    b: string | number,
    isAsc: boolean
): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
