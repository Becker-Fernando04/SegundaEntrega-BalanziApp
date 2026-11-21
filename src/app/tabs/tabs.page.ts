import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService, Traducciones } from '../services/language.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  standalone: false,
})
export class TabsPage implements OnInit, OnDestroy {

  t: Traducciones;
  private sub: Subscription = new Subscription();

  constructor(
    private langService: LanguageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.t = this.langService.t;
  }

  ngOnInit() {
    this.sub.add(
      this.langService.idiomaActual$.subscribe(() => {
        this.ngZone.run(() => {
          this.t = this.langService.t;
          this.cdr.detectChanges();
        });
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
