/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { AfterViewInit, Component, OnInit, ViewChild, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { NodesTableDataSource, NetworkNode } from './nodes-table-datasource';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NetworkService } from '../../network/service/network.service';
import { NodesService } from '../service/nodes-service.service';

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

	/** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
	displayedColumns = [
		'id', 'product', 'type', 'state', 'capabilities',
		'lastseen', 'metering', 'insights'
	];
	expandedNode: NetworkNode | null;

	@Output() selected_node = new EventEmitter<NetworkNode>();

	current_network_state: string = 'unknown';

	constructor(
		private _nodes_svc: NodesService,
		private network: NetworkService) { }

	ngOnInit() {
		this._data_source = new NodesTableDataSource(this._nodes_svc);

		this.network.getStateObserver()
		.subscribe( state => {
			if (state !== this.current_network_state) {
				this.current_network_state = state;
			}
		});
	}

	ngAfterViewInit() {
		this._data_source._sort = this.sort;
		this._data_source._paginator = this.paginator;
		this.table.dataSource = this._data_source;
	}

	details_n = 0;
	show_details = false;
	toggle_details(node: NetworkNode) {
		console.log("toggle details for node: ", node);
		this.selected_node.next(node);
	}


	public getLastSeenStr(node: NetworkNode): string {
		let date = new Date(node.last_seen);
		let now = new Date().getTime();
		let diff = Math.floor((now - date.getTime())/1000);

		let month_secs = 2.628e+6; // months in seconds
		let week_secs = 604800; // weeks in seconds
		let day_secs = 86400; // 24h in seconds
		let hour_secs = 3600;
		let min_secs = 60;

		let months = Math.floor(diff/month_secs);
		diff -= months*month_secs;

		let weeks = Math.floor(diff/week_secs);
		diff -= weeks*week_secs;

		let days = Math.floor(diff/day_secs);
		diff -= days*day_secs;

		let hours = Math.floor(diff/hour_secs);
		diff -= hours*hour_secs;

		let mins = Math.floor(diff/min_secs);
		diff -= mins*min_secs;


		let time_lst = [];
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

		if (time_lst.length == 0 && diff > 0) {
			time_lst.push("about a minute ago");
		}

		let str: string = `${time_lst.join(', ')} ago`;
		return str;
	}
}
