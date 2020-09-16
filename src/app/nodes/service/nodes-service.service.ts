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
import { merge, BehaviorSubject, interval, Observable } from 'rxjs';
import { NetworkService, NetworkState } from '../../network/service/network.service';

export interface NodeNeighbors {
	node: NetworkNode;
	neighbors: NetworkNode[];
}

declare type NodeNeighborsMap = {[id:number]: NodeNeighbors};
declare type NodesMap = {[id: number]: NetworkNode};

@Injectable({
	providedIn: 'root'
})
export class NodesService {

	private _nodes_data: NodesMap = {};
	private _nodes_subject = new BehaviorSubject<NetworkNode[]>([]);
	private _nodes_neighbors: NodeNeighborsMap = {};
	private _nodes_neighbors_subject =
		new BehaviorSubject<NodeNeighbors>(undefined);
	private _last_fetch: Date = new Date(0);
	private _fetch_interval: number = 20000; // 20 seconds in miliseconds


	constructor(
		private _http: HttpClient,
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
			this._http.get<NetworkNode[]>('/api/nodes')
		.pipe(
			catchError( () => merge([]) ),
			finalize( () => console.debug("nodes-svc: successfully got nodes"))
		)
		.subscribe( (nodes: NetworkNode[]) => {
			this._nodes_data = {};
			nodes.forEach( (node: NetworkNode) => {
				this._nodes_data[node.id] = node;
			});
			this._nodes_subject.next(nodes);
			console.debug("nodes-svc: nodes =", nodes);
			this._updateNodeNeighbors();
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

	private _getNodeNeighbors(neighbors: number[]): NetworkNode[] {
		let lst: NetworkNode[] = [];

		neighbors.forEach( (id: number) => {
			if (id in this._nodes_data) {
				lst.push(this._nodes_data[id]);
			}
		});
		return lst;
	}

	private _updateNodeNeighbors() {
		Object.keys(this._nodes_data).forEach( (idstr: string) => {
			this._http.get<number[]>(`/api/nodes/${idstr}/neighbors`)
			.pipe(
				catchError( () => merge([]))
			)
			.subscribe( (neighbors: number[]) => {

				let _node_neighbors: NodeNeighbors = {
					node: this._nodes_data[+idstr],
					neighbors: this._getNodeNeighbors(neighbors)
				};
				this._nodes_neighbors_subject.next(_node_neighbors);
			});
		});
	}


	public getNodes(): BehaviorSubject<NetworkNode[]> {
		this._fetchInfo();
		return this._nodes_subject;
	}

	public getKnownNodes(): NetworkNode[] {
		return Object.values(this._nodes_data);
	}

	public clearNodes(): void {
		this._nodes_data = {};
		this._nodes_subject.next([]);
	}

	public getNodeNeighbors(): BehaviorSubject<NodeNeighbors> {
		this._fetchInfo();
		return this._nodes_neighbors_subject;
	}

	public getNodeById(id: number): NetworkNode {
		return this._nodes_data[id];
	}

	public nodeExists(id: number): boolean {
		return (id in this._nodes_data);
	}
}
