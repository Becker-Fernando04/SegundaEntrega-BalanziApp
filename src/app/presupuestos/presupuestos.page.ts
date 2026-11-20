import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DatabaseService, Presupuesto, MetaAhorro } from '../services/database.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-presupuestos',
  templateUrl: './presupuestos.page.html',
  styleUrls: ['./presupuestos.page.scss'],
  standalone: false,
})
export class PresupuestosPage implements OnInit, OnDestroy {

  presupuestoActivo: Presupuesto = {
    nombre: 'Noviembre 2026',
    mes: 'Noviembre',
    total: 200000,
    gastado: 0
  };

  metasAhorro: MetaAhorro[] = [];
  private subs: Subscription = new Subscription();

  constructor(
    private dbService: DatabaseService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.subs.add(
      this.dbService.isReady$.subscribe(ready => {
        if (ready) {
          this.cargarPresupuestos();
        }
      })
    );

    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarPresupuestos();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.cargarPresupuestos();
  }

  async cargarPresupuestos() {
    const pres = await this.dbService.getPresupuestoActivo();
    const metas = await this.dbService.getMetasAhorro();

    this.ngZone.run(() => {
      this.presupuestoActivo = pres;
      this.metasAhorro = metas;
      this.cdr.detectChanges();
    });
  }

}
