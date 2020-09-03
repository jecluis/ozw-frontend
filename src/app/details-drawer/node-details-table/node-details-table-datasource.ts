import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map, catchError, finalize } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NetworkValue } from '../../types/Value';



/**
 * Data source for the NodeDetailsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class NodeDetailsTableDataSource
        extends DataSource<NetworkValue> {

	paginator: MatPaginator;
	sort: MatSort;

	node_details: NetworkValue[] = [];
	private node_details_subject =
		new BehaviorSubject<NetworkValue[]>([]);

	constructor(private http: HttpClient) {
		super();
	}

	/**
	 * Connect this data source to the table. The table will only update when
	 * the returned stream emits new items.
	 * @returns A stream of the items to be rendered.
	 */
	connect(): Observable<NetworkValue[]> {
		// Combine everything that affects the rendered data into one update
		// stream for the data-table to consume.
		const dataMutations = [
			this.node_details_subject,
			this.paginator.page,
			this.sort.sortChange
		];

		return merge(...dataMutations).pipe(map(() => {
			return this.getPagedData(
				this.getSortedData([...this.node_details]));
		}));
	}

	/**
	 *  Called when the table is being destroyed. Use this function, to clean up
	 * any open connections or free any held resources that were set up during connect.
	 */
	disconnect() {}

	/**
	 * Paginate the data (client-side). If you're using server-side pagination,
	 * this would be replaced by requesting the appropriate data from the
	 * server.
	 */
	private getPagedData(data: NetworkValue[]) {
		const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
		return data.splice(startIndex, this.paginator.pageSize);
	}

	/**
	 * Sort the data (client-side). If you're using server-side sorting,
	 * this would be replaced by requesting the appropriate data from the
	 * server.
	 */
	private getSortedData(data: NetworkValue[]) {
		if (!this.sort.active || this.sort.direction === '') {
			return data;
		}

		return data.sort((a, b) => {
			const isAsc = this.sort.direction === 'asc';
			switch (this.sort.active) {
				case 'label':
					return compare(a.value.label, b.value.label, isAsc);
				case 'units':
					return compare(a.value.units, b.value.units, isAsc);
				default: return 0;
			}
		});
	}

	loadDetails(node_id: number, scope: string) {

		if (typeof node_id !== "number" || typeof scope !== "string" ||
			node_id <= 0 || scope.length == 0) {
		return;
		}

		let endpoint = '/api/nodes/'+node_id+'/values/genre/'+scope;
		let node_details =
		this.http.get<NetworkValue[]>(endpoint)
		.pipe(
			catchError( () => merge([]) ),
			finalize( () => console.log("got node scope"))
		)
		.subscribe( values => {
			this.node_details = values;
			console.log("values = ", values);
			this.node_details_subject.next(this.node_details);
		});
	}
}

/**
 * Simple sort comparator for example ID/Name columns (for client-side
 * sorting).
 */
function compare(a: string | number, b: string | number, isAsc: boolean) {
	return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
