import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NodesComponent } from './nodes/main-view/nodes.component';
import { SettingsDashboardComponent } from './settings/dashboard/dashboard.component';
import { NetworkViewComponent } from './network/view/network-view.component';
import { ConfigViewComponent } from './config/view/config-view.component';
import { MetricsComponent } from './metrics/metrics.component';
import { DeviceListComponent } from './devices/device-list/device-list.component';
import { NodeDetailsTabComponent } from './nodes/details-drawer/node-details-tab/node-details-tab.component';


const routes: Routes = [
    { path: '', component: MetricsComponent },
    { path: 'nodes', component: NodesComponent },
    { path: 'network', component: SettingsDashboardComponent },
    { path: 'topology', component: NetworkViewComponent },
    { path: 'config', component: ConfigViewComponent },
    { path: 'metrics', component: MetricsComponent },
    { path: 'devices', component: DeviceListComponent, data: {animation: "Devices"} },
    { path: 'device-details', component: NodeDetailsTabComponent, data: {animation: "DeviceDetails"} },
    { path: '**', component: MetricsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
