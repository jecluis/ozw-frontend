import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map, catchError, finalize } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';


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
	paginator: MatPaginator;
	sort: MatSort;

	nodes_data: NetworkNode[] = [];
	private nodesSubject = new BehaviorSubject<NetworkNode[]>([]);

	constructor(private http: HttpClient) {
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
		const dataMutations = [
			this.nodesSubject,
			this.paginator.page,
			this.sort.sortChange
		];

		return merge(...dataMutations).pipe(map(() => {
			return this.getPagedData(this.getSortedData([...this.nodes_data]));
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
		const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
		return data.splice(startIndex, this.paginator.pageSize);
	}

	/**
	 * Sort the data (client-side). If you're using server-side sorting,
	 * this would be replaced by requesting the appropriate data from the
	 * server.
	 */
	private getSortedData(data: NetworkNode[]) {
		if (!this.sort.active || this.sort.direction === '') {
			return data;
		}

		return data.sort((a, b) => {
			const isAsc = this.sort.direction === 'asc';
			switch (this.sort.active) {
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


	_getNodes() {

		let nodes =
		this.http.get<NetworkNode[]>('/api/nodes')
		.pipe(
			catchError( () => merge([]) ),
			finalize( () => console.log("got nodes"))
		)
		.subscribe( nodes => {
			this.nodes_data = nodes;
			this.nodesSubject.next(this.nodes_data);
			console.log("got nodes: ", nodes);
		});
	}

	loadNodes() {
		this._getNodes();
	}

	clearNodes() {
		this.nodes_data = [];
		this.nodesSubject.next([]);
	}

}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: string | number, b: string | number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
