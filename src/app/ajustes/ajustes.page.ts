import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LanguageService, Idioma, Traducciones } from '../services/language.service';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: false,
})
export class AjustesPage implements OnInit, OnDestroy {

  idiomaSeleccionado: Idioma = 'es';
  t: Traducciones;
  private subs: Subscription = new Subscription();

  constructor(
    private langService: LanguageService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.t = this.langService.t;
    this.idiomaSeleccionado = this.langService.idiomaActual;
  }

  ngOnInit() {
    this.subs.add(
      this.langService.idiomaActual$.subscribe(lang => {
        this.ngZone.run(() => {
          this.idiomaSeleccionado = lang;
          this.t = this.langService.t;
          this.cdr.detectChanges();
        });
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async onIdiomaChange(event: any) {
    const nuevoIdioma = event.detail.value as Idioma;
    if (nuevoIdioma && nuevoIdioma !== this.langService.idiomaActual) {
      this.langService.cambiarIdioma(nuevoIdioma);
      const msg = nuevoIdioma === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English';
      await this.mostrarToast(msg);
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

}
