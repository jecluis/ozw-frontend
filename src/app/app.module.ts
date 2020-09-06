import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationComponent } from './navigation/navigation.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NodesTableComponent } from './nodes/table/nodes-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { NodeDetailsTabComponent } from './nodes/details-drawer/node-details-tab/node-details-tab.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { NodeDetailsTableComponent } from './nodes/details-drawer/node-details-table/node-details-table.component';
import { NodesComponent } from './nodes/main-view/nodes.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ControllerOperationsComponent } from './nodes/details-drawer/operations/controller-operations/controller-operations.component';
import { NodeOperationsComponent } from './nodes/details-drawer/operations/node-operations/node-operations.component';
import { HttpClientModule } from '@angular/common/http';
import { SettingsDashboardComponent } from './settings/dashboard/dashboard.component';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsNetworkComponent } from './settings/network/network.component';
import { SettingsOperationsComponent } from './settings/operations/operations.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    NodesTableComponent,
    NodeDetailsTabComponent,
    NodeDetailsTableComponent,
    NodesComponent,
    ControllerOperationsComponent,
    NodeOperationsComponent,
    SettingsDashboardComponent,
    SettingsNetworkComponent,
    SettingsOperationsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    HttpClientModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
    FlexLayoutModule,
	MatSnackBarModule,
	MatProgressSpinnerModule,
	MatProgressBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
