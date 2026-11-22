import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { DatabaseService, Presupuesto, MetaAhorro } from '../services/database.service';
import { LanguageService, Traducciones } from '../services/language.service';
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
    gastado: 0,
    periodo: 'mensual',
    totalMensual: 200000,
    totalTrimestral: 200000,
    totalAnual: 200000
  };

  metasAhorro: MetaAhorro[] = [];
  isModalIngresoMetaOpen = false;
  metaIngresoSeleccionada: MetaAhorro | null = null;
  montoIngresoMeta: number | null = null;
  categoriaIngresoMeta = 'Ahorro';
  descripcionIngresoMeta = '';
  fechaIngresoMeta = '';
  metodoPagoIngresoMeta = 'Efectivo';
  guardandoIngresoMeta = false;
  categoriasIngresoMeta = [
    'Salario',
    'Honorarios',
    'Ventas',
    'Inversiones',
    'Transferencias',
    'Ahorro',
    'Otros Ingresos'
  ];
  metodosPagoIngresoMeta = [
    'Efectivo',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Transferencia Bancaria',
    'Billetera Virtual'
  ];
  periodoSeleccionado: Presupuesto['periodo'] = 'mensual';
  montosPorPeriodo: Record<Presupuesto['periodo'], number> = {
    mensual: 200000,
    trimestral: 200000,
    anual: 200000
  };
  guardandoPresupuesto = false;
  private subs: Subscription = new Subscription();

  get t(): Traducciones {
    return this.langService.t;
  }

  get etiquetaPeriodoPresupuesto(): string {
    switch (this.periodoSeleccionado) {
      case 'trimestral':
        return this.t.presupuestoTrimestral;
      case 'anual':
        return this.t.presupuestoAnual;
      default:
        return this.t.presupuestoMensual;
    }
  }

  get tituloPeriodoPresupuesto(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();

    if (this.periodoSeleccionado === 'anual') {
      return String(anio);
    }

    if (this.periodoSeleccionado === 'trimestral') {
      const indiceTrimestre = Math.floor(ahora.getMonth() / 3);
      const trimestres = this.langService.idiomaActual === 'en'
        ? ['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter']
        : ['Primer Trimestre', 'Segundo Trimestre', 'Tercer Trimestre', 'Cuarto Trimestre'];
      return `${trimestres[indiceTrimestre]} ${anio}`;
    }

    return this.langService.traducirMes(this.presupuestoActivo.nombre);
  }

  get montoPresupuesto(): number {
    return this.montosPorPeriodo[this.periodoSeleccionado];
  }

  set montoPresupuesto(monto: number) {
    this.montosPorPeriodo[this.periodoSeleccionado] = Number(monto);
  }

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
          this.cargarPresupuestos();
        }
      })
    );

    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarPresupuestos();
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
    await this.cargarPresupuestos();
  }

  async cargarPresupuestos() {
    const pres = await this.dbService.getPresupuestoActivo();
    const metas = await this.dbService.getMetasAhorro();

    this.ngZone.run(() => {
      this.presupuestoActivo = pres;
      this.periodoSeleccionado = pres.periodo;
      this.montosPorPeriodo = {
        mensual: pres.totalMensual,
        trimestral: pres.totalTrimestral,
        anual: pres.totalAnual
      };
      this.metasAhorro = metas;
      this.cdr.detectChanges();
    });
  }

  async guardarPresupuesto(): Promise<void> {
    const monto = Number(this.montoPresupuesto);
    if (!Number.isFinite(monto) || monto <= 0) {
      await this.mostrarToast(this.t.montoPresupuestoInvalido, 'warning');
      return;
    }

    this.guardandoPresupuesto = true;
    try {
      await this.dbService.updatePresupuestoActivo(
        monto,
        this.periodoSeleccionado
      );
      await this.cargarPresupuestos();
      await this.mostrarToast(this.t.presupuestoGuardado, 'success');
    } catch (error) {
      console.error('Error al actualizar el presupuesto:', error);
      await this.mostrarToast(this.t.errorGuardarPresupuesto, 'danger');
    } finally {
      this.guardandoPresupuesto = false;
    }
  }

  porcentajeMeta(meta: MetaAhorro): number {
    if (meta.objetivo <= 0) return 0;
    return Math.min(Math.round((meta.actual / meta.objetivo) * 100), 100);
  }

  async editarTopeMeta(meta: MetaAhorro): Promise<void> {
    if (!meta.id) {
      await this.mostrarToast(this.t.errorActualizarTopeMeta, 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: `${this.t.editarTopeMeta}: ${this.langService.traducirNombreMeta(meta.nombre)}`,
      inputs: [
        {
          name: 'objetivo',
          type: 'number',
          label: this.t.montoObjetivo,
          value: String(meta.objetivo),
          min: '0.01'
        }
      ],
      buttons: [
        { text: this.t.cancelar, role: 'cancel' },
        {
          text: this.t.guardarCambios,
          handler: async (datos: { objetivo?: string | number }) => {
            const objetivo = Number(datos.objetivo);
            if (!Number.isFinite(objetivo) || objetivo <= 0) {
              await this.mostrarToast(this.t.objetivoMetaRequerido, 'warning');
              return false;
            }

            try {
              await this.dbService.updateMetaAhorro(meta.id!, objetivo);
              await this.cargarPresupuestos();
              await this.mostrarToast(this.t.topeMetaActualizado, 'success');
              return true;
            } catch (error) {
              console.error('Error al actualizar el objetivo de ahorro:', error);
              await this.mostrarToast(this.t.errorActualizarTopeMeta, 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  abrirModalIngresoMeta(meta: MetaAhorro): void {
    if (!meta.id) {
      return;
    }

    this.metaIngresoSeleccionada = meta;
    this.montoIngresoMeta = null;
    this.categoriaIngresoMeta = 'Ahorro';
    this.descripcionIngresoMeta = `${this.langService.idiomaActual === 'en' ? 'Savings' : 'Ahorro'} → ${meta.nombre}`;
    this.fechaIngresoMeta = this.fechaActualISO();
    this.metodoPagoIngresoMeta = 'Efectivo';
    this.isModalIngresoMetaOpen = true;
  }

  cerrarModalIngresoMeta(): void {
    this.isModalIngresoMetaOpen = false;
    this.metaIngresoSeleccionada = null;
  }

  async guardarIngresoMeta(): Promise<void> {
    const meta = this.metaIngresoSeleccionada;
    const monto = Number(this.montoIngresoMeta);
    if (!meta?.id) {
      await this.mostrarToast(this.t.errorAporte, 'danger');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      await this.mostrarToast(this.t.montoInvalido, 'warning');
      return;
    }
    if (monto > Math.max(meta.objetivo - meta.actual, 0)) {
      await this.mostrarToast(this.t.aporteSuperaLimiteMeta, 'warning');
      return;
    }
    if (!this.categoriasIngresoMeta.includes(this.categoriaIngresoMeta)) {
      await this.mostrarToast(this.t.seleccionarCategoriaMensaje, 'warning');
      return;
    }
    if (!this.fechaIngresoMeta || !this.metodoPagoIngresoMeta) {
      await this.mostrarToast(this.t.errorAporte, 'warning');
      return;
    }

    this.guardandoIngresoMeta = true;
    try {
      await this.dbService.aportarAMeta(meta.id, monto);
      await this.dbService.addMovimiento({
        tipo: 'ingreso',
        monto,
        categoria: this.categoriaIngresoMeta,
        descripcion: this.descripcionIngresoMeta.trim() || this.categoriaIngresoMeta,
        fecha: this.fechaIngresoMeta,
        metodo_pago: this.metodoPagoIngresoMeta,
        icono: this.categoriaIngresoMeta === 'Ahorro'
          ? 'star-outline'
          : this.dbService.obtenerIconoPorCategoria(this.categoriaIngresoMeta)
      });
      await this.cargarPresupuestos();
      this.cerrarModalIngresoMeta();
      await this.mostrarToast(
        `$${monto.toLocaleString()} ${this.t.aporteRealizado} "${this.langService.traducirNombreMeta(meta.nombre)}"!`,
        'success'
      );
    } catch (error) {
      console.error('Error al agregar un ingreso a la meta de ahorro:', error);
      await this.mostrarToast(this.t.errorAporte, 'danger');
    } finally {
      this.guardandoIngresoMeta = false;
    }
  }

  private fechaActualISO(): string {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

}
