import { Component, ViewChild, OnInit } from '@angular/core';
import { NodesTableComponent } from '../table/nodes-table.component';
import { NetworkNode } from '../../types/Node';
import { NetworkService } from '../../network/service/network.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NodesService } from '../service/nodes-service.service';

@Component({
	selector: 'app-nodes',
	templateUrl: './nodes.component.html',
	styleUrls: ['./nodes.component.scss']
})
export class NodesComponent implements OnInit {

	@ViewChild(NodesTableComponent) nodes_table: NodesTableComponent;

	is_drawer_open: boolean = false;
	show_details_node_id: number;
	show_details_is_controller: boolean;
	show_name: string;
	edit_name: boolean = false;
	edit_name_form_group = new FormGroup({
		ctrl: new FormControl('', [Validators.required])
	});

	network_state: string;

	ngOnInit() {
		this.network.getStateObserver()
		.subscribe( state => {
			console.log("nodes > updating network state to ", state)
			this.network_state = state;
		});
	}

	close_drawer() {
		console.log("close node details drawer");
		console.log("  state > open: ", this.is_drawer_open,
					", details node: ", this.show_details_node_id);
		this.is_drawer_open = false;
		this.show_details_node_id = -1;
	}

	open_node_details(event: NetworkNode) {
		console.log("open node details drawer > id = " + event.id)
		console.log("  state > open: ", this.is_drawer_open,
					", details node: ", this.show_details_node_id);

		let node_id: number = event.id;
		this.is_drawer_open = true;
		this.show_details_node_id = node_id;
		this.show_details_is_controller = 
			(event.capabilities['is_controller'] === true);

		let node: NetworkNode = this._nodes_svc.getNodeById(node_id);
		this.show_name = node.info.name;
		if (!this.show_name || this.show_name === "") {
			this.show_name = `Node ${this.show_details_node_id}`;
		}
		this.edit_name_form_group.patchValue({
			ctrl: this.show_name
		});
	}

	getNetworkState(): string {
		return this.network.get_network_state().toString();
	}

	isNetworkAvailable(): boolean {
		return this.network.isAvailable();
	}

	public setName(): void {
		let new_name: string = this.edit_name_form_group.value['ctrl'];
		if (!new_name || new_name === "") {
			this.edit_name = false;
			return;
		}
		if (this._nodes_svc.setNodeName(this.show_details_node_id, new_name)) {
			this.show_name = new_name;
			this.edit_name = false;
		}
	}


	constructor(
		private network: NetworkService,
		private _nodes_svc: NodesService) {}

}
