import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { DatabaseService, Movimiento } from '../services/database.service';
import { LanguageService, Traducciones } from '../services/language.service';
import { estaDentroDelUltimoAno } from './movimientos-date';
import { Subscription } from 'rxjs';

const TODAS_LAS_CATEGORIAS = '__todas__';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.page.html',
  styleUrls: ['./movimientos.page.scss'],
  standalone: false,
})
export class MovimientosPage implements OnInit, OnDestroy {

  busqueda: string = '';
  filtroSeleccionado: 'todos' | 'ingresos' | 'gastos' = 'todos';
  categoriaSeleccionada: string | null = null;
  todosLosMovimientos: Movimiento[] = [];

  private movimientosFiltradosCache: Movimiento[] = [];
  private movimientosRecientesCache: Movimiento[] = [];
  private movimientosAnterioresCache: Movimiento[] = [];
  private cacheOrigen: Movimiento[] | null = null;
  private cacheFiltro: 'todos' | 'ingresos' | 'gastos' = 'todos';
  private cacheCategoria: string | null = null;
  private cacheBusqueda: string = '';
  private cacheDia: string = '';

  // Estado del modal de edición
  isModalEdicionOpen: boolean = false;
  movimientoEnEdicion: Movimiento | null = null;
  editTipo: 'gasto' | 'ingreso' = 'gasto';
  editMonto: number | null = null;
  editCategoria: string = '';
  editDescripcion: string = '';
  editFecha: string = '';
  editMetodoPago: string = '';

  categoriasGasto: string[] = [
    'Alimentación',
    'Transporte',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Otros Gastos'
  ];

  categoriasIngreso: string[] = [
    'Salario',
    'Honorarios',
    'Ventas',
    'Inversiones',
    'Transferencias',
    'Otros Ingresos'
  ];

  metodosPago: string[] = [
    'Efectivo',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Transferencia Bancaria',
    'Billetera Virtual'
  ];

  get categoriasDisponibles(): string[] {
    return this.editTipo === 'gasto' ? this.categoriasGasto : this.categoriasIngreso;
  }

  get t(): Traducciones {
    return this.langService.t;
  }

  private subs: Subscription = new Subscription();

  constructor(
    private dbService: DatabaseService,
    public langService: LanguageService,
    private alertController: AlertController,
    private toastController: ToastController,
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
    await this.cargarMovimientos();
  }

  async seleccionarFiltro(filtro: 'todos' | 'ingresos' | 'gastos'): Promise<void> {
    this.ngZone.run(() => {
      this.filtroSeleccionado = filtro;
      const categorias = filtro === 'ingresos' ? this.categoriasIngreso : this.categoriasGasto;
      if (filtro === 'todos' || (this.categoriaSeleccionada && !categorias.includes(this.categoriaSeleccionada))) {
        this.categoriaSeleccionada = null;
      }
      this.invalidarCacheMovimientos();
      this.cdr.detectChanges();
    });

    if (filtro === 'todos') {
      return;
    }

    const categorias = filtro === 'ingresos' ? this.categoriasIngreso : this.categoriasGasto;
    const alert = await this.alertController.create({
      header: this.t.filtrarPorCategoria,
      subHeader: filtro === 'ingresos' ? this.t.filtroIngresos : this.t.filtroGastos,
      inputs: [
        {
          type: 'radio',
          label: this.t.todasLasCategorias,
          value: TODAS_LAS_CATEGORIAS,
          checked: this.categoriaSeleccionada === null
        },
        ...categorias.map(categoria => ({
          type: 'radio' as const,
          label: this.langService.traducirCategoria(categoria),
          value: categoria,
          checked: this.categoriaSeleccionada === categoria
        }))
      ],
      buttons: [
        { text: this.t.cancelar, role: 'cancel' },
        {
          text: this.t.aplicar,
          handler: (valor: string) => {
            this.ngZone.run(() => {
              this.categoriaSeleccionada = valor === TODAS_LAS_CATEGORIAS ? null : valor;
              this.invalidarCacheMovimientos();
              this.cdr.detectChanges();
            });
          }
        }
      ]
    });

    await alert.present();
    await alert.onDidDismiss();
    this.ngZone.run(() => {
      this.invalidarCacheMovimientos();
      this.cdr.detectChanges();
    });
  }

  async cargarMovimientos() {
    const list = await this.dbService.getMovimientos();
    this.ngZone.run(() => {
      this.todosLosMovimientos = list;
      this.cdr.detectChanges();
    });
  }

  get movimientosFiltrados(): Movimiento[] {
    this.actualizarCacheMovimientos();
    return this.movimientosFiltradosCache;
  }

  get movimientosRecientes(): Movimiento[] {
    this.actualizarCacheMovimientos();
    return this.movimientosRecientesCache;
  }

  get movimientosAnteriores(): Movimiento[] {
    this.actualizarCacheMovimientos();
    return this.movimientosAnterioresCache;
  }

  private actualizarCacheMovimientos(): void {
    const busquedaNormalizada = this.busqueda.trim().toLowerCase();
    const hoy = new Date();
    const diaActual = hoy.toDateString();
    if (
      this.cacheOrigen === this.todosLosMovimientos &&
      this.cacheFiltro === this.filtroSeleccionado &&
      this.cacheCategoria === this.categoriaSeleccionada &&
      this.cacheBusqueda === busquedaNormalizada &&
      this.cacheDia === diaActual
    ) {
      return;
    }

    let list = this.todosLosMovimientos;

    if (this.filtroSeleccionado === 'ingresos') {
      list = list.filter(m => m.tipo === 'ingreso');
    } else if (this.filtroSeleccionado === 'gastos') {
      list = list.filter(m => m.tipo === 'gasto');
    }

    if (this.categoriaSeleccionada) {
      list = list.filter(m => m.categoria === this.categoriaSeleccionada);
    }

    if (busquedaNormalizada) {
      const q = busquedaNormalizada;
      list = list.filter(m =>
        m.descripcion.toLowerCase().includes(q) ||
        m.categoria.toLowerCase().includes(q) ||
        (m.fecha && m.fecha.toLowerCase().includes(q))
      );
    }

    this.cacheOrigen = this.todosLosMovimientos;
    this.cacheFiltro = this.filtroSeleccionado;
    this.cacheCategoria = this.categoriaSeleccionada;
    this.cacheBusqueda = busquedaNormalizada;
    this.cacheDia = diaActual;
    this.movimientosFiltradosCache = list;
    this.movimientosRecientesCache = list
      .filter(movimiento => estaDentroDelUltimoAno(movimiento.fecha, hoy))
      .slice(0, 3);
    const recientes = new Set(this.movimientosRecientesCache);
    this.movimientosAnterioresCache = list.filter(movimiento => !recientes.has(movimiento));
  }

  private invalidarCacheMovimientos(): void {
    this.cacheOrigen = null;
  }

  // --- MODIFICACIÓN DE MOVIMIENTO ---

  abrirModalEditar(item: Movimiento) {
    this.movimientoEnEdicion = { ...item };
    this.editTipo = item.tipo;
    this.editMonto = item.monto;
    this.editCategoria = item.categoria;
    this.editDescripcion = item.descripcion;
    this.editMetodoPago = item.metodo_pago || 'Efectivo';

    // Normalizar fecha al formato ISO YYYY-MM-DD para el input type="date"
    let fechaNorm = item.fecha || '';
    if (!fechaNorm.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const p = this.dbService.parseFecha(item.fecha);
      const mStr = String(p.month + 1).padStart(2, '0');
      fechaNorm = `${p.year}-${mStr}-15`;
    }
    this.editFecha = fechaNorm;

    this.isModalEdicionOpen = true;
  }

  cerrarModalEditar() {
    this.isModalEdicionOpen = false;
    this.movimientoEnEdicion = null;
  }

  onTipoEditChange() {
    // Si cambia de gasto a ingreso o viceversa, asegurar que la categoría pertenezca a la nueva lista
    if (!this.categoriasDisponibles.includes(this.editCategoria)) {
      this.editCategoria = this.categoriasDisponibles[0] || '';
    }
  }

  async guardarEdicion() {
    if (!this.movimientoEnEdicion || !this.movimientoEnEdicion.id) {
      await this.mostrarToast(this.t.movimientoNoEncontrado, 'danger');
      return;
    }

    if (!this.editMonto || this.editMonto <= 0) {
      await this.mostrarToast(this.t.montoInvalido, 'warning');
      return;
    }

    if (!this.editCategoria) {
      await this.mostrarToast(this.t.seleccionarCategoriaMensaje, 'warning');
      return;
    }

    const desc = this.editDescripcion.trim() || this.editCategoria;
    const metodo = this.editMetodoPago || 'Efectivo';

    try {
      await this.dbService.updateMovimiento({
        id: this.movimientoEnEdicion.id,
        tipo: this.editTipo,
        monto: Number(this.editMonto),
        categoria: this.editCategoria,
        descripcion: desc,
        fecha: this.editFecha,
        metodo_pago: metodo
      });

      this.cerrarModalEditar();
      await this.mostrarToast(this.t.movimientoActualizado, 'success');
    } catch (error: any) {
      console.error('Error al actualizar movimiento en SQLite:', error);
      await this.mostrarToast(`${this.t.errorActualizar} ${error?.message || error}`, 'danger');
    }
  }

  // --- ELIMINACIÓN DE MOVIMIENTO ---

  async confirmarEliminar(item: Movimiento) {
    const alert = await this.alertController.create({
      header: this.t.eliminarMovimientoTitulo,
      subHeader: `${this.langService.traducirDescripcion(item.descripcion)} ($ ${item.monto})`,
      message: this.t.confirmarEliminarMovimiento,
      buttons: [
        {
          text: this.t.cancelar,
          role: 'cancel'
        },
        {
          text: this.t.eliminar,
          role: 'destructive',
          handler: async () => {
            if (item.id) {
              await this.eliminarMovimiento(item.id);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarMovimiento(id: number) {
    try {
      await this.dbService.deleteMovimiento(id);
      await this.mostrarToast(this.t.movimientoEliminado, 'success');
    } catch (error: any) {
      console.error('Error al eliminar movimiento de SQLite:', error);
      await this.mostrarToast(this.t.errorEliminarMovimiento, 'danger');
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

}
