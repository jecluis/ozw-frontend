import {
    Component, OnInit, OnChanges, Input,
    Output, EventEmitter
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

export interface NodeDetailsTab {
    label: string;
    content: string;
}

@Component({
  selector: 'app-node-details-tab',
  templateUrl: './node-details-tab.component.html',
  styleUrls: ['./node-details-tab.component.scss']
})
export class NodeDetailsTabComponent implements OnInit, OnChanges {

    @Input() node_id: number;
    @Input() node_is_controller: boolean;
    @Output() close_details = new EventEmitter<boolean>();

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }


    public ngOnInit(): void {

        if (this.route.snapshot.paramMap.has("nodeid")) {
            this.node_id = +(this.route.snapshot.paramMap.get("nodeid"));
        }
        console.log("show details for node " + this.node_id);
    }

    public ngOnChanges(): void { }

    public closeDetails(): void {
        console.log("close details tabs");
        this.close_details.emit(true);
    }

}
