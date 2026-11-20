import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Movimiento {
  id?: number;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
  metodo_pago: string;
  icono?: string;
}

export interface Presupuesto {
  id?: number;
  nombre: string;
  mes: string;
  total: number;
  gastado: number;
}

export interface MetaAhorro {
  id?: number;
  nombre: string;
  actual: number;
  objetivo: number;
  icono: string;
  color: string;
}

export interface BalanceGeneral {
  balance: number;
  ingresos: number;
  gastos: number;
}

export interface GastoCategoriaEstadistica {
  categoria: string;
  monto: number;
  porcentaje: number;
  icono: string;
  color: string;
}

export interface EvolucionMesEstadistica {
  mes: string;
  ingresos: number;
  gastos: number;
  maximo: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly dbName: string = 'balanzi_db';

  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isReady$: Observable<boolean> = this.isReady.asObservable();

  private dataChanged: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  public dataChanged$: Observable<void> = this.dataChanged.asObservable();

  private initPromise: Promise<void> | null = null;

  constructor(private ngZone: NgZone) {}

  async init(): Promise<void> {
    if (this.isReady.value && this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const platform = Capacitor.getPlatform();

        if (platform === 'web') {
          await customElements.whenDefined('jeep-sqlite');
          const jeepEl = document.querySelector('jeep-sqlite');
          if (jeepEl) {
            await this.sqlite.initWebStore();
          }
        }

        const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
        if (isConn) {
          this.db = await this.sqlite.retrieveConnection(this.dbName, false);
        } else {
          this.db = await this.sqlite.createConnection(
            this.dbName,
            false,
            'no-encryption',
            1,
            false
          );
        }

        const isOpen = (await this.db.isDBOpen()).result;
        if (!isOpen) {
          await this.db.open();
        }

        await this.createTables();
        await this.seedInitialData();

        if (platform === 'web') {
          try {
            await this.sqlite.saveToStore(this.dbName);
          } catch (err) {
            console.warn('saveToStore aviso inicial:', err);
          }
        }

        this.ngZone.run(() => {
          this.isReady.next(true);
        });
      } catch (error) {
        console.error('Error inicializando base de datos SQLite:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        monto REAL NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        fecha TEXT NOT NULL,
        metodo_pago TEXT NOT NULL,
        icono TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS presupuestos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        mes TEXT NOT NULL,
        total REAL NOT NULL,
        gastado REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metas_ahorro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        actual REAL NOT NULL,
        objetivo REAL NOT NULL,
        icono TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `;

    await this.db.execute(schema);
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) return;

    const checkMov = await this.db.query('SELECT COUNT(*) as count FROM movimientos;');
    const countMov = checkMov.values && checkMov.values[0] ? checkMov.values[0].count : 0;

    if (countMov === 0) {
      const initialMovimientos = `
        INSERT INTO movimientos (tipo, monto, categoria, descripcion, fecha, metodo_pago, icono)
        VALUES
          ('gasto', 15400, 'Alimentación', 'Supermercado', 'Hoy, 14:30', 'Tarjeta de Débito', 'cart-outline'),
          ('ingreso', 120000, 'Salario', 'Cobro de Honorarios', 'Ayer, 11:15', 'Transferencia Bancaria', 'cash-outline'),
          ('gasto', 8350, 'Servicios', 'Pago de Luz', '15 Nov', 'Billetera Virtual', 'flash-outline'),
          ('ingreso', 35000, 'Ventas', 'Venta producto', '12 Nov', 'Efectivo', 'trending-up-outline');
      `;
      await this.db.execute(initialMovimientos);
    }

    const checkPresupuesto = await this.db.query('SELECT COUNT(*) as count FROM presupuestos;');
    const countPresupuesto = checkPresupuesto.values && checkPresupuesto.values[0] ? checkPresupuesto.values[0].count : 0;

    if (countPresupuesto === 0) {
      const initialPresupuesto = `
        INSERT INTO presupuestos (nombre, mes, total, gastado)
        VALUES ('Noviembre 2026', 'Noviembre', 200000, 23750);
      `;
      await this.db.execute(initialPresupuesto);
    }

    const checkMetas = await this.db.query('SELECT COUNT(*) as count FROM metas_ahorro;');
    const countMetas = checkMetas.values && checkMetas.values[0] ? checkMetas.values[0].count : 0;

    if (countMetas === 0) {
      const initialMetas = `
        INSERT INTO metas_ahorro (nombre, actual, objetivo, icono, color)
        VALUES
          ('Fondo de Emergencia', 150000, 200000, 'shield-checkmark-outline', 'success'),
          ('Vacaciones Verano', 80000, 180000, 'airplane-outline', 'primary');
      `;
      await this.db.execute(initialMetas);
    }
  }

  private async persistIfWeb(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      try {
        await this.sqlite.saveToStore(this.dbName);
      } catch (err) {
        console.warn('saveToStore aviso:', err);
      }
    }
    this.ngZone.run(() => {
      this.dataChanged.next();
    });
  }

  async getMovimientos(): Promise<Movimiento[]> {
    await this.init();
    if (!this.db) return [];
    const res = await this.db.query('SELECT * FROM movimientos ORDER BY id DESC;');
    return (res.values as Movimiento[]) || [];
  }

  async getMovimientosRecientes(limit: number = 5): Promise<Movimiento[]> {
    await this.init();
    if (!this.db) return [];
    const res = await this.db.query(`SELECT * FROM movimientos ORDER BY id DESC LIMIT ${limit};`);
    return (res.values as Movimiento[]) || [];
  }

  async addMovimiento(mov: Movimiento): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('La base de datos SQLite no está disponible');
    }

    const icono = mov.icono || this.obtenerIconoPorCategoria(mov.categoria);

    const query = `
      INSERT INTO movimientos (tipo, monto, categoria, descripcion, fecha, metodo_pago, icono)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    await this.db.run(query, [
      mov.tipo,
      mov.monto,
      mov.categoria,
      mov.descripcion,
      mov.fecha,
      mov.metodo_pago,
      icono
    ]);

    await this.persistIfWeb();
  }

  async getBalance(): Promise<BalanceGeneral> {
    await this.init();
    if (!this.db) {
      return { balance: 0, ingresos: 0, gastos: 0 };
    }

    const resIngresos = await this.db.query("SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE tipo = 'ingreso';");
    const totalIngresos = resIngresos.values && resIngresos.values[0] ? Number(resIngresos.values[0].total) : 0;

    const resGastos = await this.db.query("SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE tipo = 'gasto';");
    const totalGastos = resGastos.values && resGastos.values[0] ? Number(resGastos.values[0].total) : 0;

    return {
      balance: totalIngresos - totalGastos,
      ingresos: totalIngresos,
      gastos: totalGastos
    };
  }

  async getPresupuestoActivo(): Promise<Presupuesto> {
    await this.init();
    if (!this.db) {
      return { nombre: 'Noviembre 2026', mes: 'Noviembre', total: 200000, gastado: 0 };
    }
    const res = await this.db.query('SELECT * FROM presupuestos ORDER BY id DESC LIMIT 1;');
    const resGastos = await this.db.query("SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE tipo = 'gasto';");
    const totalGastos = resGastos.values && resGastos.values[0] ? Number(resGastos.values[0].total) : 0;

    if (res.values && res.values.length > 0) {
      const pres = res.values[0] as Presupuesto;
      return {
        ...pres,
        gastado: totalGastos
      };
    }
    return { nombre: 'Noviembre 2026', mes: 'Noviembre', total: 200000, gastado: totalGastos };
  }

  async getMetasAhorro(): Promise<MetaAhorro[]> {
    await this.init();
    if (!this.db) return [];
    const res = await this.db.query('SELECT * FROM metas_ahorro;');
    return (res.values as MetaAhorro[]) || [];
  }

  async getGastosPorCategoria(): Promise<GastoCategoriaEstadistica[]> {
    await this.init();
    if (!this.db) return [];

    const resTotal = await this.db.query("SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE tipo = 'gasto';");
    const totalGastos = resTotal.values && resTotal.values[0] ? Number(resTotal.values[0].total) : 0;

    if (totalGastos === 0) return [];

    const res = await this.db.query(`
      SELECT categoria, SUM(monto) as monto
      FROM movimientos
      WHERE tipo = 'gasto'
      GROUP BY categoria
      ORDER BY monto DESC;
    `);

    const colores = ['primary', 'warning', 'tertiary', 'secondary', 'danger', 'medium'];

    return (res.values || []).map((row: any, index: number) => {
      const montoNum = Number(row.monto);
      const porcentaje = Math.round((montoNum / totalGastos) * 100);
      return {
        categoria: row.categoria,
        monto: montoNum,
        porcentaje,
        icono: this.obtenerIconoPorCategoria(row.categoria),
        color: colores[index % colores.length]
      };
    });
  }

  async getEvolucionMensual(): Promise<EvolucionMesEstadistica[]> {
    const balance = await this.getBalance();
    const maximo = Math.max(300000, balance.ingresos, balance.gastos);

    return [
      { mes: 'Noviembre', ingresos: balance.ingresos, gastos: balance.gastos, maximo },
      { mes: 'Octubre', ingresos: 250000, gastos: 195000, maximo: 300000 },
      { mes: 'Septiembre', ingresos: 240000, gastos: 160000, maximo: 300000 }
    ];
  }

  obtenerIconoPorCategoria(categoria: string): string {
    const cat = (categoria || '').toLowerCase();
    if (cat.includes('alimen') || cat.includes('super')) return 'cart-outline';
    if (cat.includes('trans')) return 'car-outline';
    if (cat.includes('serv') || cat.includes('luz') || cat.includes('gas')) return 'flash-outline';
    if (cat.includes('entre') || cat.includes('cine')) return 'film-outline';
    if (cat.includes('salud') || cat.includes('farm')) return 'medkit-outline';
    if (cat.includes('educ')) return 'school-outline';
    if (cat.includes('sala') || cat.includes('sueldo')) return 'cash-outline';
    if (cat.includes('hono')) return 'briefcase-outline';
    if (cat.includes('vent')) return 'trending-up-outline';
    return 'pricetag-outline';
  }

}
