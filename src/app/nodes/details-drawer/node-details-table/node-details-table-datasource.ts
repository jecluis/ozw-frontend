import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map, catchError, finalize } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NetworkValue } from '../../../types/Value';
import { ValuesService, ScopeValues } from '../../service/values-service.service';



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
	private node_subject_subscription: Subscription = undefined;

	constructor(private _values_svc: ValuesService) {
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
	disconnect() {
		console.debug("details-datasource: disconnect");
		if (this.node_subject_subscription) {
			console.debug("details-datasource: unsubscribe");
			this.node_subject_subscription.unsubscribe();
		}

	}

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

		this.node_subject_subscription =
			this._values_svc.getValuesByScope(node_id, scope).subscribe(
				(scope_values: ScopeValues) => {

					if (!scope_values || scope_values.scope != scope) {
						return;
					}
					this.node_details = scope_values.values;
					this.node_details_subject.next(this.node_details);
					console.debug(`details-datasource: updated details for node ${node_id} with `, this.node_details);
				}
			);
	}

	public clearState(): void {
		console.log("details-datasource: clear state");
		if (this.node_subject_subscription) {
			console.log("details-datasource: unsubscribe");
			this.node_subject_subscription.unsubscribe();
			this.node_subject_subscription = undefined;
		}
		this.node_details = [];
		this.node_details_subject.next([]);
	}

	public getNodeDetailsSubject(): BehaviorSubject<NetworkValue[]> {
		return this.node_details_subject;
	}
}

/**
 * Simple sort comparator for example ID/Name columns (for client-side
 * sorting).
 */
function compare(a: string | number, b: string | number, isAsc: boolean) {
	return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
