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


export enum NetworkNodeStateEnum {
	MessageComplete = 0,
	Timeout = 1,
	Nop = 2,
	Awake = 3,
	Sleep = 4,
	Dead = 5,
	Alive = 6,
}

export interface NetworkNodeState {
	state: NetworkNodeStateEnum;
	str: string;
}

export interface NetworkNodeProperties {
	is_listening: boolean;
	is_routing: boolean;
	is_beaming: boolean;
}

export interface NetworkNodeCaps {
	is_controller: boolean;
	is_primary_controller: boolean;
}

export interface NetworkNodeType {
	is_switch: boolean;
	is_meter: boolean;
}

export interface NetworkNode {

	id: number;
	info: NetworkNodeInfo;
	is_ready: boolean;
	capabilities: NetworkNodeCaps;
	properties: NetworkNodeProperties;
	type: NetworkNodeType;
	state: NetworkNodeState;
	last_seen: string;
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

	constructor(private _node_svc: NodesService) {
		super();		
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
		});

		const dataMutations = [
			this._nodes_subject,
			this._paginator.page,
			this._sort.sortChange
		];

		return merge(...dataMutations).pipe(map(() => {
			return this.getPagedData(this.getSortedData([...this._nodes_data]));
		}));
	}

	/**
	 * Called when the table is being destroyed. Use this function, to clean up
	 * any open connections or free any held resources that were set up during
	 * connect.
	 */
	disconnect() {}

	/**
	 * Paginate the data (client-side). If you're using server-side pagination,
	 * this would be replaced by requesting the appropriate data from the
	 * server.
	 */
	private getPagedData(data: NetworkNode[]) {
		const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
		return data.splice(startIndex, this._paginator.pageSize);
	}

	/**
	 * Sort the data (client-side). If you're using server-side sorting,
	 * this would be replaced by requesting the appropriate data from the
	 * server.
	 */
	private getSortedData(data: NetworkNode[]) {
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

/** Simple _sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: string | number, b: string | number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
