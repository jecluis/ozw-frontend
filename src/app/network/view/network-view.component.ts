import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Edge, Node as NgxNode } from '@swimlane/ngx-graph';

@Component({
  selector: 'app-network-view',
  templateUrl: './network-view.component.html',
  styleUrls: ['./network-view.component.scss']
})
export class NetworkViewComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
	}

	ngAfterViewInit() {
		this.center$.next(true);
	}

	center$: Subject<boolean> = new Subject();

	public links: Edge[] = this.testGetNeighbors();
	public nodes: NgxNode[] = this.testGetNodes();



	testGetNeighbors(): Edge[] {
		return [
			{
				source: 'node1',
				target: 'node2'
			},
			{
				source: 'node1',
				target: 'node3'
			},
			{
				source: 'node1',
				target: 'node4'
			},
			{
				source: 'node2',
				target: 'node3'
			}
		]
	}

	testGetNodes(): NgxNode[] {
		return [
			{
				id: 'node1',
				label: 'Node 1',			  
			},
			{
				id: 'node2',
				label: 'Node 2'
			},
			{
				id: 'node3',
				label: 'Node 3'
			},
			{
				id: 'node4',
				label: 'Node 4'
			}
		]
	}

	_onClick(nodestr: string) {
		console.log("clicked node: ", nodestr);
	}
}
