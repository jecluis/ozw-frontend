/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkNode } from '../table/nodes-table-datasource';
import { catchError, finalize } from 'rxjs/operators';
import { merge, BehaviorSubject, interval } from 'rxjs';
import { NetworkService, NetworkState } from '../../network/service/network.service';

@Injectable({
	providedIn: 'root'
})
export class NodesService {

	private _nodes_data: NetworkNode[] = [];
	private _nodes_subject = new BehaviorSubject<NetworkNode[]>([]);
	private _last_fetch: Date = new Date(0);
	private _fetch_interval: number = 20000; // 20 seconds in miliseconds


	constructor(
		private http: HttpClient,
		private _network_svc: NetworkService
	) {
		interval(this._fetch_interval).subscribe( () => {
			console.debug("nodes-svc: fetch information");
			this._fetchInfo();
		});

		this._network_svc.getStateObserver()
		  .subscribe(this._handleNetworkStateChange.bind(this));
	 }

	/**
	 * Ensure we don't hammer the server with the same request all the time.
	 */
	private _shouldFetch(): boolean {
		let now: number = new Date().getTime();
		let diff: number = now - this._last_fetch.getTime();
		return (diff > this._fetch_interval);
	}

	private _fetchInfo(): void {
		if (this._shouldFetch()) {
			this._getNodes();
		}
	}

	private _getNodes() {
		let nodes =
			this.http.get<NetworkNode[]>('/api/nodes')
		.pipe(
			catchError( () => merge([]) ),
			finalize( () => console.debug("nodes-svc: successfully got nodes"))
		)
		.subscribe( nodes => {
			this._nodes_data = nodes;
			this._nodes_subject.next(this._nodes_data);
			console.debug("nodes-svc: nodes =", nodes);
		});
	}

	private _handleNetworkStateChange(state: NetworkState): void {
		console.debug("nodes-svc: handle network state change: ", state);
		switch (state) {
			case NetworkState.STARTING:
			case NetworkState.ALIVE:
			case NetworkState.ASLEEP:
			case NetworkState.AWAKE:
				this._fetchInfo();
				break;
			default:
				this.clearNodes();
				break;
		}
	}


	public getNodes(): BehaviorSubject<NetworkNode[]> {
		this._fetchInfo();
		return this._nodes_subject;
	}

	public clearNodes(): void {
		this._nodes_data = [];
		this._nodes_subject.next([]);
	}
  
}
