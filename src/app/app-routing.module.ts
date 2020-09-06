import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NodesComponent } from './nodes/main-view/nodes.component';
import { SettingsDashboardComponent } from './settings/dashboard/dashboard.component';


const routes: Routes = [
  { path: '', component: SettingsDashboardComponent },
  { path: 'nodes', component: NodesComponent },
  { path: 'settings', component: SettingsDashboardComponent },
  { path: '**', component: SettingsDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
