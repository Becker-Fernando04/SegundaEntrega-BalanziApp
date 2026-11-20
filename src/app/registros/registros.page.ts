import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-registros',
  templateUrl: './registros.page.html',
  styleUrls: ['./registros.page.scss'],
  standalone: false,
})
export class RegistrosPage implements OnInit {

  tipoMovimiento: 'gasto' | 'ingreso' = 'gasto';
  monto: number | null = null;
  categoria: string = '';
  descripcion: string = '';
  fecha: string = '';
  metodoPago: string = '';

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
    return this.tipoMovimiento === 'gasto' ? this.categoriasGasto : this.categoriasIngreso;
  }

  constructor(
    private dbService: DatabaseService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.fecha = new Date().toISOString().split('T')[0];
  }

  async guardar() {
    if (!this.monto || this.monto <= 0) {
      await this.mostrarMensaje('Por favor, ingresa un monto válido mayor a 0', 'warning');
      return;
    }

    if (!this.categoria) {
      await this.mostrarMensaje('Por favor, selecciona una categoría', 'warning');
      return;
    }

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

      await this.mostrarMensaje(`¡${this.tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'} guardado en SQLite con éxito!`, 'success');

      // Limpiar formulario para el próximo registro
      this.monto = null;
      this.descripcion = '';
      this.categoria = '';
      this.metodoPago = '';
    } catch (error: any) {
      console.error('Error detallado al guardar en SQLite:', error);
      const detalle = error?.message || (typeof error === 'string' ? error : 'Error al guardar en la base de datos');
      await this.mostrarMensaje(`Error: ${detalle}`, 'danger');
    }
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
