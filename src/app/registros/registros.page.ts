import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { DatabaseService, MetaAhorro } from '../services/database.service';
import { LanguageService, Traducciones } from '../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registros',
  templateUrl: './registros.page.html',
  styleUrls: ['./registros.page.scss'],
  standalone: false,
})
export class RegistrosPage implements OnInit, OnDestroy {

  tipoMovimiento: 'gasto' | 'ingreso' = 'gasto';
  monto: number | null = null;
  categoria: string = '';
  descripcion: string = '';
  fecha: string = '';
  metodoPago: string = '';

  // Modal de metas de ahorro
  isModalMetasOpen: boolean = false;
  metasAhorro: MetaAhorro[] = [];
  nuevaMetaNombre: string = '';
  nuevaMetaObjetivo: number | null = null;
  mostrarFormNuevaMeta: boolean = false;
  montoAhorroTemp: number = 0;

  private subs: Subscription = new Subscription();

  get t(): Traducciones {
    return this.langService.t;
  }

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
    'Ahorro',
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
    return this.tipoMovimiento === 'gasto' ? this.categoriasGasto : this.categoriasIngreso;
  }

  get esAhorro(): boolean {
    return this.tipoMovimiento === 'ingreso' && this.categoria === 'Ahorro';
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
    this.fecha = new Date().toISOString().split('T')[0];

    this.subs.add(
      this.dbService.isReady$.subscribe(ready => {
        if (ready) this.cargarMetas();
      })
    );
    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarMetas();
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

  async cargarMetas() {
    const metas = await this.dbService.getMetasAhorro();
    this.ngZone.run(() => {
      this.metasAhorro = metas;
      this.cdr.detectChanges();
    });
  }

  onCategoriaChange() {
    // Si se selecciona Ahorro como ingreso, limpiar la categoría para que se vea el modal al guardar
  }

  async guardar() {
    if (!this.monto || this.monto <= 0) {
      await this.mostrarMensaje(this.t.montoInvalido, 'warning');
      return;
    }

    if (!this.categoria) {
      await this.mostrarMensaje(this.t.seleccionarCategoriaMensaje, 'warning');
      return;
    }

    // Si es un ingreso de tipo Ahorro, mostrar modal de selección de meta
    if (this.esAhorro) {
      await this.cargarMetas();
      this.montoAhorroTemp = Number(this.monto);
      this.isModalMetasOpen = true;
      this.mostrarFormNuevaMeta = false;
      this.nuevaMetaNombre = '';
      this.nuevaMetaObjetivo = null;
      return;
    }

    await this.ejecutarGuardado();
  }

  async ejecutarGuardado() {
    const desc = this.descripcion.trim() || this.categoria;
    const metodo = this.metodoPago || 'Efectivo';

    try {
      await this.dbService.addMovimiento({
        tipo: this.tipoMovimiento,
        monto: Number(this.monto),
        categoria: this.categoria,
        descripcion: desc,
        fecha: this.fecha,
        metodo_pago: metodo
      });

      await this.mostrarMensaje(
        this.tipoMovimiento === 'ingreso' ? this.t.ingresoGuardado : this.t.gastoGuardado,
        'success'
      );

      this.monto = null;
      this.descripcion = '';
      this.categoria = '';
      this.metodoPago = '';
    } catch (error: any) {
      console.error('Error al guardar en SQLite:', error);
      await this.mostrarMensaje('Error: ' + (error?.message || this.t.errorGuardarMovimiento), 'danger');
    }
  }

  // ---- MODAL DE METAS DE AHORRO ----

  cerrarModalMetas() {
    this.isModalMetasOpen = false;
    this.mostrarFormNuevaMeta = false;
  }

  toggleFormNuevaMeta() {
    this.mostrarFormNuevaMeta = !this.mostrarFormNuevaMeta;
  }

  async seleccionarMeta(meta: MetaAhorro) {
    const monto = this.montoAhorroTemp;

    const alert = await this.alertController.create({
      header: `${this.t.aportarA} "${this.langService.traducirNombreMeta(meta.nombre)}"`,
      message: `${this.t.confirmarAporte} $${monto.toLocaleString()} ${this.langService.idiomaActual === 'en' ? 'to this goal?' : 'a esta meta?'}\n\n${this.t.progresoActual} $${meta.actual.toLocaleString()} / $${meta.objetivo.toLocaleString()}`,
      buttons: [
        { text: this.t.cancelar, role: 'cancel' },
        {
          text: this.t.confirmar,
          handler: async () => {
            await this.realizarAporte(meta.id!, monto, meta.nombre);
          }
        }
      ]
    });
    await alert.present();
  }

  async realizarAporte(metaId: number, monto: number, nombreMeta: string) {
    try {
      // Aportar a la meta de ahorro
      await this.dbService.aportarAMeta(metaId, monto);

      // Registrar también como ingreso en movimientos
      const desc = this.descripcion.trim() || `${this.langService.idiomaActual === 'en' ? 'Savings' : 'Ahorro'} → ${nombreMeta}`;
      await this.dbService.addMovimiento({
        tipo: 'ingreso',
        monto,
        categoria: 'Ahorro',
        descripcion: desc,
        fecha: this.fecha,
        metodo_pago: this.metodoPago || 'Efectivo',
        icono: 'star-outline'
      });

      this.cerrarModalMetas();
      await this.cargarMetas();

      await this.mostrarMensaje(`$${monto.toLocaleString()} ${this.t.aporteRealizado} "${this.langService.traducirNombreMeta(nombreMeta)}"! 🎉`, 'success');

      this.monto = null;
      this.descripcion = '';
      this.categoria = '';
      this.metodoPago = '';
    } catch (error: any) {
      console.error('Error al aportar a meta:', error);
      await this.mostrarMensaje(`${this.t.errorAporte} ${error?.message || error}`, 'danger');
    }
  }

  async crearNuevaMetaYAportar() {
    if (!this.nuevaMetaNombre.trim()) {
      await this.mostrarMensaje(this.t.nombreMetaRequerido, 'warning');
      return;
    }
    if (!this.nuevaMetaObjetivo || this.nuevaMetaObjetivo <= 0) {
      await this.mostrarMensaje(this.t.objetivoMetaRequerido, 'warning');
      return;
    }

    try {
      await this.dbService.addMetaAhorro({
        nombre: this.nuevaMetaNombre.trim(),
        actual: 0,
        objetivo: Number(this.nuevaMetaObjetivo),
        icono: 'star-outline',
        color: 'primary'
      });

      await this.cargarMetas();
      const metaCreada = this.metasAhorro.find(m => m.nombre === this.nuevaMetaNombre.trim());

      if (metaCreada && metaCreada.id) {
        await this.realizarAporte(metaCreada.id, this.montoAhorroTemp, metaCreada.nombre);
      } else {
        // La meta se creó pero no se pudo recuperar aún, buscar por nombre
        const metasActualizadas = await this.dbService.getMetasAhorro();
        const metaFinal = metasActualizadas.find(m => m.nombre === this.nuevaMetaNombre.trim());
        if (metaFinal && metaFinal.id) {
          await this.realizarAporte(metaFinal.id, this.montoAhorroTemp, metaFinal.nombre);
        }
      }

      this.mostrarFormNuevaMeta = false;
      this.nuevaMetaNombre = '';
      this.nuevaMetaObjetivo = null;
    } catch (error: any) {
      await this.mostrarMensaje(`${this.t.errorCrearMeta} ${error?.message || error}`, 'danger');
    }
  }

  porcentajeMeta(meta: MetaAhorro): number {
    if (!meta.objetivo || meta.objetivo <= 0) return 0;
    return Math.min(Math.round((meta.actual / meta.objetivo) * 100), 100);
  }

  private async mostrarMensaje(mensaje: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}
