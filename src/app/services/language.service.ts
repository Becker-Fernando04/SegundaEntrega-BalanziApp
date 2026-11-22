import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Idioma = 'es' | 'en';

export interface Traducciones {
  tabInicio: string;
  tabMovimientos: string;
  tabRegistros: string;
  tabEstadistica: string;
  tabPresupuestos: string;
  ajustesTitulo: string;
  seleccionarIdioma: string;
  idiomaEspanol: string;
  idiomaIngles: string;
  infoApp: string;
  version: string;
  motorDb: string;
  nube: string;
  balanceGeneral: string;
  mesActual: string;
  ingresos: string;
  gastos: string;
  movimientosRecientes: string;
  sinMovimientos: string;
  buscarMovimientos: string;
  filtroTodos: string;
  filtroIngresos: string;
  filtroGastos: string;
  filtrarPorCategoria: string;
  todasLasCategorias: string;
  aplicar: string;
  historialAnterior: string;
  tipoGasto: string;
  tipoIngreso: string;
  monto: string;
  categoria: string;
  seleccionarCategoria: string;
  descripcion: string;
  fecha: string;
  metodoPago: string;
  seleccionarMetodo: string;
  btnGuardar: string;
  filtroTrimestral: string;
  filtroMensual: string;
  filtroAnual: string;
  gastosPorCategoria: string;
  distribucionPeriodo: string;
  total: string;
  evolucionMensual: string;
  comparativa: string;
  ingresosPorCategoria: string;
  sinIngresosCategoriaPeriodo: string;
  presupuestosActivos: string;
  presupuestoMensual: string;
  presupuestoTrimestral: string;
  presupuestoAnual: string;
  tipoPeriodoPresupuesto: string;
  presupuestoGuardado: string;
  montoPresupuestoInvalido: string;
  errorGuardarPresupuesto: string;
  enCurso: string;
  gastado: string;
  limiteTotal: string;
  disponible: string;
  utilizado: string;
  metasAhorro: string;
  meta: string;
  sinMovimientosInicio: string;
  avisoMetaAhorro: string;
  ejemploDescripcionRegistro: string;
  seleccionarMetaAhorro: string;
  metasAhorroTitulo: string;
  montoAportar: string;
  editarTopeMeta: string;
  topeMetaActualizado: string;
  errorActualizarTopeMeta: string;
  agregarIngresoMeta: string;
  aporteSuperaLimiteMeta: string;
  elegirMeta: string;
  sinMetasAhorro: string;
  cancelarNuevaMeta: string;
  crearNuevaMeta: string;
  nuevaMetaAhorro: string;
  aporteAutomatico: string;
  nombreMeta: string;
  ejemploNombreMeta: string;
  montoObjetivo: string;
  crearMetaYAportar: string;
  movimientosVaciosRecientes: string;
  movimientosVaciosHistorial: string;
  modificarMovimiento: string;
  ejemploDescripcionEdicion: string;
  guardarCambios: string;
  cancelar: string;
  eliminar: string;
  sinGastosPeriodo: string;
  estadisticaPeriodoMes: string;
  estadisticaPeriodoTrimestre: string;
  estadisticaPeriodoAnual: string;
  estadisticaPeriodoTodo: string;
  estadisticaEvolucionMes: string;
  estadisticaEvolucionTrimestre: string;
  estadisticaEvolucionAnual: string;
  estadisticaEvolucionTodo: string;
  periodoMesActual: string;
  presupuestoEstado: string;
  configuracionIdiomaEspanol: string;
  configuracionIdiomaIngles: string;
  activo: string;
  conectado: string;
  cuentaAcceso: string;
  verificacionDosPasos: string;
  ingresarCodigoSMS: string;
  verificarEntrar: string;
  iniciarSesionGestionar: string;
  crearCuentaRespaldar: string;
  continuarGoogle: string;
  usarCorreo: string;
  iniciarSesion: string;
  registrarse: string;
  correoElectronico: string;
  ejemploCorreo: string;
  contrasena: string;
  confirmarContrasena: string;
  entrarConCorreo: string;
  crearCuenta: string;
  seguridadFirebase: string;
  conectadoFirebase: string;
  sincronizacionNubeInfo: string;
  sincronizando: string;
  respaldarNube: string;
  cerrarSesion: string;
  nombreAplicacion: string;
  baseDatosSQLite: string;
  sincronizacionFirebase: string;
  errorGuardarMovimiento: string;
  montoInvalido: string;
  seleccionarCategoriaMensaje: string;
  ingresoGuardado: string;
  gastoGuardado: string;
  aportarA: string;
  confirmarAporte: string;
  progresoActual: string;
  confirmar: string;
  aporteRealizado: string;
  errorAporte: string;
  nombreMetaRequerido: string;
  objetivoMetaRequerido: string;
  errorCrearMeta: string;
  movimientoNoEncontrado: string;
  movimientoActualizado: string;
  errorActualizar: string;
  eliminarMovimientoTitulo: string;
  confirmarEliminarMovimiento: string;
  movimientoEliminado: string;
  errorEliminarMovimiento: string;
  inicioGoogleExitoso: string;
  correoValido: string;
  contrasenaMinima: string;
  contrasenasNoCoinciden: string;
  errorProcesarSolicitud: string;
  credencialesIncorrectas: string;
  correoRegistrado: string;
  contrasenaDebil: string;
  correoInvalido: string;
  codigoSmsEnviado: string;
  errorEnviarCodigo: string;
  codigoSmsRequerido: string;
  sesionDosFaExpirada: string;
  verificacionDosFaExitosa: string;
  codigoSmsInvalido: string;
  sesionCerrada: string;
  errorCerrarSesion: string;
  movimientosRespaldados: string;
  errorRespaldarNube: string;
}

const ES: Traducciones = {
  tabInicio: 'Inicio',
  tabMovimientos: 'Movimientos',
  tabRegistros: 'Registrar',
  tabEstadistica: 'Estadísticas',
  tabPresupuestos: 'Presupuestos',
  ajustesTitulo: 'Ajustes',
  seleccionarIdioma: 'Idioma de la aplicación',
  idiomaEspanol: 'Español',
  idiomaIngles: 'English (Inglés)',
  infoApp: 'Información de BalanziApp',
  version: 'Versión',
  motorDb: 'Base de datos local (SQLite)',
  nube: 'Sincronización en la nube (Firebase)',
  balanceGeneral: 'Balance General',
  mesActual: 'Mes actual',
  ingresos: 'Ingresos',
  gastos: 'Gastos',
  movimientosRecientes: 'Movimientos Recientes',
  sinMovimientos: 'Sin movimientos registrados',
  buscarMovimientos: 'Buscar movimientos...',
  filtroTodos: 'Todos',
  filtroIngresos: 'Ingresos',
  filtroGastos: 'Gastos',
  filtrarPorCategoria: 'Filtrar por categoría',
  todasLasCategorias: 'Todas las categorías',
  aplicar: 'Aplicar',
  historialAnterior: 'Historial Anterior',
  tipoGasto: 'Gasto',
  tipoIngreso: 'Ingreso',
  monto: 'Monto',
  categoria: 'Categoría',
  seleccionarCategoria: 'Seleccionar categoría',
  descripcion: 'Descripción',
  fecha: 'Fecha',
  metodoPago: 'Método de pago',
  seleccionarMetodo: 'Seleccionar método',
  btnGuardar: 'Guardar',
  filtroTrimestral: 'Trimestral',
  filtroMensual: 'Mensual',
  filtroAnual: 'Anual',
  gastosPorCategoria: 'Gastos por categoría',
  distribucionPeriodo: 'Distribución del período',
  total: 'Total',
  evolucionMensual: 'Evolución mensual',
  comparativa: 'Comparativa Ingresos vs Gastos',
  ingresosPorCategoria: 'Ingresos por categoría',
  sinIngresosCategoriaPeriodo: 'No hay ingresos registrados para este período.',
  presupuestosActivos: 'Presupuestos activos',
  presupuestoMensual: 'Presupuesto Mensual',
  presupuestoTrimestral: 'Presupuesto Trimestral',
  presupuestoAnual: 'Presupuesto Anual',
  tipoPeriodoPresupuesto: 'Período del presupuesto',
  presupuestoGuardado: 'Presupuesto actualizado correctamente',
  montoPresupuestoInvalido: 'Ingresa un monto mayor a cero.',
  errorGuardarPresupuesto: 'No se pudo actualizar el presupuesto.',
  enCurso: 'En curso',
  gastado: 'Gastado',
  limiteTotal: 'Límite Total',
  disponible: 'Disponible',
  utilizado: 'utilizado',
  metasAhorro: 'Metas de ahorro',
  meta: 'Meta',
  sinMovimientosInicio: 'Sin movimientos registrados en la base de datos',
  avisoMetaAhorro: 'Este ingreso se sumará a una meta de ahorro',
  ejemploDescripcionRegistro: 'Ej: Compra mensual, Sueldo, etc.',
  seleccionarMetaAhorro: 'Seleccionar Meta de Ahorro',
  metasAhorroTitulo: 'Metas de Ahorro',
  montoAportar: 'Monto a aportar:',
  editarTopeMeta: 'Editar tope',
  topeMetaActualizado: 'Objetivo actualizado correctamente.',
  errorActualizarTopeMeta: 'No se pudo actualizar el objetivo de la meta.',
  agregarIngresoMeta: 'Agregar ingreso',
  aporteSuperaLimiteMeta: 'El aporte supera el monto restante de la meta.',
  elegirMeta: 'Elegí una meta',
  sinMetasAhorro: 'No tenés metas de ahorro aún.',
  cancelarNuevaMeta: 'Cancelar nueva meta',
  crearNuevaMeta: 'Crear nueva meta',
  nuevaMetaAhorro: 'Nueva Meta de Ahorro',
  aporteAutomatico: 'El aporte actual se sumará automáticamente',
  nombreMeta: 'Nombre de la meta',
  ejemploNombreMeta: 'Ej: Vacaciones, Auto, Fondo de emergencia',
  montoObjetivo: 'Monto objetivo',
  crearMetaYAportar: 'Crear meta y aportar',
  movimientosVaciosRecientes: 'No hay movimientos recientes',
  movimientosVaciosHistorial: 'No hay movimientos en el historial anterior',
  modificarMovimiento: 'Modificar Movimiento',
  ejemploDescripcionEdicion: 'Ej: Compra mensual, etc.',
  guardarCambios: 'Guardar Cambios',
  cancelar: 'Cancelar',
  eliminar: 'Eliminar',
  sinGastosPeriodo: 'No hay gastos registrados para este período.',
  estadisticaPeriodoMes: 'Distribución del mes actual',
  estadisticaPeriodoTrimestre: 'Distribución del último trimestre',
  estadisticaPeriodoAnual: 'Distribución acumulada',
  estadisticaPeriodoTodo: 'Distribución histórica completa',
  estadisticaEvolucionMes: 'Registro mensual',
  estadisticaEvolucionTrimestre: 'Últimos 3 meses',
  estadisticaEvolucionAnual: 'Balance total',
  estadisticaEvolucionTodo: 'Total consolidado histórico',
  periodoMesActual: '(Mes actual)',
  presupuestoEstado: 'En curso',
  configuracionIdiomaEspanol: 'Idioma por defecto',
  configuracionIdiomaIngles: 'English language',
  activo: 'Activo',
  conectado: 'Conectado',
  cuentaAcceso: 'Cuenta y Acceso',
  verificacionDosPasos: 'Verificación en dos pasos',
  ingresarCodigoSMS: 'Ingresa el código SMS de 6 dígitos enviado a tu número registrado',
  verificarEntrar: 'Verificar y Entrar',
  iniciarSesionGestionar: 'Inicia sesión para gestionar tus finanzas',
  crearCuentaRespaldar: 'Crea tu cuenta y respalda tus datos',
  continuarGoogle: 'Continuar con Google',
  usarCorreo: 'o usa tu correo',
  iniciarSesion: 'Iniciar Sesión',
  registrarse: 'Registrarse',
  correoElectronico: 'Correo electrónico',
  ejemploCorreo: 'ejemplo@correo.com',
  contrasena: 'Contraseña',
  confirmarContrasena: 'Confirmar contraseña',
  entrarConCorreo: 'Entrar con Correo',
  crearCuenta: 'Crear Mi Cuenta',
  seguridadFirebase: 'Seguridad y 2FA protegidos por Google Firebase',
  conectadoFirebase: 'Conectado a Firebase',
  sincronizacionNubeInfo: 'Tus registros locales pueden ser sincronizados y respaldados en la nube con Google Firebase.',
  sincronizando: 'Sincronizando...',
  respaldarNube: 'Respaldar datos en la Nube',
  cerrarSesion: 'Cerrar Sesión',
  nombreAplicacion: 'App',
  baseDatosSQLite: 'SQLite (Motor nativo)',
  sincronizacionFirebase: 'Google Firebase',
  errorGuardarMovimiento: 'Error al guardar',
  montoInvalido: 'Por favor, ingresa un monto válido mayor a 0',
  seleccionarCategoriaMensaje: 'Por favor, selecciona una categoría',
  ingresoGuardado: '¡Ingreso guardado con éxito!',
  gastoGuardado: '¡Gasto guardado con éxito!',
  aportarA: 'Aportar a',
  confirmarAporte: '¿Confirmar aporte de',
  progresoActual: 'Progreso actual:',
  confirmar: 'Confirmar',
  aporteRealizado: 'aportado a',
  errorAporte: 'Error al realizar el aporte:',
  nombreMetaRequerido: 'Por favor, escribe un nombre para la meta',
  objetivoMetaRequerido: 'Por favor, ingresa el monto objetivo de la meta',
  errorCrearMeta: 'Error al crear la meta:',
  movimientoNoEncontrado: 'No se encontró el movimiento a editar',
  movimientoActualizado: '¡Movimiento actualizado correctamente!',
  errorActualizar: 'Error al actualizar:',
  eliminarMovimientoTitulo: '¿Eliminar movimiento?',
  confirmarEliminarMovimiento: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción se actualizará en tus balances y estadísticas.',
  movimientoEliminado: 'Movimiento eliminado con éxito',
  errorEliminarMovimiento: 'Error al eliminar el movimiento',
  inicioGoogleExitoso: '¡Sesión iniciada con Google exitosamente!',
  correoValido: 'Por favor, ingresa un correo electrónico válido',
  contrasenaMinima: 'La contraseña debe tener al menos 6 caracteres',
  contrasenasNoCoinciden: 'Las contraseñas no coinciden',
  errorProcesarSolicitud: 'Error al procesar la solicitud',
  credencialesIncorrectas: 'Correo o contraseña incorrectos',
  correoRegistrado: 'Este correo ya se encuentra registrado',
  contrasenaDebil: 'La contraseña es muy débil (mínimo 6 caracteres)',
  correoInvalido: 'El formato del correo electrónico no es válido',
  codigoSmsEnviado: 'Se envió un código de verificación por SMS',
  errorEnviarCodigo: 'Error al enviar código 2FA:',
  codigoSmsRequerido: 'Ingresa el código SMS de 6 dígitos',
  sesionDosFaExpirada: 'Sesión de 2FA expirada, intenta nuevamente',
  verificacionDosFaExitosa: '¡Verificación 2FA exitosa!',
  codigoSmsInvalido: 'Código SMS inválido o expirado',
  sesionCerrada: 'Sesión cerrada correctamente',
  errorCerrarSesion: 'Error al cerrar sesión',
  movimientosRespaldados: 'movimientos respaldados con éxito en Firestore!',
  errorRespaldarNube: 'Error al respaldar en la nube:'
};

const EN: Traducciones = {
  tabInicio: 'Home',
  tabMovimientos: 'Transactions',
  tabRegistros: 'Add',
  tabEstadistica: 'Statistics',
  tabPresupuestos: 'Budgets',
  ajustesTitulo: 'Settings',
  seleccionarIdioma: 'Application Language',
  idiomaEspanol: 'Español (Spanish)',
  idiomaIngles: 'English',
  infoApp: 'BalanziApp Information',
  version: 'Version',
  motorDb: 'Local Database (SQLite)',
  nube: 'Cloud Sync (Firebase)',
  balanceGeneral: 'Total Balance',
  mesActual: 'Current month',
  ingresos: 'Income',
  gastos: 'Expenses',
  movimientosRecientes: 'Recent Transactions',
  sinMovimientos: 'No transactions recorded',
  buscarMovimientos: 'Search transactions...',
  filtroTodos: 'All',
  filtroIngresos: 'Income',
  filtroGastos: 'Expenses',
  filtrarPorCategoria: 'Filter by category',
  todasLasCategorias: 'All categories',
  aplicar: 'Apply',
  historialAnterior: 'Previous History',
  tipoGasto: 'Expense',
  tipoIngreso: 'Income',
  monto: 'Amount',
  categoria: 'Category',
  seleccionarCategoria: 'Select category',
  descripcion: 'Description',
  fecha: 'Date',
  metodoPago: 'Payment method',
  seleccionarMetodo: 'Select method',
  btnGuardar: 'Save',
  filtroTrimestral: 'Quarterly',
  filtroMensual: 'Monthly',
  filtroAnual: 'Yearly',
  gastosPorCategoria: 'Expenses by category',
  distribucionPeriodo: 'Period distribution',
  total: 'Total',
  evolucionMensual: 'Monthly overview',
  comparativa: 'Income vs Expenses comparison',
  ingresosPorCategoria: 'Income by category',
  sinIngresosCategoriaPeriodo: 'No income recorded for this period.',
  presupuestosActivos: 'Active budgets',
  presupuestoMensual: 'Monthly Budget',
  presupuestoTrimestral: 'Quarterly Budget',
  presupuestoAnual: 'Annual Budget',
  tipoPeriodoPresupuesto: 'Budget period',
  presupuestoGuardado: 'Budget updated successfully',
  montoPresupuestoInvalido: 'Enter an amount greater than zero.',
  errorGuardarPresupuesto: 'The budget could not be updated.',
  enCurso: 'Active',
  gastado: 'Spent',
  limiteTotal: 'Total Limit',
  disponible: 'Available',
  utilizado: 'used',
  metasAhorro: 'Savings goals',
  meta: 'Goal',
  sinMovimientosInicio: 'No transactions recorded in the database',
  avisoMetaAhorro: 'This income will be added to a savings goal',
  ejemploDescripcionRegistro: 'E.g.: Monthly shopping, salary, etc.',
  seleccionarMetaAhorro: 'Select Savings Goal',
  metasAhorroTitulo: 'Savings Goals',
  montoAportar: 'Contribution amount:',
  editarTopeMeta: 'Edit target',
  topeMetaActualizado: 'Goal target updated successfully.',
  errorActualizarTopeMeta: 'The savings goal target could not be updated.',
  agregarIngresoMeta: 'Add income',
  aporteSuperaLimiteMeta: 'The contribution exceeds the remaining goal amount.',
  elegirMeta: 'Choose a goal',
  sinMetasAhorro: 'You do not have any savings goals yet.',
  cancelarNuevaMeta: 'Cancel new goal',
  crearNuevaMeta: 'Create new goal',
  nuevaMetaAhorro: 'New Savings Goal',
  aporteAutomatico: 'The current contribution will be added automatically',
  nombreMeta: 'Goal name',
  ejemploNombreMeta: 'E.g.: Vacation, car, emergency fund',
  montoObjetivo: 'Target amount',
  crearMetaYAportar: 'Create goal and contribute',
  movimientosVaciosRecientes: 'No recent transactions',
  movimientosVaciosHistorial: 'No transactions in previous history',
  modificarMovimiento: 'Edit Transaction',
  ejemploDescripcionEdicion: 'E.g.: Monthly shopping, etc.',
  guardarCambios: 'Save Changes',
  cancelar: 'Cancel',
  eliminar: 'Delete',
  sinGastosPeriodo: 'No expenses recorded for this period.',
  estadisticaPeriodoMes: 'Current month breakdown',
  estadisticaPeriodoTrimestre: 'Last three months breakdown',
  estadisticaPeriodoAnual: 'Year-to-date breakdown',
  estadisticaPeriodoTodo: 'Full historical breakdown',
  estadisticaEvolucionMes: 'Monthly record',
  estadisticaEvolucionTrimestre: 'Last 3 months',
  estadisticaEvolucionAnual: 'Total balance for',
  estadisticaEvolucionTodo: 'Historical consolidated total',
  periodoMesActual: '(Current month)',
  presupuestoEstado: 'Active',
  configuracionIdiomaEspanol: 'Default language',
  configuracionIdiomaIngles: 'English language',
  activo: 'Active',
  conectado: 'Connected',
  cuentaAcceso: 'Account and Access',
  verificacionDosPasos: 'Two-step verification',
  ingresarCodigoSMS: 'Enter the 6-digit SMS code sent to your registered phone number',
  verificarEntrar: 'Verify and Sign In',
  iniciarSesionGestionar: 'Sign in to manage your finances',
  crearCuentaRespaldar: 'Create an account and back up your data',
  continuarGoogle: 'Continue with Google',
  usarCorreo: 'or use your email',
  iniciarSesion: 'Sign In',
  registrarse: 'Sign Up',
  correoElectronico: 'Email address',
  ejemploCorreo: 'example@email.com',
  contrasena: 'Password',
  confirmarContrasena: 'Confirm password',
  entrarConCorreo: 'Sign In with Email',
  crearCuenta: 'Create My Account',
  seguridadFirebase: 'Security and 2FA protected by Google Firebase',
  conectadoFirebase: 'Connected to Firebase',
  sincronizacionNubeInfo: 'Your local records can be synced and backed up to the cloud with Google Firebase.',
  sincronizando: 'Syncing...',
  respaldarNube: 'Back Up Data to the Cloud',
  cerrarSesion: 'Sign Out',
  nombreAplicacion: 'App',
  baseDatosSQLite: 'SQLite (Native engine)',
  sincronizacionFirebase: 'Google Firebase',
  errorGuardarMovimiento: 'Error saving',
  montoInvalido: 'Please enter a valid amount greater than 0',
  seleccionarCategoriaMensaje: 'Please select a category',
  ingresoGuardado: 'Income saved successfully!',
  gastoGuardado: 'Expense saved successfully!',
  aportarA: 'Contribute to',
  confirmarAporte: 'Confirm a contribution of',
  progresoActual: 'Current progress:',
  confirmar: 'Confirm',
  aporteRealizado: 'contributed to',
  errorAporte: 'Error making the contribution:',
  nombreMetaRequerido: 'Please enter a name for the goal',
  objetivoMetaRequerido: 'Please enter the goal target amount',
  errorCrearMeta: 'Error creating the goal:',
  movimientoNoEncontrado: 'The transaction to edit could not be found',
  movimientoActualizado: 'Transaction updated successfully!',
  errorActualizar: 'Error updating:',
  eliminarMovimientoTitulo: 'Delete transaction?',
  confirmarEliminarMovimiento: 'Are you sure you want to delete this transaction? This will update your balances and statistics.',
  movimientoEliminado: 'Transaction deleted successfully',
  errorEliminarMovimiento: 'Error deleting the transaction',
  inicioGoogleExitoso: 'Signed in with Google successfully!',
  correoValido: 'Please enter a valid email address',
  contrasenaMinima: 'Password must be at least 6 characters long',
  contrasenasNoCoinciden: 'Passwords do not match',
  errorProcesarSolicitud: 'Error processing the request',
  credencialesIncorrectas: 'Incorrect email or password',
  correoRegistrado: 'This email is already registered',
  contrasenaDebil: 'Password is too weak (at least 6 characters)',
  correoInvalido: 'Invalid email address format',
  codigoSmsEnviado: 'A verification code has been sent by SMS',
  errorEnviarCodigo: 'Error sending 2FA code:',
  codigoSmsRequerido: 'Enter the 6-digit SMS code',
  sesionDosFaExpirada: '2FA session expired. Please try again',
  verificacionDosFaExitosa: '2FA verification successful!',
  codigoSmsInvalido: 'Invalid or expired SMS code',
  sesionCerrada: 'Signed out successfully',
  errorCerrarSesion: 'Error signing out',
  movimientosRespaldados: 'transactions successfully backed up to Firestore!',
  errorRespaldarNube: 'Error backing up to the cloud:'
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private readonly STORAGE_KEY = 'balanzi_lang';
  private idiomaActualSubject: BehaviorSubject<Idioma>;
  public idiomaActual$: Observable<Idioma>;

  constructor(private ngZone: NgZone) {
    const guardado = (localStorage.getItem(this.STORAGE_KEY) as Idioma) || 'es';
    this.idiomaActualSubject = new BehaviorSubject<Idioma>(guardado);
    this.idiomaActual$ = this.idiomaActualSubject.asObservable();
    document.documentElement.lang = guardado;
  }

  get idiomaActual(): Idioma {
    return this.idiomaActualSubject.value;
  }

  get t(): Traducciones {
    return this.idiomaActual === 'en' ? EN : ES;
  }

  traducirCategoria(categoria: string): string {
    if (this.idiomaActual !== 'en') return categoria;
    const traducciones: Record<string, string> = {
      Alimentación: 'Food',
      Transporte: 'Transportation',
      Servicios: 'Utilities',
      Entretenimiento: 'Entertainment',
      Salud: 'Health',
      Educación: 'Education',
      'Otros Gastos': 'Other expenses',
      Salario: 'Salary',
      Honorarios: 'Fees',
      Ventas: 'Sales',
      Inversiones: 'Investments',
      Transferencias: 'Transfers',
      Ahorro: 'Savings',
      'Otros Ingresos': 'Other income'
    };
    return traducciones[categoria] || categoria;
  }

  traducirMetodoPago(metodo: string): string {
    if (this.idiomaActual !== 'en') return metodo;
    const traducciones: Record<string, string> = {
      Efectivo: 'Cash',
      'Tarjeta de Débito': 'Debit card',
      'Tarjeta de Crédito': 'Credit card',
      'Transferencia Bancaria': 'Bank transfer',
      'Billetera Virtual': 'Digital wallet'
    };
    return traducciones[metodo] || metodo;
  }

  traducirDescripcion(descripcion: string): string {
    if (this.idiomaActual !== 'en') return descripcion;
    const traducciones: Record<string, string> = {
      Supermercado: 'Grocery shopping',
      'Cobro de Honorarios': 'Fee payment received',
      'Pago de Luz': 'Electricity bill',
      'Venta producto': 'Product sale'
    };
    const prefijosAhorro = ['Ahorro → ', 'Savings → '];
    const prefijoAhorro = prefijosAhorro.find(prefijo => descripcion.startsWith(prefijo));
    if (prefijoAhorro) {
      return `Savings → ${this.traducirNombreMeta(descripcion.slice(prefijoAhorro.length))}`;
    }
    return traducciones[descripcion] || descripcion;
  }

  traducirNombreMeta(nombre: string): string {
    if (this.idiomaActual !== 'en') return nombre;
    return nombre === 'Fondo de Emergencia' ? 'Emergency Fund' : nombre;
  }

  traducirMes(texto: string): string {
    if (this.idiomaActual !== 'en') return texto;
    const meses: Record<string, string> = {
      enero: 'January',
      febrero: 'February',
      marzo: 'March',
      abril: 'April',
      mayo: 'May',
      junio: 'June',
      julio: 'July',
      agosto: 'August',
      septiembre: 'September',
      octubre: 'October',
      noviembre: 'November',
      diciembre: 'December'
    };
    return texto.replace(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/gi, mes => {
      const traduccion = meses[mes.toLowerCase()];
      return mes[0] === mes[0].toUpperCase()
        ? traduccion[0].toUpperCase() + traduccion.slice(1)
        : traduccion;
    });
  }

  cambiarIdioma(nuevoIdioma: Idioma) {
    if (this.idiomaActualSubject.value !== nuevoIdioma) {
      localStorage.setItem(this.STORAGE_KEY, nuevoIdioma);
      document.documentElement.lang = nuevoIdioma;
      this.ngZone.run(() => {
        this.idiomaActualSubject.next(nuevoIdioma);
      });
    }
  }

  traducirPeriodo(texto: string): string {
    if (this.idiomaActual !== 'en') return texto;
    return this.traducirMes(texto)
      .replace(' (Mes actual)', ' (Current month)')
      .replace(/^Año /, 'Year ')
      .replace(' (Total Anual)', ' (Yearly total)')
      .replace('Total Histórico (Todos los registros)', 'Historical Total (All transactions)');
  }

  traducirFecha(texto: string): string {
    if (this.idiomaActual !== 'en') return texto;
    const abreviaturas: Record<string, string> = {
      ene: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
      abr: 'Apr',
      may: 'May',
      jun: 'Jun',
      jul: 'Jul',
      ago: 'Aug',
      sep: 'Sep',
      oct: 'Oct',
      nov: 'Nov',
      dic: 'Dec'
    };
    return texto
      .replace(/\bHoy\b/g, 'Today')
      .replace(/\bAyer\b/g, 'Yesterday')
      .replace(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/gi, mes => {
        const traduccion = abreviaturas[mes.toLowerCase()];
        return mes[0] === mes[0].toUpperCase()
          ? traduccion[0].toUpperCase() + traduccion.slice(1)
          : traduccion;
      });
  }

}
