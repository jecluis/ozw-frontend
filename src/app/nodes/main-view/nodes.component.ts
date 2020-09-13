import { Component, ViewChild, OnInit } from '@angular/core';
import { NodesTableComponent } from '../table/nodes-table.component';
import { NetworkNode } from '../table/nodes-table-datasource';
import { NetworkService } from '../../network/service/network.service';

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

  network_state: string;

  ngOnInit() {
    this.network.get_state_observer()
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
  }

  getNetworkState(): string {
    return this.network.get_network_state().toString();
  }

  isNetworkAvailable(): boolean {
      return this.network.isAvailable();
  }

  constructor(private network: NetworkService) {}

}
