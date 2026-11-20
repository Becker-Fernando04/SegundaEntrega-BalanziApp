import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DatabaseService, GastoCategoriaEstadistica, EvolucionMesEstadistica } from '../services/database.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-estadistica',
  templateUrl: './estadistica.page.html',
  styleUrls: ['./estadistica.page.scss'],
  standalone: false,
})
export class EstadisticaPage implements OnInit, OnDestroy {

  filtroEstadistica: string = 'todos';
  totalGastos: number = 0;
  gastosPorCategoria: GastoCategoriaEstadistica[] = [];
  evolucionMensual: EvolucionMesEstadistica[] = [];
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
          this.cargarEstadisticas();
        }
      })
    );

    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarEstadisticas();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    const balance = await this.dbService.getBalance();
    const categorias = await this.dbService.getGastosPorCategoria();
    const evolucion = await this.dbService.getEvolucionMensual();

    this.ngZone.run(() => {
      this.totalGastos = balance.gastos;
      this.gastosPorCategoria = categorias;
      this.evolucionMensual = evolucion;
      this.cdr.detectChanges();
    });
  }

}
