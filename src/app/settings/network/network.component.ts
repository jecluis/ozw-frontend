import { Component, OnInit } from '@angular/core';
import { NetworkService, SimpleStatusItem } from 'src/app/network/network.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class SettingsNetworkComponent implements OnInit {

	constructor(
		private network: NetworkService,
		private action_snack: MatSnackBar
	) { }

	network_state: string = "unknown";
	driver_state: string = "unknown";
	network_status: SimpleStatusItem = undefined;

	ngOnInit(): void {
		this.network.get_simplestatus_observer()
		.subscribe( status => {
			console.log("settings > updating network status to ", status);
			if (!!status) {
				this.network_status = status;
				this.network_state = status.network_state;
				this.driver_state = status.driver_state;
			}
		});
	}

	startNetwork() {
		console.info("start network")
		this.network.startNetwork()
		.subscribe(
			res => {
				console.log("started network");
				this.action_snack.open(
					"network is starting. Please wait...",
					"Thanks!", {duration: 5000}
				);
				this.network.refresh_state();
			},
			err => {
				console.log("error starting network: ", err.error.detail);
				this.action_snack.open(
					"error starting network: "+err.error.detail,
					"Gotcha!", { duration: 10000 });
			}
		)      
	}


	stopNetwork() {
		console.info("stop network")
		this.network.stopNetwork()
		.subscribe(
			res => {
				console.log("stopped network");
				this.action_snack.open(
					"network is stopping. Please wait...",
					"Thanks!", {duration: 5000}
				);
				this.network.refresh_state();
			},
			err => {
				console.log("error stopping network: ", err.error.detail);
				this.action_snack.open(
					"error stopping network: "+err.error.detail,
					"Gotcha!", { duration: 10000}
				);
			}
		  )
	  }
}
