import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DatabaseService, Movimiento } from '../services/database.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.page.html',
  styleUrls: ['./movimientos.page.scss'],
  standalone: false,
})
export class MovimientosPage implements OnInit, OnDestroy {

  busqueda: string = '';
  filtroSeleccionado: string = 'todos';
  todosLosMovimientos: Movimiento[] = [];
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
          this.cargarMovimientos();
        }
      })
    );

    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarMovimientos();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.cargarMovimientos();
  }

  async cargarMovimientos() {
    const list = await this.dbService.getMovimientos();
    this.ngZone.run(() => {
      this.todosLosMovimientos = list;
      this.cdr.detectChanges();
    });
  }

  get movimientosFiltrados(): Movimiento[] {
    let list = this.todosLosMovimientos;

    if (this.filtroSeleccionado === 'ingresos') {
      list = list.filter(m => m.tipo === 'ingreso');
    } else if (this.filtroSeleccionado === 'gastos') {
      list = list.filter(m => m.tipo === 'gasto');
    }

    if (this.busqueda && this.busqueda.trim() !== '') {
      const q = this.busqueda.toLowerCase().trim();
      list = list.filter(m =>
        m.descripcion.toLowerCase().includes(q) ||
        m.categoria.toLowerCase().includes(q)
      );
    }

    return list;
  }

  get movimientosRecientes(): Movimiento[] {
    return this.movimientosFiltrados.slice(0, 3);
  }

  get movimientosAnteriores(): Movimiento[] {
    return this.movimientosFiltrados.slice(3);
  }

}
