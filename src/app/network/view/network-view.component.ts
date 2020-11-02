/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Component, OnInit } from '@angular/core';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { Edge, Node as NgxNode } from '@swimlane/ngx-graph';
import { NetworkNode } from '../../types/Node';
import { NodesService, NodeNeighbors } from '../../nodes/service/nodes-service.service';

@Component({
  selector: 'app-network-view',
  templateUrl: './network-view.component.html',
  styleUrls: ['./network-view.component.scss']
})
export class NetworkViewComponent implements OnInit {

	constructor(private _nodes_svc: NodesService) { }

	private _network_nodes: {[id: number]: NetworkNode[]} = {};
	private _network_node_by_id: {[id: number]: NetworkNode} = {};
	private _nodes_observer: BehaviorSubject<NetworkNode[]> =
		this._nodes_svc.getNodes();
	private _node_neighbors_observer: BehaviorSubject<NodeNeighbors> =
		this._nodes_svc.getNodeNeighbors();
	
	private _nodes_observer_subscription?: Subscription = undefined;
	private _node_neighbors_subscription?: Subscription = undefined;

	ngOnInit(): void {
		console.debug("network-view: on init");
		this._node_neighbors_subscription =
			this._node_neighbors_observer.subscribe(
				this._createGraph.bind(this));
		this._nodes_observer_subscription =
			this._nodes_observer.subscribe(this._handleNodes.bind(this));
	}

	ngAfterViewInit() {
		this.center$.next(true);
		this.zoomToFit$.next(true);
	}

	ngOnDestroy() {
		console.debug("network-view: destroy component");
		if (this._node_neighbors_subscription) {
			this._node_neighbors_subscription.unsubscribe();
		}
		if (this._nodes_observer_subscription) {
			this._nodes_observer_subscription.unsubscribe();
		}
	}

	center$: Subject<boolean> = new Subject();
	update$: Subject<boolean> = new Subject();
	zoomToFit$: Subject<boolean> = new Subject();

	private edge_accounting: {[id: string]: boolean} = {};
	public nodes: NgxNode[] = [];
	public edges: Edge[] = [];

	private _handleNodes(nodes: NetworkNode[]): void {

		if (nodes.length <= Object.keys(this._network_nodes).length) {
			return;
		}

		let new_nodes = [];
		nodes.forEach( (node: NetworkNode) => {
			if (node.id in this._network_nodes) {
				return;
			}
			new_nodes.push({
				id: `${node.id}`,
				label: `node ${node.id}`
			});
			this._network_nodes[node.id] = [];
			this._network_node_by_id[node.id] = node;
		});

		if (new_nodes.length > 0) {
			this.nodes = [...this.nodes, ...new_nodes];
			this.center$.next(true);
			this.zoomToFit$.next(true);
		}
	}

	private last_update: number = new Date(0).getTime();
	private new_edges: Edge[] = [];

	private _createGraph(node_neighbors: NodeNeighbors): void {
		// return;
		console.debug("network-view: create graph for ", node_neighbors);
		if (!node_neighbors) {
			return;
		}

		let nodeid: string = `${node_neighbors.node.id}`;
		if (!(nodeid in this._network_nodes)) {
			console.debug(`network-view: node ${nodeid} not found`);
			return;
		}

		// let new_edges: Edge[] = [];
		node_neighbors.neighbors.forEach( (neighbor) => {
			let neighborid: string = `${neighbor.id}`;
			if (!(neighborid in this._network_nodes)) {
				console.debug(`network-view: neighbor ${neighborid} not found`);
				return;
			}

			let edge_str_a = `${nodeid}/${neighborid}`;
			let edge_str_b = `${neighborid}/${nodeid}`;
			if (edge_str_a in this.edge_accounting) {
				return;
			}
			this.edge_accounting[edge_str_a] = true;
			this.edge_accounting[edge_str_b] = true;
			this.new_edges.push({
				source: nodeid,
				target: neighborid
			});
		});
		let now: number = new Date().getTime();
		if (now - this.last_update < 500) { return; }
		this.last_update = now;

		if (this.new_edges.length == 0) { return; }

		this.edges = [...this.edges, ...this.new_edges];
		this.new_edges = [];
		console.log("total edges: ", this.edges);
		// this.update$.next(true);
		this.center$.next(true);
		this.zoomToFit$.next(true);
	}

	_onClick(nodestr: string) {
		console.log("clicked node: ", nodestr);
	}

	public isController(nodeidstr: string) {
		if (!(nodeidstr in this._network_node_by_id)) {
			console.error(`unable to find node ${nodeidstr} in memory`);
			return false;
		}

		let node: NetworkNode = this._network_node_by_id[nodeidstr];
		return (node.capabilities.is_controller);
	}
}
