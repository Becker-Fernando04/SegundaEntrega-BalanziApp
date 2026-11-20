import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadChildren: () => import('../inicio/inicio.module').then(m => m.InicioPageModule)
      },
      {
        path: 'movimientos',
        loadChildren: () => import('../movimientos/movimientos.module').then(m => m.MovimientosPageModule)
      },
      {
        path: 'registros',
        loadChildren: () => import('../registros/registros.module').then(m => m.RegistrosPageModule)
      },
      {
        path: 'estadistica',
        loadChildren: () => import('../estadistica/estadistica.module').then(m => m.EstadisticaPageModule)
      },
      {
        path: 'presupuestos',
        loadChildren: () => import('../presupuestos/presupuestos.module').then(m => m.PresupuestosPageModule)
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
