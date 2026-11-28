import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { User, MultiFactorResolver, RecaptchaVerifier } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { DatabaseService } from '../services/database.service';
import { LanguageService, Traducciones } from '../services/language.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit, OnDestroy {

  modo: 'login' | 'registro' = 'login';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  cargando: boolean = false;
  usuarioActual: User | null = null;

  // 2FA / SMS state
  requiere2FA: boolean = false;
  codigo2FA: string = '';
  private mfaResolver: MultiFactorResolver | null = null;
  private verificationId2FA: string = '';
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  private subs: Subscription = new Subscription();

  get t(): Traducciones {
    return this.langService.t;
  }

  constructor(
    private firebaseService: FirebaseService,
    private dbService: DatabaseService,
    private toastController: ToastController,
    private router: Router,
    public langService: LanguageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.subs.add(
      this.firebaseService.currentUser$.subscribe(user => {
        this.ngZone.run(() => {
          this.usuarioActual = user;
          this.cdr.detectChanges();
        });
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

  async iniciarSesionGoogle() {
    if (this.cargando) return;
    this.cargando = true;
    try {
      await this.firebaseService.iniciarSesionGoogle();
      await this.mostrarToast(this.t.inicioGoogleExitoso, 'success');
      this.router.navigate(['/tabs/inicio']);
    } catch (error: any) {
      if (error?.code === 'auth/multi-factor-auth-required') {
        await this.manejarDesafio2FA(error);
      } else if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        console.error('Error Google Auth:', error);
        await this.mostrarToast(error?.message || this.t.errorProcesarSolicitud, 'danger');
      }
    } finally {
      this.ngZone.run(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }
  }

  async procesarAccion() {
    if (!this.email || !this.email.includes('@')) {
      await this.mostrarToast(this.t.correoValido, 'warning');
      return;
    }

    if (!this.password || this.password.length < 6) {
      await this.mostrarToast(this.t.contrasenaMinima, 'warning');
      return;
    }

    if (this.modo === 'registro') {
      if (this.password !== this.confirmPassword) {
        await this.mostrarToast(this.t.contrasenasNoCoinciden, 'warning');
        return;
      }
    }

    this.cargando = true;

    try {
      if (this.modo === 'login') {
        await this.firebaseService.iniciarSesion(this.email.trim(), this.password);
        await this.mostrarToast(this.langService.idiomaActual === 'en' ? 'Welcome back to BalanziApp!' : '¡Bienvenido de vuelta a BalanziApp!', 'success');
        this.router.navigate(['/tabs/inicio']);
      } else {
        await this.firebaseService.crearCuenta(this.email.trim(), this.password);
        await this.mostrarToast(this.langService.idiomaActual === 'en' ? 'Account created successfully in Firebase!' : '¡Cuenta creada exitosamente en Firebase!', 'success');
        this.router.navigate(['/tabs/inicio']);
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      if (error?.code === 'auth/multi-factor-auth-required') {
        await this.manejarDesafio2FA(error);
        return;
      }

      let mensaje = this.t.errorProcesarSolicitud;
      const code = error?.code || '';

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        mensaje = this.t.credencialesIncorrectas;
      } else if (code === 'auth/email-already-in-use') {
        mensaje = this.t.correoRegistrado;
      } else if (code === 'auth/weak-password') {
        mensaje = this.t.contrasenaDebil;
      } else if (code === 'auth/invalid-email') {
        mensaje = this.t.correoInvalido;
      } else if (error?.message) {
        mensaje = error.message;
      }

      await this.mostrarToast(mensaje, 'danger');
    } finally {
      this.ngZone.run(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }
  }

  /**
   * Maneja el flujo cuando Firebase exige 2FA (SMS)
   */
  private async manejarDesafio2FA(error: any) {
    try {
      this.mfaResolver = this.firebaseService.obtenerResolver2FA(error);

      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(this.firebaseService.firebaseAuth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      this.verificationId2FA = await this.firebaseService.enviarCodigoSMS2FA(this.mfaResolver, this.recaptchaVerifier);

      this.ngZone.run(() => {
        this.requiere2FA = true;
        this.cdr.detectChanges();
      });

      await this.mostrarToast(this.t.codigoSmsEnviado, 'primary');
    } catch (mfaError: any) {
      console.error('Error iniciando 2FA:', mfaError);
      await this.mostrarToast(`${this.t.errorEnviarCodigo} ${mfaError?.message || ''}`, 'danger');
    }
  }

  async verificarCodigo2FA() {
    if (!this.codigo2FA || this.codigo2FA.trim().length < 6) {
      await this.mostrarToast(this.t.codigoSmsRequerido, 'warning');
      return;
    }

    if (!this.mfaResolver || !this.verificationId2FA) {
      await this.mostrarToast(this.t.sesionDosFaExpirada, 'warning');
      this.cancelar2FA();
      return;
    }

    this.cargando = true;

    try {
      await this.firebaseService.resolverInicioSesion2FA(this.mfaResolver, this.verificationId2FA, this.codigo2FA.trim());
      await this.mostrarToast(this.t.verificacionDosFaExitosa, 'success');
      this.cancelar2FA();
      this.router.navigate(['/tabs/inicio']);
    } catch (error: any) {
      console.error('Error al resolver 2FA:', error);
      await this.mostrarToast(this.t.codigoSmsInvalido, 'danger');
    } finally {
      this.ngZone.run(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }
  }

  cancelar2FA() {
    this.requiere2FA = false;
    this.codigo2FA = '';
    this.mfaResolver = null;
    this.verificationId2FA = '';
  }

  async cerrarSesion() {
    try {
      await this.firebaseService.cerrarSesion();
      await this.mostrarToast(this.t.sesionCerrada, 'primary');
    } catch (error) {
      await this.mostrarToast(this.t.errorCerrarSesion, 'danger');
    }
  }

  async sincronizarConNube() {
    this.cargando = true;
    try {
      const movimientos = await this.dbService.getMovimientos();
      for (const mov of movimientos) {
        await this.firebaseService.subirMovimientoNube(mov);
      }
      await this.mostrarToast(this.langService.idiomaActual === 'en'
        ? `${movimientos.length} ${this.t.movimientosRespaldados}`
        : `¡${movimientos.length} ${this.t.movimientosRespaldados}`, 'success');
    } catch (error: any) {
      await this.mostrarToast(`${this.t.errorRespaldarNube} ${error?.message || ''}`, 'danger');
    } finally {
      this.ngZone.run(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

}
