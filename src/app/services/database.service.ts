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
  periodo: 'mensual' | 'trimestral' | 'anual';
  totalMensual: number;
  totalTrimestral: number;
  totalAnual: number;
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

export interface EstadisticasResultado {
  totalGastos: number;
  totalIngresos: number;
  gastosPorCategoria: GastoCategoriaEstadistica[];
  ingresosPorCategoria: GastoCategoriaEstadistica[];
  evolucion: EvolucionMesEstadistica[];
  subtituloPeriodo: string;
  subtituloEvolucion: string;
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
        gastado REAL NOT NULL,
        periodo TEXT NOT NULL DEFAULT 'mensual',
        total_mensual REAL NOT NULL DEFAULT 0,
        total_trimestral REAL NOT NULL DEFAULT 0,
        total_anual REAL NOT NULL DEFAULT 0
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

    const presupuestoColumns = await this.db.query('PRAGMA table_info(presupuestos);');
    const nombresColumnas = new Set(presupuestoColumns.values?.map(column => column.name) || []);
    const columnasPresupuesto = [
      { nombre: 'periodo', definicion: "TEXT NOT NULL DEFAULT 'mensual'" },
      { nombre: 'total_mensual', definicion: 'REAL NOT NULL DEFAULT 0' },
      { nombre: 'total_trimestral', definicion: 'REAL NOT NULL DEFAULT 0' },
      { nombre: 'total_anual', definicion: 'REAL NOT NULL DEFAULT 0' }
    ];

    for (const columna of columnasPresupuesto) {
      if (!nombresColumnas.has(columna.nombre)) {
        await this.db.execute(
          `ALTER TABLE presupuestos ADD COLUMN ${columna.nombre} ${columna.definicion};`
        );
      }
    }

    await this.db.execute(`
      UPDATE presupuestos
      SET total_mensual = CASE WHEN total_mensual = 0 THEN total ELSE total_mensual END,
          total_trimestral = CASE WHEN total_trimestral = 0 THEN total ELSE total_trimestral END,
          total_anual = CASE WHEN total_anual = 0 THEN total ELSE total_anual END;
    `);
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
        INSERT INTO presupuestos (
          nombre, mes, total, gastado, periodo, total_mensual, total_trimestral, total_anual
        )
        VALUES ('Noviembre 2026', 'Noviembre', 200000, 23750, 'mensual', 200000, 200000, 200000);
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

  async updateMovimiento(mov: Movimiento): Promise<void> {
    await this.init();
    if (!this.db || !mov.id) {
      throw new Error('Base de datos no disponible o ID de movimiento inválido');
    }

    const icono = mov.icono || this.obtenerIconoPorCategoria(mov.categoria);

    const query = `
      UPDATE movimientos
      SET tipo = ?, monto = ?, categoria = ?, descripcion = ?, fecha = ?, metodo_pago = ?, icono = ?
      WHERE id = ?;
    `;
    await this.db.run(query, [
      mov.tipo,
      mov.monto,
      mov.categoria,
      mov.descripcion,
      mov.fecha,
      mov.metodo_pago,
      icono,
      mov.id
    ]);

    await this.persistIfWeb();
  }

  async deleteMovimiento(id: number): Promise<void> {
    await this.init();
    if (!this.db || !id) {
      throw new Error('Base de datos no disponible o ID de movimiento inválido');
    }

    const query = `DELETE FROM movimientos WHERE id = ?;`;
    await this.db.run(query, [id]);

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
      return {
        nombre: 'Noviembre 2026',
        mes: 'Noviembre',
        total: 200000,
        gastado: 0,
        periodo: 'mensual',
        totalMensual: 200000,
        totalTrimestral: 200000,
        totalAnual: 200000
      };
    }
    const res = await this.db.query('SELECT * FROM presupuestos ORDER BY id DESC LIMIT 1;');
    const resGastos = await this.db.query("SELECT COALESCE(SUM(monto), 0) as total FROM movimientos WHERE tipo = 'gasto';");
    const totalGastos = resGastos.values && resGastos.values[0] ? Number(resGastos.values[0].total) : 0;

    if (res.values && res.values.length > 0) {
      const pres = res.values[0];
      const periodoGuardado = String(pres.periodo);
      const periodo: Presupuesto['periodo'] = periodoGuardado === 'trimestral' || periodoGuardado === 'anual'
        ? periodoGuardado
        : 'mensual';
      const totalMensual = Number(pres.total_mensual);
      const totalTrimestral = Number(pres.total_trimestral);
      const totalAnual = Number(pres.total_anual);
      return {
        id: Number(pres.id),
        nombre: String(pres.nombre),
        mes: String(pres.mes),
        total: periodo === 'trimestral'
          ? totalTrimestral
          : periodo === 'anual' ? totalAnual : totalMensual,
        gastado: totalGastos,
        periodo,
        totalMensual,
        totalTrimestral,
        totalAnual
      };
    }
    return {
      nombre: 'Noviembre 2026',
      mes: 'Noviembre',
      total: 200000,
      gastado: totalGastos,
      periodo: 'mensual',
      totalMensual: 200000,
      totalTrimestral: 200000,
      totalAnual: 200000
    };
  }

  async updatePresupuestoActivo(
    total: number,
    periodo: Presupuesto['periodo']
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de datos no disponible');
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('El monto del presupuesto debe ser mayor a cero');
    }

    const columnasPorPeriodo: Record<Presupuesto['periodo'], string> = {
      mensual: 'total_mensual',
      trimestral: 'total_trimestral',
      anual: 'total_anual'
    };
    const columna = columnasPorPeriodo[periodo];
    if (!columna) throw new Error('Período de presupuesto inválido');

    const res = await this.db.query('SELECT id FROM presupuestos ORDER BY id DESC LIMIT 1;');
    const id = res.values?.[0]?.id;
    if (id === undefined) throw new Error('No hay un presupuesto activo para actualizar');

    await this.db.run(
      `UPDATE presupuestos SET total = ?, periodo = ?, ${columna} = ? WHERE id = ?;`,
      [total, periodo, total, id]
    );
    await this.persistIfWeb();
  }

  async getMetasAhorro(): Promise<MetaAhorro[]> {
    await this.init();
    if (!this.db) return [];
    const res = await this.db.query('SELECT * FROM metas_ahorro;');
    return (res.values as MetaAhorro[]) || [];
  }

  async addMetaAhorro(meta: Omit<MetaAhorro, 'id'>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de datos no disponible');
    const query = `
      INSERT INTO metas_ahorro (nombre, actual, objetivo, icono, color)
      VALUES (?, ?, ?, ?, ?);
    `;
    await this.db.run(query, [
      meta.nombre,
      meta.actual,
      meta.objetivo,
      meta.icono || 'star-outline',
      meta.color || 'primary'
    ]);
    await this.persistIfWeb();
  }

  async updateMetaAhorro(id: number, objetivo: number): Promise<void> {
    await this.init();
    if (!this.db || !id) throw new Error('Base de datos no disponible o ID de meta inválido');
    if (!Number.isFinite(objetivo) || objetivo <= 0) {
      throw new Error('El objetivo de la meta debe ser mayor a cero');
    }

    await this.db.run(
      'UPDATE metas_ahorro SET objetivo = ? WHERE id = ?;',
      [objetivo, id]
    );
    await this.persistIfWeb();
  }

  async aportarAMeta(id: number, montoAportar: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de datos no disponible');
    const query = `
      UPDATE metas_ahorro
      SET actual = MIN(actual + ?, objetivo)
      WHERE id = ?;
    `;
    await this.db.run(query, [montoAportar, id]);
    await this.persistIfWeb();
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

  parseFecha(fechaStr: string, refDate: Date = new Date()): { year: number; month: number } {
    if (!fechaStr) {
      return { year: refDate.getFullYear(), month: refDate.getMonth() };
    }

    const str = fechaStr.trim().toLowerCase();

    if (str.includes('hoy')) {
      return { year: refDate.getFullYear(), month: refDate.getMonth() };
    }
    if (str.includes('ayer')) {
      const ayer = new Date(refDate);
      ayer.setDate(ayer.getDate() - 1);
      return { year: ayer.getFullYear(), month: ayer.getMonth() };
    }

    const matchIso = str.match(/^(\d{4})[-/](\d{1,2})/);
    if (matchIso) {
      return {
        year: parseInt(matchIso[1], 10),
        month: parseInt(matchIso[2], 10) - 1
      };
    }

    const matchLatino = str.match(/^\d{1,2}[-/](\d{1,2})[-/](\d{4})/);
    if (matchLatino) {
      return {
        year: parseInt(matchLatino[2], 10),
        month: parseInt(matchLatino[1], 10) - 1
      };
    }

    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    for (let i = 0; i < meses.length; i++) {
      if (str.includes(meses[i])) {
        const yearMatch = str.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : refDate.getFullYear();
        return { year, month: i };
      }
    }

    const parsed = Date.parse(fechaStr);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return { year: d.getFullYear(), month: d.getMonth() };
    }

    return { year: refDate.getFullYear(), month: refDate.getMonth() };
  }

  async getEstadisticasPorFiltro(filtro: 'todos' | 'mensual' | 'trimestral' | 'anual'): Promise<EstadisticasResultado> {
    await this.init();
    const movs = await this.getMovimientos();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 10 = Noviembre

    // Clasificar movimientos por fecha real (año y mes)
    interface MovParsed {
      mov: Movimiento;
      year: number;
      month: number;
    }

    const movsConFecha: MovParsed[] = movs.map(m => {
      const p = this.parseFecha(m.fecha, now);
      return { mov: m, year: p.year, month: p.month };
    });

    // Baseline referencial para el año actual (2026)
    const histOctubre = { ingresos: 250000, gastos: 195000 };
    const histSeptiembre = { ingresos: 240000, gastos: 160000 };
    const histEneAgo = { ingresos: 1800000, gastos: 1200000 };

    const categoriasHistOctSep: { [cat: string]: number } = {
      'Alimentación': 135000,
      'Servicios': 75000,
      'Transporte': 65000,
      'Entretenimiento': 25000,
      'Salud': 20000,
      'Otros Gastos': 35000
    };

    const categoriasHistEneAgo: { [cat: string]: number } = {
      'Alimentación': 450000,
      'Servicios': 260000,
      'Transporte': 210000,
      'Salud': 120000,
      'Entretenimiento': 100000,
      'Otros Gastos': 60000
    };

    const colores = ['primary', 'warning', 'tertiary', 'secondary', 'danger', 'medium', 'dark'];

    const armarCategorias = (catMap: { [cat: string]: number }, total: number): GastoCategoriaEstadistica[] => {
      if (total <= 0) return [];
      return Object.keys(catMap)
        .map((cat, idx) => {
          const monto = catMap[cat];
          const porcentaje = Math.round((monto / total) * 100);
          return {
            categoria: cat,
            monto,
            porcentaje,
            icono: this.obtenerIconoPorCategoria(cat),
            color: colores[idx % colores.length]
          };
        })
        .filter(c => c.monto > 0)
        .sort((a, b) => b.monto - a.monto);
    };

    const agruparPorCategoria = (movimientos: Movimiento[]): Record<string, number> => {
      const categorias: Record<string, number> = {};
      for (const movimiento of movimientos) {
        categorias[movimiento.categoria] =
          (categorias[movimiento.categoria] || 0) + Number(movimiento.monto);
      }
      return categorias;
    };

    // 1. FILTRO MENSUAL: Únicamente los del mes y año en curso (Noviembre 2026)
    if (filtro === 'mensual') {
      const movsMes = movsConFecha.filter(item => item.year === currentYear && item.month === currentMonth);
      const gastosMesRows = movsMes.filter(item => item.mov.tipo === 'gasto');
      const ingresosMesRows = movsMes.filter(item => item.mov.tipo === 'ingreso');

      const gastosMes = gastosMesRows.reduce((acc, item) => acc + Number(item.mov.monto), 0);
      const ingresosMes = ingresosMesRows.reduce((acc, item) => acc + Number(item.mov.monto), 0);

      const catMap: { [cat: string]: number } = {};
      for (const item of gastosMesRows) {
        catMap[item.mov.categoria] = (catMap[item.mov.categoria] || 0) + Number(item.mov.monto);
      }
      const catIngresosMes = agruparPorCategoria(ingresosMesRows.map(item => item.mov));

      const evolucion: EvolucionMesEstadistica[] = [
        {
          mes: `Noviembre (Mes actual)`,
          ingresos: ingresosMes,
          gastos: gastosMes,
          maximo: Math.max(ingresosMes, gastosMes, 50000)
        }
      ];

      return {
        totalGastos: gastosMes,
        totalIngresos: ingresosMes,
        gastosPorCategoria: armarCategorias(catMap, gastosMes),
        ingresosPorCategoria: armarCategorias(catIngresosMes, ingresosMes),
        evolucion,
        subtituloPeriodo: `Distribución del mes actual (${currentYear})`,
        subtituloEvolucion: `Registro mensual (${currentYear})`
      };
    }

    // 2. FILTRO TRIMESTRAL: Últimos 3 meses del año en curso (Noviembre, Octubre, Septiembre 2026)
    if (filtro === 'trimestral') {
      // Noviembre 2026
      const movsNov = movsConFecha.filter(i => i.year === currentYear && i.month === currentMonth);
      const gastosNov = movsNov.filter(i => i.mov.tipo === 'gasto').reduce((acc, i) => acc + Number(i.mov.monto), 0);
      const ingresosNov = movsNov.filter(i => i.mov.tipo === 'ingreso').reduce((acc, i) => acc + Number(i.mov.monto), 0);

      // Octubre 2026 (mes anterior)
      const movsOct = movsConFecha.filter(i => i.year === currentYear && i.month === currentMonth - 1);
      const gastosOct = histOctubre.gastos + movsOct.filter(i => i.mov.tipo === 'gasto').reduce((acc, i) => acc + Number(i.mov.monto), 0);
      const ingresosOct = histOctubre.ingresos + movsOct.filter(i => i.mov.tipo === 'ingreso').reduce((acc, i) => acc + Number(i.mov.monto), 0);

      // Septiembre 2026 (dos meses atrás)
      const movsSep = movsConFecha.filter(i => i.year === currentYear && i.month === currentMonth - 2);
      const gastosSep = histSeptiembre.gastos + movsSep.filter(i => i.mov.tipo === 'gasto').reduce((acc, i) => acc + Number(i.mov.monto), 0);
      const ingresosSep = histSeptiembre.ingresos + movsSep.filter(i => i.mov.tipo === 'ingreso').reduce((acc, i) => acc + Number(i.mov.monto), 0);

      const maximo = Math.max(300000, ingresosNov, gastosNov, ingresosOct, gastosOct, ingresosSep, gastosSep);
      const evolucion: EvolucionMesEstadistica[] = [
        { mes: 'Noviembre', ingresos: ingresosNov, gastos: gastosNov, maximo },
        { mes: 'Octubre', ingresos: ingresosOct, gastos: gastosOct, maximo },
        { mes: 'Septiembre', ingresos: ingresosSep, gastos: gastosSep, maximo }
      ];

      const catTrimestre: { [cat: string]: number } = { ...categoriasHistOctSep };
      // Sumar gastos registrados en SQLite que pertenezcan a este trimestre de 2026
      const movsTrimestre = movsConFecha.filter(i => i.year === currentYear && i.month >= currentMonth - 2 && i.month <= currentMonth && i.mov.tipo === 'gasto');
      for (const item of movsTrimestre) {
        catTrimestre[item.mov.categoria] = (catTrimestre[item.mov.categoria] || 0) + Number(item.mov.monto);
      }
      const movsIngresoTrimestre = movsConFecha
        .filter(i => i.year === currentYear && i.month >= currentMonth - 2 && i.month <= currentMonth && i.mov.tipo === 'ingreso')
        .map(item => item.mov);
      const totalIngresosRegistradosTrimestre = movsIngresoTrimestre
        .reduce((acc, movimiento) => acc + Number(movimiento.monto), 0);

      const totalGastosTrimestre = gastosNov + gastosOct + gastosSep;
      const totalIngresosTrimestre = ingresosNov + ingresosOct + ingresosSep;

      return {
        totalGastos: totalGastosTrimestre,
        totalIngresos: totalIngresosTrimestre,
        gastosPorCategoria: armarCategorias(catTrimestre, totalGastosTrimestre),
        ingresosPorCategoria: armarCategorias(
          agruparPorCategoria(movsIngresoTrimestre),
          totalIngresosRegistradosTrimestre
        ),
        evolucion,
        subtituloPeriodo: `Distribución del último trimestre (${currentYear})`,
        subtituloEvolucion: 'Últimos 3 meses'
      };
    }

    // 3. FILTRO ANUAL: Suma exclusivamente los movimientos de ese año (currentYear = 2026)
    if (filtro === 'anual') {
      const movsAnio = movsConFecha.filter(i => i.year === currentYear);
      const gastosAnioDb = movsAnio.filter(i => i.mov.tipo === 'gasto');
      const ingresosAnioDb = movsAnio.filter(i => i.mov.tipo === 'ingreso');

      const gastosAnioDbTotal = gastosAnioDb.reduce((acc, i) => acc + Number(i.mov.monto), 0);
      const ingresosAnioDbTotal = ingresosAnioDb.reduce((acc, i) => acc + Number(i.mov.monto), 0);
      const ingresosAnioCategoria = agruparPorCategoria(ingresosAnioDb.map(item => item.mov));

      const totalGastosAnual = gastosAnioDbTotal + histOctubre.gastos + histSeptiembre.gastos + histEneAgo.gastos;
      const totalIngresosAnual = ingresosAnioDbTotal + histOctubre.ingresos + histSeptiembre.ingresos + histEneAgo.ingresos;
      const maximoAnual = Math.max(totalIngresosAnual, totalGastosAnual, 500000);

      const catAnual: { [cat: string]: number } = { ...categoriasHistOctSep };
      for (const [k, v] of Object.entries(categoriasHistEneAgo)) {
        catAnual[k] = (catAnual[k] || 0) + v;
      }
      for (const item of gastosAnioDb) {
        catAnual[item.mov.categoria] = (catAnual[item.mov.categoria] || 0) + Number(item.mov.monto);
      }

      const evolucion: EvolucionMesEstadistica[] = [
        {
          mes: `Año ${currentYear} (Total Anual)`,
          ingresos: totalIngresosAnual,
          gastos: totalGastosAnual,
          maximo: maximoAnual
        }
      ];

      return {
        totalGastos: totalGastosAnual,
        totalIngresos: totalIngresosAnual,
        gastosPorCategoria: armarCategorias(catAnual, totalGastosAnual),
        ingresosPorCategoria: armarCategorias(ingresosAnioCategoria, ingresosAnioDbTotal),
        evolucion,
        subtituloPeriodo: `Distribución acumulada Año ${currentYear}`,
        subtituloEvolucion: `Balance total Año ${currentYear}`
      };
    }

    // 4. FILTRO TODOS: Suma TODOS los gastos e ingresos en gastos y evolución (incluyendo años anteriores como 2025)
    const todosGastosDb = movsConFecha.filter(i => i.mov.tipo === 'gasto');
    const todosIngresosDb = movsConFecha.filter(i => i.mov.tipo === 'ingreso');

    const todosGastosDbTotal = todosGastosDb.reduce((acc, i) => acc + Number(i.mov.monto), 0);
    const todosIngresosDbTotal = todosIngresosDb.reduce((acc, i) => acc + Number(i.mov.monto), 0);

    const totalGastosTodos = todosGastosDbTotal + histOctubre.gastos + histSeptiembre.gastos + histEneAgo.gastos;
    const totalIngresosTodos = todosIngresosDbTotal + histOctubre.ingresos + histSeptiembre.ingresos + histEneAgo.ingresos;
    const ingresosTodosCategoria = agruparPorCategoria(todosIngresosDb.map(item => item.mov));
    const maximoTodos = Math.max(totalIngresosTodos, totalGastosTodos, 500000);

    const catTodos: { [cat: string]: number } = { ...categoriasHistOctSep };
    for (const [k, v] of Object.entries(categoriasHistEneAgo)) {
      catTodos[k] = (catTodos[k] || 0) + v;
    }
    for (const item of todosGastosDb) {
      catTodos[item.mov.categoria] = (catTodos[item.mov.categoria] || 0) + Number(item.mov.monto);
    }

    const evolucion: EvolucionMesEstadistica[] = [
      {
        mes: 'Total Histórico (Todos los registros)',
        ingresos: totalIngresosTodos,
        gastos: totalGastosTodos,
        maximo: maximoTodos
      }
    ];

    return {
      totalGastos: totalGastosTodos,
      totalIngresos: totalIngresosTodos,
      gastosPorCategoria: armarCategorias(catTodos, totalGastosTodos),
      ingresosPorCategoria: armarCategorias(ingresosTodosCategoria, todosIngresosDbTotal),
      evolucion,
      subtituloPeriodo: 'Distribución histórica completa',
      subtituloEvolucion: 'Total consolidado histórico'
    };
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
