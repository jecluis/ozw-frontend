import { AfterViewInit, Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { NodesTableDataSource, NetworkNode } from './nodes-table-datasource';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { NetworkService } from '../../network/network.service';

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
  ]
})
export class NodesTableComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<NetworkNode>;
  dataSource: NodesTableDataSource;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = [
      'id', 'product', 'type', 'state', 'capabilities',
      'lastseen', 'metering', 'insights'
  ];
  expandedNode: NetworkNode | null;

  @Output() selected_node = new EventEmitter<NetworkNode>();

  private data_update_subscription: Subscription;
  current_network_state: string = 'unknown';

  constructor(
    private http: HttpClient,
    private network: NetworkService) { }

  ngOnInit() {
    this.dataSource = new NodesTableDataSource(this.http);
    this.load_nodes();

    this.data_update_subscription = interval(20000).subscribe(
      (val) => { this.load_nodes_fenced(); }
    );

    this.network.get_state_observer()
      .subscribe( state => {
        if (state !== this.current_network_state) {
          this.current_network_state = state;
          this.load_nodes_fenced();
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  details_n = 0;
  show_details = false;
  toggle_details(node: NetworkNode) {
    console.log("toggle details for node: ", node);
    this.selected_node.next(node);
  }

  private load_nodes() {
    this.dataSource.loadNodes();
  }

  // fencing to prevent hammering the server, but we still want to
  // allow the initial state to be attempted to be loaded regardless.
  private load_nodes_fenced() {
    if (this.network.isReady() || this.network.isStarted()) {
      this.load_nodes();
    } else {
      this.dataSource.clearNodes();
    }
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

  public getTypeOf(val) {
	  return typeof val;
  }
}
