import { Injectable, NgZone } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  getAuth, 
  Auth, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  MultiFactorResolver
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movimiento } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private app: FirebaseApp;
  private db: Firestore;
  private auth: Auth;

  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);

    onAuthStateChanged(this.auth, (user) => {
      this.ngZone.run(() => {
        this.currentUserSubject.next(user);
        if (user) {
          console.log('Usuario autenticado en Firebase:', user.email);
        } else {
          console.log('Ningún usuario conectado en Firebase');
        }
      });
    });

    console.log('Firebase inicializado correctamente con el proyecto:', environment.firebaseConfig.projectId);
  }

  get firebaseApp(): FirebaseApp {
    return this.app;
  }

  get firestore(): Firestore {
    return this.db;
  }

  get firebaseAuth(): Auth {
    return this.auth;
  }

  get usuarioActual(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Inicia sesión con correo y contraseña
   */
  async iniciarSesion(email: string, pass: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      console.error('Error al iniciar sesión en Firebase:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión con cuenta de Google
   */
  async iniciarSesionGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  }

  /**
   * Obtiene el resolver para autenticación de dos factores (2FA / SMS)
   */
  obtenerResolver2FA(error: any): MultiFactorResolver {
    return getMultiFactorResolver(this.auth, error);
  }

  /**
   * Envía código de verificación por SMS para 2FA
   */
  async enviarCodigoSMS2FA(resolver: MultiFactorResolver, recaptchaVerifier: RecaptchaVerifier): Promise<string> {
    const phoneInfoOptions = {
      multiFactorHint: resolver.hints[0],
      session: resolver.session
    };
    const phoneAuthProvider = new PhoneAuthProvider(this.auth);
    return await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
  }

  /**
   * Resuelve el inicio de sesión con el código SMS ingresado por el usuario
   */
  async resolverInicioSesion2FA(resolver: MultiFactorResolver, verificationId: string, verificationCode: string): Promise<UserCredential> {
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    return await resolver.resolveSignIn(multiFactorAssertion);
  }

  /**
   * Registra una nueva cuenta de usuario
   */
  async crearCuenta(email: string, pass: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      console.error('Error al crear cuenta en Firebase:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión activa
   */
  async cerrarSesion(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Sube un movimiento a la colección de Firestore en la nube
   */
  async subirMovimientoNube(movimiento: Movimiento): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'movimientos'), {
        ...movimiento,
        usuario_email: this.usuarioActual?.email || 'anonimo',
        synced_at: new Date().toISOString()
      });
      console.log('Movimiento guardado en Firebase con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los movimientos respaldados en Firestore
   */
  async obtenerMovimientosNube(): Promise<any[]> {
    try {
      const q = query(collection(this.db, 'movimientos'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      const movimientos: any[] = [];
      querySnapshot.forEach((doc) => {
        movimientos.push({ id_firestore: doc.id, ...doc.data() });
      });
      return movimientos;
    } catch (error) {
      console.error('Error al leer de Firestore:', error);
      return [];
    }
  }

}
