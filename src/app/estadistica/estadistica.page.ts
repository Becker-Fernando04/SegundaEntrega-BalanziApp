import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DatabaseService, GastoCategoriaEstadistica, EvolucionMesEstadistica, EstadisticasResultado } from '../services/database.service';
import { LanguageService, Traducciones } from '../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-estadistica',
  templateUrl: './estadistica.page.html',
  styleUrls: ['./estadistica.page.scss'],
  standalone: false,
})
export class EstadisticaPage implements OnInit, OnDestroy {

  filtroEstadistica: 'todos' | 'mensual' | 'trimestral' | 'anual' = 'todos';
  totalGastos: number = 0;
  totalIngresos: number = 0;
  subtituloPeriodo: string = 'Distribución del período';
  subtituloEvolucion: string = 'Comparativa Ingresos vs Gastos';
  gastosPorCategoria: GastoCategoriaEstadistica[] = [];
  evolucionMensual: EvolucionMesEstadistica[] = [];

  private subs: Subscription = new Subscription();

  get t(): Traducciones {
    return this.langService.t;
  }

  get subtituloPeriodoTraducido(): string {
    const anio = new Date().getFullYear();
    if (this.filtroEstadistica === 'mensual') return `${this.t.estadisticaPeriodoMes} (${anio})`;
    if (this.filtroEstadistica === 'trimestral') return `${this.t.estadisticaPeriodoTrimestre} (${anio})`;
    if (this.filtroEstadistica === 'anual') {
      const sufijoAnio = this.langService.idiomaActual === 'es' ? `Año ${anio}` : anio;
      return `${this.t.estadisticaPeriodoAnual} ${sufijoAnio}`;
    }
    return this.t.estadisticaPeriodoTodo;
  }

  get subtituloEvolucionTraducido(): string {
    const anio = new Date().getFullYear();
    if (this.filtroEstadistica === 'mensual') return `${this.t.estadisticaEvolucionMes} (${anio})`;
    if (this.filtroEstadistica === 'anual') {
      const sufijoAnio = this.langService.idiomaActual === 'es' ? `Año ${anio}` : anio;
      return `${this.t.estadisticaEvolucionAnual} ${sufijoAnio}`;
    }
    if (this.filtroEstadistica === 'trimestral') return this.t.estadisticaEvolucionTrimestre;
    return this.t.estadisticaEvolucionTodo;
  }

  constructor(
    private dbService: DatabaseService,
    public langService: LanguageService,
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

    this.subs.add(
      this.langService.idiomaActual$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.cargarEstadisticas();
  }

  async cambiarFiltro(event?: any) {
    if (event && event.detail && event.detail.value) {
      this.filtroEstadistica = event.detail.value;
    }
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    try {
      const data: EstadisticasResultado = await this.dbService.getEstadisticasPorFiltro(this.filtroEstadistica);

      this.ngZone.run(() => {
        this.totalGastos = data.totalGastos;
        this.totalIngresos = data.totalIngresos;
        this.gastosPorCategoria = data.gastosPorCategoria;
        this.evolucionMensual = data.evolucion;
        this.subtituloPeriodo = data.subtituloPeriodo;
        this.subtituloEvolucion = data.subtituloEvolucion;
        this.cdr.detectChanges();
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }

}
