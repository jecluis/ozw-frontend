import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NodesComponent } from './nodes/main-view/nodes.component';
import { SettingsDashboardComponent } from './settings/dashboard/dashboard.component';
import { NetworkViewComponent } from './network/view/network-view.component';


const routes: Routes = [
  { path: '', component: SettingsDashboardComponent },
  { path: 'nodes', component: NodesComponent },
  { path: 'network', component: SettingsDashboardComponent },
  { path: 'topology', component: NetworkViewComponent },
  { path: '**', component: SettingsDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
